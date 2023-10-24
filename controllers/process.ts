import { Request, Response } from "express"
import fs from "fs"
import PdfParse from "pdf-parse"
import { EnhanceImage } from "../gan"
import { GPT } from "../gpt"
import { GenerateImages } from "../image_gen"

class Processor {
  static async processPdf(req: Request, res: Response) {
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")

    const pdfFilePath = req.file?.path
    const pdfBuffer = fs.readFileSync(pdfFilePath!)
    if (!pdfBuffer) throw new Error("Error parsing PDF")

    const pdfText = await PdfParse(pdfBuffer)
    if (!pdfText) throw new Error("Error in reading PDF")
    res.write(`data: Summarizing \n\n`)

    const gpt_response = await GPT(pdfText.text as unknown as string)
    const img_prompts = gpt_response.image_prompts.map(
      (data: { prompt: string }) => data.prompt
    )
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
}

export default Processor
