import { TranslationResponse } from "./translation"

export type TextToSpeechResponse = {
  taskType: "tts"
  audio: [
    {
      audioContent: string
      audioUri: null
    }
  ]
  config: {
    audioFormat: "wav"
    language: {
      sourceLanguage: string
      sourceScriptCode: ""
    }
    encoding: "base64"
    samplingRate: 22050
  }
}

export const TextToSpeech = async (
  translated_response: TranslationResponse,
  gender: "male" | "female",
  sourceLanguage: string
) => {
  const audio_payload = {
    controlConfig: { dataTracking: true },
    input: [{ source: translated_response.output[0].target }],
    config: { gender, language: { sourceLanguage } },
  }

  const audio_data = await fetch(process.env.TTS_ENDPOINT as string, {
    method: "POST",
    body: JSON.stringify(audio_payload),
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
      "Content-Type": "application/json",
    },
  })

  const audio_resp: TextToSpeechResponse = await audio_data.json()
  return audio_resp
}
