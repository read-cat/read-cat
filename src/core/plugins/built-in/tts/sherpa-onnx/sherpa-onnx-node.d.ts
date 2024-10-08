declare module 'sherpa-onnx-node' {
    type OfflineTtsConfig = {
        model: {
            vits: {
                model: string
                tokens: string
                lexicon?: string
                dataDir?: string
                dictDir?: string
            }
            debug: boolean,
            numThreads: number,
            provider: 'cpu' | 'cuda'
        },
        maxNumSentences: number,
    }

    type GenConfig = {
        text: string
        sid: number
        speed: number
        enableExternalBuffer: boolean
    }

    type GenResult = {
        sampleRate: number
        samples: Float32Array
    }

    class OfflineTts {
        constructor(config: OfflineTtsConfig)

        config: OfflineTtsConfig
        numSpeakers: number
        generate: (config: GenConfig) => GenResult
    }

    export {
        OfflineTts,
        OfflineTtsConfig,
    }
}