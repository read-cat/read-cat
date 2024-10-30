import { isUndefined } from "../../../is"
import { chunkArray } from "../../../utils"
import { escapeXML } from "../../../utils/html"
import { PluginConstructorParams, RequireItem } from "../../defined/plugins"
import { EndCallback, NextCallback, TextToSpeechEngine, TTSOptions, Voice } from "../../defined/ttsengine"

type VoiceListItem = {
    LocalName: string
    Gender: string
    LocaleName: string
    ShortName: string
}

const VoiceListStoreKey = 'voice-list'

export class AzureTTSEngine implements TextToSpeechEngine {
    public static readonly ID = '7GXzGCrruIOlO1D1';
    public static readonly TYPE = 2;
    public static readonly GROUP = '(内置)TTS';
    public static readonly NAME = 'Azure TTS Engine';
    public static readonly VERSION = '1.1.1';
    public static readonly VERSION_CODE = 0;
    public static readonly PLUGIN_FILE_URL = '';
    public static readonly REQUIRE: Record<string, RequireItem> = {
        Region: {
            label: '位置/区域',
            type: 'string',
            default: 'eastasia',
            description: '前往 https://portal.azure.com/ 获取。',
            placeholder: 'eastasia',
        },
        SubscriptionKey: {
            label: '密钥',
            type: 'password',
            default: '',
            description: '前往 https://portal.azure.com/ 获取。',
            placeholder: '3453......',
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
        const vl = body
            .map(item => ({ name: `${item.LocalName} / ${item.Gender} / ${item.LocaleName}`, value: item.ShortName }))
            .sort((...items) => {
                const ws = [0, 0]
                for (let i = 0; i < 2; i++) {
                    const item = items[i]
                    if (item.value.includes('Multilingual')) {
                        ws[i] += 1 << 0
                    }
                    if (item.value.includes('zh')) {
                        ws[i] += 1 << 1
                    }
                    if (item.value.includes('CN')) {
                        ws[i] += 1 << 2
                    }
                }
                return ws[1] - ws[0]
            })
        await this.store.setStoreValue(VoiceListStoreKey, vl)
        return vl
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
            }).catch(e => {
                if (signal.aborted) {
                    // 返回一个无意义的响应
                    return new Response(new ArrayBuffer(0), { status: 200 })
                }
                throw new Error('连接服务失败', { cause: e })
            })
            if (!res.ok) {
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
                next({
                    blob: new Blob([body], { type: 'audio/mp3' }),
                    index: j
                }, i);
            }
        }
        end();
    }

    protected async createSSML(text: string, opts: TTSOptions): Promise<string> {
        let voiceList = await this.store.getStoreValue(VoiceListStoreKey) as (Voice[] | null)
        if (!voiceList) {
            voiceList = await this.getVoiceList()
        }
        if (voiceList.length === 0) {
            throw new Error('未找到发音人')
        }
        const voice = opts.voice || voiceList[0].value

        // https://learn.microsoft.com/zh-cn/azure/ai-services/speech-service/speech-synthesis-markup-voice#adjust-prosody
        // range: 0.5 ~ 2 / -50% ~ 100%, default: 1 / 0%
        const rate = !isUndefined(opts.rate) ? `${Math.round(opts.rate*100)}%` : '1';
        // range: 0.0 ~ 100.0, default: 100
        const volume = !isUndefined(opts.volume) ? `${opts.volume * 100}` : '100';

        // payload 是 XML，特殊字符需要转义才能确保正确性
        text = escapeXML(text)
        return (
            `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">` +
            `<voice name="${voice}">` +
            `<prosody rate="${rate}" volume="${volume}">` +
            text +
            '</prosody>' +
            '</voice>' +
            '</speak>'
        )
    }
}