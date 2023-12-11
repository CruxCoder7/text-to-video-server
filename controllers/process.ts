import { Request, Response } from "express"
import fs from "fs"
import PdfParse from "pdf-parse"
import { EnhanceImage } from "../gan"
import { GPT } from "../gpt"
import { GenerateImages } from "../image_gen"
import { Translate } from "../translation"
import { TextToSpeech } from "../tts"
import { utapi } from "../routes/uploadthing"
import prisma from "../db"
import axios from "axios"

class Processor {
  static async processPdf(req: Request, res: Response) {
    res.setHeader("Content-Type", "text/event-stream")

    const pdfFilePath = req.file?.path
    const pdfBuffer = fs.readFileSync(pdfFilePath as string)

    const pdfText = await PdfParse(pdfBuffer)
    res.write(`data: Summarizing \n\n`)

    await Processor.uploadFile(pdfFilePath as string, "nodejs_backend")

    const gpt_response = await GPT(pdfText.text as unknown as string)
    res.write(`data:summary${gpt_response.summarized_text}\n\n`)

    const img_prompts = gpt_response.image_prompts
      .map((data: { prompt: string }) => data.prompt)
      .slice(0, 5)

    console.log(gpt_response)
    console.log(img_prompts)

    res.write(`data: Translating to various languages\n\n`)

    const translated_text = await Translate(gpt_response.summarized_text, "en")

    res.write(`data: Generating Audio files\n\n`)

    const audioData = await TextToSpeech(translated_text, "male", "en")
    console.log(audioData.audio[0].audioContent)

    const audio_name = `${
      gpt_response.video_title ? `${gpt_response.video_title}_audio` : "Audio"
    }`

    const binaryData = Buffer.from(audioData.audio[0].audioContent, "base64")
    const outputFilePath = `../audios/${audio_name}.wav`
    fs.writeFileSync(outputFilePath, binaryData)
    const audio_url = await Processor.uploadFile(audio_name + ".wav", "audios")

    const { id: video_id } = await prisma.video.create({
      data: {
        audio_url: {
          english: audio_url,
        },
        content: gpt_response.summarized_text,
        title: gpt_response.video_title || "Backend Video 2",
        video_url: {
          english: audio_url,
        },
      },
    })

    res.write(`data:audio${audio_url}\n\n`)
    res.write(`data: Generating Images\n\n`)

    let img_index = 1
    for (const img_prompt of img_prompts) {
      await GenerateImages(img_prompt, img_index, video_id)
      img_index += 1
    }

    const img_paths = fs.readdirSync("../images")
    res.write(`data: Enhancing Images\n\n`)

    let enhanced_img_index = 1
    for (const img_path of img_paths) {
      await EnhanceImage(`../images/${img_path}`, enhanced_img_index)
      enhanced_img_index += 1
    }

    const video_name = `${
      gpt_response.video_title ? `${gpt_response.video_title}_video` : "Video"
    }`

    res.write(`data: Generating video\n\n`)
    const data = await axios.post("http://localhost:5555/video", {
      video_id,
      video_name,
      audio_name,
    })

    console.log(data.data)

    const video_url = await Processor.uploadFile(video_name + ".mp4", "videos")
    await prisma.video.update({
      where: {
        id: video_id,
      },
      data: {
        video_url: {
          english: video_url,
        },
      },
    })

    res.write(`data:video${video_url}\n\n`)

    res.end()
    res.on("close", () => {
      console.log("Client Closed Conn")
      res.end()
    })
  }

  static async uploadFile(file_name: string, path: string) {
    const fileBuffer = fs.readFileSync(`../${path}/${file_name}`)
    const file = new File([fileBuffer], file_name)
    const data = await utapi.uploadFiles(file)
    console.log(data)
    if (!data || !data.data) throw new Error("UploadError")
    return data.data.url
  }

  static async processText(req: Request, res: Response) {}
}

export default Processor
