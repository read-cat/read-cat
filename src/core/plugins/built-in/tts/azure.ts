import { isUndefined } from "../../../is"
import { chunkArray } from "../../../utils"
import { PluginConstructorParams, RequireItem } from "../../defined/plugins"
import { EndCallback, NextCallback, TextToSpeechEngine, TTSOptions, Voice } from "../../defined/ttsengine"

type VoiceListItem = {
    LocalName: string
    Gender: string
    Locale: string
    ShortName: string
}

const VoiceListStoreKey = 'voice-list'

// Azure 的 TTS 有些特殊字符会导致接口调用失败
// 调用的时候就统一替换
// 替换后的字符两边加上空格便于区分
const replacingMap = {
    '&': ' and 号 ',
}

export class AzureTTSEngine implements TextToSpeechEngine {
    public static readonly ID = '7GXzGCrruIOlO1D1';
    public static readonly TYPE = 2;
    public static readonly GROUP = '(内置)TTS';
    public static readonly NAME = 'Azure TTS Engine';
    public static readonly VERSION = '1.0.0';
    public static readonly VERSION_CODE = 0;
    public static readonly PLUGIN_FILE_URL = '';
    public static readonly REQUIRE: Record<string, RequireItem> = {
        Region: {
            label: '位置/区域',
            type: 'string',
            default: 'eastasia',
            description: '位置/区域',
            placeholder: '位置/区域',
        },
        SubscriptionKey: {
            label: '密钥',
            type: 'password',
            default: '',
            description: '密钥',
            placeholder: '密钥',
        },
    };

    private store;
    constructor(options: PluginConstructorParams) {
        const { store } = options;
        this.store = store;
    }

    get region(): string {
        const v = AzureTTSEngine.REQUIRE.Region.value
        if (!v) {
            throw new Error('未配置位置/区域')
        }
        return v
    }

    get subscriptionKey(): string {
        const v = AzureTTSEngine.REQUIRE.SubscriptionKey.value
        if (!v) {
            throw new Error('未配置密钥')
        }
        return v
    }

    get commonHeaders(): Record<string, string> {
        return { 'Ocp-Apim-Subscription-Key': this.subscriptionKey, 'User-Agent': 'ReadCat' }
    }

    get voiceListEndpoint(): string {
        return `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/voices/list`
    }

    async getVoiceList(): Promise<Voice[]> {
        const res = await fetch(this.voiceListEndpoint, {
            headers: this.commonHeaders,
        }).catch((e) => Promise.reject(new Error('连接服务失败', { cause: e })))
        if (!res.ok) {
            throw new Error(`Invalid status: ${res.status}`)
        }
        const body = await res.json() as VoiceListItem[]
        await this.store.setStoreValue(VoiceListStoreKey, body)
        return body
            .map(item => ({ name: `${item.LocalName} (${item.Gender}, ${item.Locale})`, value: item.ShortName }))
            .sort((a, b) => {
                const sa = a.value.slice(3, 5) === 'CN'
                const sb = b.value.slice(3, 5) === 'CN'
                if (sa && !sb) {
                    return -1
                }
                if (!sa && sb) {
                    return 1
                }
                return a.value < b.value ? -1 : 1
            })
    }

    get transformEndpoint(): string {
        return `https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`
    }

    async transform(texts: string[], options: TTSOptions, next: NextCallback, end: EndCallback): Promise<void> {
        const {
            signal,
            start,
            maxLineWordCount
        } = options;
        let _start = !isUndefined(start) ? start : 0;
        let _maxLineWordCount = isUndefined(maxLineWordCount) || maxLineWordCount < 100 || maxLineWordCount > 300 ? 300 : maxLineWordCount;
        const toBuffer = async (text: string) => {
            if (!/([\u4e00-\u9fa5]|[a-z0-9])+/igm.test(text)) {
                return new ArrayBuffer(0)
            }
            // 特殊字符可能造成请求失败
            Object.entries(replacingMap).forEach(([k, v]) => {
                text = text.replaceAll(k, v)
            })
            const ssml = await this.createSSML(text, options)
            const res = await fetch(this.transformEndpoint, {
                signal,
                method: 'POST',
                headers: {
                    ...this.commonHeaders,
                    'Content-Type': 'application/ssml+xml',
                    'X-Microsoft-OutputFormat': 'audio-48khz-192kbitrate-mono-mp3',
                },
                body: ssml
            }).catch(e => Promise.reject(new Error('连接服务失败', { cause: e })))
            if (!res.ok) {
                console.log('text:', text)
                throw new Error(`Azure 错误码：${res.status}`);
            }
            return await res.arrayBuffer();
        }
        for (let i = _start; i < texts.length; i++) {
            if (signal.aborted) {
                break;
            }
            const text = texts[i];
            const chunks = chunkArray(Array.from(text), _maxLineWordCount);
            for (let j = 0; j < chunks.length; j++) {
                const t = chunks[j].join('');
                const body = await toBuffer(t);
                if (body.byteLength === 0) {
                    continue
                }
                next({
                    blob: new Blob([body], { type: 'audio/mp3' }),
                    index: j
                }, i);
            }
        }
        end();
    }

    protected async createSSML(text: string, opts: TTSOptions): Promise<string> {
        const voice = opts.voice
        if (!voice) {
            throw new Error('未选择发音人')
        }
        const rate = !isUndefined(opts.rate) ? `${Math.floor(opts.rate * 100)}%` : '0%';
        const volume = !isUndefined(opts.volume) ? `${Math.floor(opts.volume * 100)}%` : '0%';
        const voiceList = await this.store.getStoreValue(VoiceListStoreKey) as VoiceListItem[]
        let locale = ''
        for (const vi of voiceList) {
            if (vi.ShortName === voice) {
                locale = vi.Locale
                break
            }
        }
        if (!locale) {
            throw new Error(`未找到发音人： ${voice}`)
        }
        return (
            `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">` +
            `<voice name="${voice}">` +
            `<prosody rate="${rate}" volume="${volume}">` +
            text +
            '</prosody>' +
            '</voice>' +
            '</speak>'
        )
    }
}