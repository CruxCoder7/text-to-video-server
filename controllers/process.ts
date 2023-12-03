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

class Processor {
  static async processPdf(req: Request, res: Response) {
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")

    const pdfFilePath = req.file?.path
    const pdfBuffer = fs.readFileSync(pdfFilePath as string)
    if (!pdfBuffer) throw new Error("Error parsing PDF")

    const pdfText = await PdfParse(pdfBuffer)
    if (!pdfText) throw new Error("Error in reading PDF")
    res.write(`data: Summarizing \n\n`)

    await Processor.uploadFile(pdfFilePath as string)

    const gpt_response = await GPT(pdfText.text as unknown as string)
    const img_prompts = gpt_response.image_prompts.map(
      (data: { prompt: string }) => data.prompt
    )

    console.log(gpt_response)
    console.log(img_prompts)

    res.write(`data: Translating to various languages\n\n`)

    const translated_text = await Translate(gpt_response.summarized_text, "ta")

    res.write(`data: Generating Audio files\n\n`)

    const audioData = await TextToSpeech(translated_text, "male", "ta")
    console.log(audioData.audio[0].audioContent)

    await prisma.video.create({
      data: {
        audio_url: {
          english: audioData.audio[0].audioContent,
        },
        content: "Video 2",
        video_url: {
          english: audioData.audio[0].audioContent,
        },
      },
    })

    res.write(`data: Generating Images\n\n`)

    let img_index = 1
    for (const img_prompt of img_prompts) {
      await GenerateImages(img_prompt, img_index)
      img_index += 1
    }

    const img_paths = fs.readdirSync("../images")
    res.write(`data: Enhancing Images\n\n`)

    let enhanced_img_index = 1
    for (const img_path of img_paths) {
      await EnhanceImage(`../images/${img_path}`, enhanced_img_index)
      enhanced_img_index += 1
    }
    res.write("data: DONE!\n\n")

    res.end()
    res.on("close", () => {
      console.log("Client Closed Conn")
      res.end()
    })
  }

  static async uploadFile(file_name: string) {
    const fileBuffer = fs.readFileSync(`../nodejs_backend/${file_name}`)
    const file = new File([fileBuffer], file_name)

    const response = await utapi.uploadFiles(file)
    console.log(response.data)
    console.log(response.error)
  }

  static async processText(req: Request, res: Response) {}
}

export default Processor
