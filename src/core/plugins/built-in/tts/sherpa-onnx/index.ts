import path from 'path'
import fs from 'fs'
import SherpaOnnx from 'sherpa-onnx-node'
import {EndCallback, NextCallback, TextToSpeechEngine, TTSOptions, Voice} from "../../../defined/ttsengine";
import {RequireItem} from "../../../defined/plugins";
import {isUndefined} from "../../../../is";
import {chunkArray} from "../../../../utils";
import Type from "./woker-type.ts";

// 加载模型和合成都是 CPU 密集型任务，放到单独的线程里去做避免 UI 卡顿
const worker = new Worker(new URL('./worker', import.meta.url), {type: 'module'})

export class SherpaOnnxTTSEngine implements TextToSpeechEngine {
    public static readonly ID = 'xakQdDksRfXQzS3RG2';
    public static readonly TYPE = 2;
    public static readonly GROUP = '(内置)TTS';
    public static readonly NAME = 'Sherpa Onnx TTS Engine';
    public static readonly VERSION = '1.0.0';
    public static readonly VERSION_CODE = 0;
    public static readonly PLUGIN_FILE_URL = '';
    public static readonly REQUIRE: Record<string, RequireItem> = {
        Folder: {
            label: '模型文件夹',
            type: 'string',
            default: '',
            description: '前往 https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models 下载模型，并解压。',
            placeholder: '输入绝对路径',
        },
        Model: {
            label: '模型文件',
            type: 'string',
            default: 'model.onnx',
            description: '存在模型文件夹中，后缀为 .onnx 的文件。',
            placeholder: 'model.onnx',
        },
        Tokens: {
            label: 'Tokens 文件',
            type: 'string',
            default: 'tokens.txt',
            description: '存在模型文件夹中，一般命名为 tokens.txt。',
            placeholder: 'tokens.txt',
        },
        Lexicon: {
            label: 'Lexicon 文件',
            type: 'string',
            default: '',
            description: '存在模型文件夹中，一般命名为 lexicon.txt，没有则不填。',
            placeholder: 'lexicon.txt',
        },
        DataDir: {
            label: '数据文件夹',
            type: 'string',
            default: '',
            description: '存在模型文件夹中，没有则不填。',
            placeholder: 'data',
        },
        DictDir: {
            label: '字典文件夹',
            type: 'string',
            default: '',
            description: '存在模型文件夹中，一般命名为 dict，没有则不填。',
            placeholder: 'dict',
        },
        NumThreads: {
            label: '线程数',
            type: 'number',
            default: 16,
            description: '运行模型使用的线程数，越大越快，相应的性能要求越高。',
            placeholder: '16',
        },
        Provider: {
            label: '设备',
            type: 'list',
            default: 'cpu',
            data: [{name: 'CPU', id: 'cpu'}, {name: 'CUDA', id: 'cuda'}],
            description: '运行模型使用的设备。',
            placeholder: 'cpu',
        },
    };

    get folder(): string {
        const folder = SherpaOnnxTTSEngine.REQUIRE.Folder.value
        if (!fs.existsSync(folder)) {
            throw new Error(`${SherpaOnnxTTSEngine.REQUIRE.Folder.label}不存在`)
        }
        const stats = fs.statSync(folder)
        if (!stats.isDirectory()) {
            throw new Error(`${SherpaOnnxTTSEngine.REQUIRE.Folder.label}不存在`)
        }
        return folder
    }

    private getUndefinableField(field: RequireItem, type: 'folder' | 'file'): string | undefined {
        if (!field.value) {
            return undefined
        }
        const item = path.join(this.folder, field.value)
        if (!fs.existsSync(item)) {
            throw new Error(`${field.label}不存在`)
        }
        const stats = fs.statSync(item)
        switch (type) {
            case 'file':
                if (!stats.isFile()) {
                    throw new Error(`${field.label}不存在`)
                }
                break
            case 'folder':
                if (!stats.isDirectory()) {
                    throw new Error(`${field.label}不存在`)
                }
                break
            default:
                throw new Error('未知类型')
        }
        return item
    }

    private getRequiredField(field: RequireItem, type: 'folder' | 'file'): string {
        const item = this.getUndefinableField(field, type)
        if (!item) {
            throw new Error(`${field.label}不存在`)
        }
        return item
    }

    private get offlineTtsConfig(): SherpaOnnx.OfflineTtsConfig {
        return {
            model: {
                vits: {
                    model: this.getRequiredField(SherpaOnnxTTSEngine.REQUIRE.Model, 'file'),
                    tokens: this.getRequiredField(SherpaOnnxTTSEngine.REQUIRE.Tokens, 'file'),
                    lexicon: this.getUndefinableField(SherpaOnnxTTSEngine.REQUIRE.Lexicon, 'file'),
                    dataDir: this.getUndefinableField(SherpaOnnxTTSEngine.REQUIRE.DataDir, 'folder'),
                    dictDir: this.getUndefinableField(SherpaOnnxTTSEngine.REQUIRE.DictDir, 'folder'),
                },
                debug: false,
                numThreads: SherpaOnnxTTSEngine.REQUIRE.NumThreads.value,
                provider: SherpaOnnxTTSEngine.REQUIRE.Provider.value,
            },
            maxNumSentences: 1
        }
    }

    async getVoiceList(): Promise<Voice[]> {
        return new Promise((resolve, reject) => {
            const msgCb = (e: MessageEvent) => {
                worker.removeEventListener('message', msgCb)
                resolve(e.data)
            }
            const msgErrCb = (e: MessageEvent) => {
                worker.removeEventListener('messageerror', msgErrCb)
                reject(e.data)
            }
            const errCb = (e: ErrorEvent) => {
                worker.removeEventListener('error', errCb)
                reject(e.error)
            }
            worker.addEventListener('message', msgCb)
            worker.addEventListener('messageerror', msgErrCb)
            worker.addEventListener('error', errCb)
            worker.postMessage([Type.Speakers, this.offlineTtsConfig])
        })
    }

    async transform(texts: string[], options: TTSOptions, next: NextCallback, end: EndCallback): Promise<void> {
        const {
            signal,
            start,
            maxLineWordCount
        } = options;
        let _start = !isUndefined(start) ? start : 0;
        let _maxLineWordCount = isUndefined(maxLineWordCount) || maxLineWordCount < 100 || maxLineWordCount > 300 ? 300 : maxLineWordCount;
        const toBlob = async (text: string): Promise<Blob> => {
            if (!/([\u4e00-\u9fa5]|[a-z0-9])+/igm.test(text)) {
                return new Blob()
            }
            const sid = parseInt(options.voice || '0')
            return new Promise((resolve, reject) => {
                const msgCb = (e: MessageEvent) => {
                    worker.removeEventListener('message', msgCb)
                    const bytes = getWavBytes(e.data)
                    resolve(new Blob([bytes], {type: 'audio/wav'}))
                }
                const msgErrCb = (e: MessageEvent) => {
                    worker.removeEventListener('messageerror', msgErrCb)
                    reject(e.data)
                }
                const errCb = (e: ErrorEvent) => {
                    worker.removeEventListener('error', errCb)
                    reject(e.error)
                }
                worker.addEventListener('message', msgCb)
                worker.addEventListener('messageerror', msgErrCb)
                worker.addEventListener('error', errCb)
                worker.postMessage(
                    [Type.Generation, this.offlineTtsConfig, {text, sid, speed: 1, enableExternalBuffer: false}]
                )
            })
        }
        for (let i = _start; i < texts.length; i++) {
            if (signal.aborted) {
                break;
            }
            const text = texts[i];
            const chunks = chunkArray(Array.from(text), _maxLineWordCount);
            for (let j = 0; j < chunks.length; j++) {
                const t = chunks[j].join('');
                const blob = await toBlob(t);
                next({
                    blob,
                    index: j
                }, i);
            }
        }
        end();
    }
}

// https://stackoverflow.com/questions/62172398/convert-audiobuffer-to-arraybuffer-blob-for-wav-download#62173861
// Returns Uint8Array of WAV bytes
function getWavBytes(result: ReturnType<SherpaOnnx.OfflineTts['generate']>) {
    const buffer = result.samples.buffer

    const numFrames = buffer.byteLength / Float32Array.BYTES_PER_ELEMENT

    const headerBytes = getWavHeader(result, numFrames)
    const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);

    // prepend header, then add pcmBytes
    wavBytes.set(headerBytes, 0)
    wavBytes.set(new Uint8Array(buffer), headerBytes.length)

    return wavBytes
}

// adapted from https://gist.github.com/also/900023
// returns Uint8Array of WAV header bytes
function getWavHeader(result: ReturnType<SherpaOnnx.OfflineTts['generate']>, numFrames: number) {
    const numChannels = 1
    const sampleRate = result.sampleRate
    const bytesPerSample = 4
    const format = 3

    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = numFrames * blockAlign

    const buffer = new ArrayBuffer(44)
    const dv = new DataView(buffer)

    let p = 0

    function writeString(s: string) {
        for (let i = 0; i < s.length; i++) {
            dv.setUint8(p + i, s.charCodeAt(i))
        }
        p += s.length
    }

    function writeUint32(d: number) {
        dv.setUint32(p, d, true)
        p += 4
    }

    function writeUint16(d: number) {
        dv.setUint16(p, d, true)
        p += 2
    }

    writeString('RIFF')              // ChunkID
    writeUint32(dataSize + 36)       // ChunkSize
    writeString('WAVE')              // Format
    writeString('fmt ')              // Subchunk1ID
    writeUint32(16)                  // Subchunk1Size
    writeUint16(format)              // AudioFormat https://i.sstatic.net/BuSmb.png
    writeUint16(numChannels)         // NumChannels
    writeUint32(sampleRate)          // SampleRate
    writeUint32(byteRate)            // ByteRate
    writeUint16(blockAlign)          // BlockAlign
    writeUint16(bytesPerSample * 8)  // BitsPerSample
    writeString('data')              // Subchunk2ID
    writeUint32(dataSize)            // Subchunk2Size

    return new Uint8Array(buffer)
}