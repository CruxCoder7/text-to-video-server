import axios from "axios"

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
}

type GPTResponse = {
  summarized_text: string
  image_prompts: { prompt: string }[]
  video_title: string
}

export const GPT = async (input_text: string): Promise<GPTResponse> => {
  const content = `${input_text}
                \nSummarize the above text IN LESS THAN OR EQUAL TO 512 WORDS.DO NOT EXCEED 512 words.Identify keywords from the text and 
                generate prompts for each keyword that will help in finding an image thorugh google search.
                You MUST ALWAYS return just a json with the summarized text with the key of summarized_text and image prompts as
                an array of objects with key image_prompts and the every object inside the array should have just one key with the 
                name prompt. Also give a title for the paragraph, with video_title as the key.Do not return the data in any other format. Do not return in markdown or plain text.
                Only return JSON.
                `
  const data = {
    prompt: `[INST] ${content} [/INST]\n`,
    model: "meta/llama-2-70b-chat",
    systemPrompt: "You are a helpful assistant.",
    temperature: 0.75,
    topP: 0.9,
    maxTokens: 800,
    image: null,
    audio: null,
  }

  try {
    const response = await axios.post(
      process.env.GPT_ENDPOINT as string,
      data,
      {
        headers,
      }
    )
    if (typeof response.data !== "object") return await GPT(input_text)
    if (response.status === 429 || response.status === 500)
      return await GPT(input_text)
    if (response.status === 200) return response.data
  } catch (err) {
    console.log(err)
    process.exit(1)
  }

  throw new Error("Unexpected response from API")
}
