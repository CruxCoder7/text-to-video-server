;(async () => {
  const translation_payload = {
    controlConfig: { dataTracking: true },
    input: [{ source: "Hello there my friend. How are you doing today?" }],
    config: {
      serviceId: "",
      language: {
        sourceLanguage: "en",
        targetLanguage: "ta",
        targetScriptCode: null,
        sourceScriptCode: null,
      },
    },
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

  const translation_resp = await translation_data.json()
  console.log(translation_resp)

  const audio_payload = {
    controlConfig: { dataTracking: true },
    input: [{ source: translation_resp.output[0].target }],
    config: { gender: "male", language: { sourceLanguage: "ta" } },
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

  const audio_resp = await audio_data.json()
  console.log(audio_resp)
})()
