import SherpaOnnx from 'sherpa-onnx-node'
import {Voice} from "../../../defined/ttsengine";
import Type from "./woker-type.ts";

let _offlineTts: SherpaOnnx.OfflineTts | null = null

const init = (config: SherpaOnnx.OfflineTtsConfig): SherpaOnnx.OfflineTts => {
    if (!_offlineTts) {
        _offlineTts = new SherpaOnnx.OfflineTts(config)
    } else if (JSON.stringify(_offlineTts.config) !== JSON.stringify(config)) {
        // 配置变更，重新实例化
        _offlineTts = new SherpaOnnx.OfflineTts(config)
    }
    return _offlineTts
}

const getVoices = (e: MessageEvent<[Type.Speakers, SherpaOnnx.OfflineTtsConfig]>) => {
    const tts = init(e.data[1])
    const voices: Voice[] = []
    for (let i = 0; i < tts.numSpeakers; i++) {
        voices.push({name: `音色 ${i + 1}`, value: i.toString()})
    }
    postMessage(voices)
}

const generate = (e: MessageEvent<[Type, SherpaOnnx.OfflineTtsConfig, Parameters<SherpaOnnx.OfflineTts['generate']>[0]]>) => {
    const tts = init(e.data[1])
    const data = tts.generate(e.data[2])
    postMessage(data)
}

function handleMessage(e: MessageEvent<[Type.Speakers, SherpaOnnx.OfflineTtsConfig]>): void;
function handleMessage(e: MessageEvent<[Type.Generation, SherpaOnnx.OfflineTtsConfig, Parameters<SherpaOnnx.OfflineTts['generate']>[0]]>): void;
function handleMessage(e: MessageEvent): void {
    switch (e.data[0]) {
        case Type.Speakers:
            getVoices(e)
            break
        case Type.Generation:
            generate(e)
            break
    }
}

onmessage = handleMessage