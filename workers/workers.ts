import { Job } from "bullmq"
import { utapi } from "../routes/uploadthing"
import fs from "fs"
import { Translate } from "../translation"
import { TextToSpeech } from "../tts"
import Processor from "../controllers/process"
import axios from "axios"
import prisma from "../db"
import { ImageQueueJobData, VideoQueueJobData } from "../queue/queue"

export async function imageQueueWorkerJob(job: Job<ImageQueueJobData>) {
  const { imageUrl } = job.data
  const fileBuffer = fs.readFileSync(imageUrl)
  const file = new File([fileBuffer], imageUrl)

  try {
    const response = await utapi.uploadFiles(file)
    if (response && response.data) return { img: response.data.url }
  } catch (error) {
    console.log(error)
  }
}

// needs summarized_text, id of video, target_language, audio_name, video_name
export async function videoQueueWorkerJob(job: Job<VideoQueueJobData>) {
  // translate summarized_text to tamil
  // tamil text to tamil audio - tts
  // generate tamil video
  const { summarized_text, video_id, target_language, audio_name, video_name } =
    job.data

  const translated_summarized_text = await Translate(
    summarized_text,
    target_language
  )

  const audio_response = await TextToSpeech(
    translated_summarized_text,
    "male",
    target_language
  )

  const tamil_audio_base64 = audio_response.audio[0].audioContent

  const binaryData = Buffer.from(tamil_audio_base64, "base64")
  const outputFilePath = `../audios/${audio_name}_tamil.wav`
  fs.writeFileSync(outputFilePath, binaryData)
  const audio_url = await Processor.uploadFile(
    outputFilePath,
    audio_name + "_tamil.wav"
  )

  await axios.post("http://localhost:5555/video", {
    video_name: video_name + "_tamil",
    audio_name: audio_name + "_tamil",
  })

  const video_url = await Processor.uploadFile(
    `../videos/${video_name}_tamil.mp4`,
    video_name + "_tamil.mp4"
  )

  console.log("SEC WRITE")

  await prisma.video.update({
    where: { id: video_id },
    data: {
      audio_url: {
        update: {
          tamil: audio_url,
        },
      },
      video_url: {
        update: {
          tamil: video_url,
        },
      },
    },
  })
}
