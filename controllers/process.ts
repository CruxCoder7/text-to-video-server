import { Request, Response } from "express";
import fs from "fs";
import PdfParse from "pdf-parse";
import { EnhanceImage } from "../gan";
import { GPT } from "../gpt";
import { GenerateImages } from "../image_gen";
import { Translate } from "../translation";
import { TextToSpeech } from "../tts";
import { utapi } from "../routes/uploadthing";
import prisma from "../db";
import axios from "axios";
import { QUEUE_NAMES, imageQueue, videoQueue } from "../queue/queue";
import { Job } from "bullmq";
import { ObjectId } from "mongodb";

class Processor {
  static async processPdf(req: Request, res: Response) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'no-cache');

    const video_id = new ObjectId().toString();

    const pdfFilePath = req.file?.path;
    const pdfBuffer = fs.readFileSync(pdfFilePath as string);

    const pdfText = await PdfParse(pdfBuffer);
    res.write(`data: Summarizing \n\n`);

    await Processor.uploadFile(`./${pdfFilePath}`, pdfFilePath as string);

    const gpt_response = await GPT(pdfText.text as unknown as string);
    res.write(`data:summary${gpt_response.summarized_text}\n\n`);

    const img_prompts = gpt_response.image_prompts
      .map((data: { prompt: string; }) => data.prompt)
      .slice(0, 5);

    console.log(gpt_response);
    console.log(img_prompts);

    res.write(`data: Translating to various languages\n\n`);

    const translated_text = await Translate(gpt_response.summarized_text, "en");

    res.write(`data: Generating Audio files\n\n`);

    const audioData = await TextToSpeech(translated_text, "male", "en");
    console.log(audioData.audio[0].audioContent);

    const audio_name = `${gpt_response.video_title ? `${gpt_response.video_title}_audio` : "Audio"
      }`;

    const binaryData = Buffer.from(audioData.audio[0].audioContent, "base64");
    const outputFilePath = `../audios/${audio_name}.wav`;
    fs.writeFileSync(outputFilePath, binaryData);
    const audio_url = await Processor.uploadFile(
      `../audios/${audio_name}.wav`,
      audio_name + ".wav"
    );

    res.write(`data:audio${audio_url}\n\n`);
    res.write(`data: Generating Images\n\n`);

    let img_index = 1;
    for (const img_prompt of img_prompts) {
      await GenerateImages(img_prompt, img_index);
      img_index += 1;
    }

    const img_paths = fs.readdirSync("../images");
    res.write(`data: Enhancing Images\n\n`);

    let enhanced_img_index = 1;
    for (const img_path of img_paths) {
      await EnhanceImage(`../images/${img_path}`, enhanced_img_index);
      enhanced_img_index += 1;
    }

    const video_name = `${gpt_response.video_title ? `${gpt_response.video_title}_video` : "Video"
      }`;

    videoQueue.add(QUEUE_NAMES.videoQueue, {
      audio_name,
      video_name,
      video_id,
      summarized_text: gpt_response.summarized_text,
      target_language: "ta",
    });

    res.write(`data: Generating video\n\n`);
    const data = await axios.post("http://localhost:5555/video", {
      video_name,
      audio_name,
    });

    console.log(data.data);

    const video_url = await Processor.uploadFile(
      `../videos/${video_name}.mp4`,
      video_name + ".mp4"
    );

    res.write(`data:video${video_url}\n\n`);

    const jobs = await imageQueue.getCompleted();
    console.log(jobs);

    const img_urls: string[] = jobs.map(
      (job: Job<{}, { img: string; }>) => job.returnvalue.img
    );
    console.log(img_urls);
    console.log("MAIN WRITE");

    await prisma.video.create({
      data: {
        id: video_id,
        audio_url: {
          english: audio_url,
        },
        video_url: {
          english: video_url,
        },
        title: gpt_response.video_title,
        content: gpt_response.summarized_text,
        images: img_urls,
        enhanced_images: img_urls,
      },
    });

    await imageQueue.clean(0, 1000, "completed");

    res.end();
    res.on("close", () => {
      console.log("Client Closed Conn");
      res.end();
    });
  }

  static async uploadFile(path: string, file_name: string) {
    const fileBuffer = fs.readFileSync(path);
    const file = new File([fileBuffer], file_name);
    const data = await utapi.uploadFiles(file);
    console.log(data);
    if (!data || !data.data) throw new Error("UploadError");
    return data.data.url;
  }

  static async processText(req: Request, res: Response) { }
}

export default Processor;
