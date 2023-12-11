export type TranslationResponse = {
  taskType: "translation"
  output: [
    {
      source: string
      target: string
    }
  ]
  config: null
}

export const Translate = async (source: string, target_language: string) => {
  const translation_payload = {
    controlConfig: { dataTracking: true },
    input: [{ source }],
    config: {
      serviceId: "",
      language: {
        sourceLanguage: "en",
        targetLanguage: target_language,
        targetScriptCode: null,
        sourceScriptCode: null,
      },
    },
  }

  if (target_language === "en") {
    const data: TranslationResponse = {
      taskType: "translation",
      output: [
        {
          source: source,
          target: source,
        },
      ],
      config: null,
    }
    return data
  }

  const translation_data = await fetch(
    process.env.TRANSLATION_ENDPOINT as string,
    {
      method: "POST",
      body: JSON.stringify(translation_payload),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
        "Content-Type": "application/json",
      },
    }
  )

  const translation_resp: TranslationResponse = await translation_data.json()
  return translation_resp
}
