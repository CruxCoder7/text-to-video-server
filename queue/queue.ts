import { Queue, Worker } from "bullmq"
import { utapi } from "../routes/uploadthing"
import fs from "fs"
import prisma from "../db"

const connectionOption = {
  connection: {
    connectTimeout: 10000,
  },
}

const queue = new Queue("imageQueue", connectionOption)
const worker = new Worker(
  "imageQueue",
  async (job) => {
    const { imageUrl: imgUrl, video_id } = job.data
    const fileBuffer = fs.readFileSync(imgUrl)
    const file = new File([fileBuffer], imgUrl)

    try {
      const response = await utapi.uploadFiles(file)
      if (response && response.data)
        await prisma.video.update({
          where: { id: video_id },
          data: {
            images: {
              push: response.data.url,
            },
            enhanced_images: {
              push: response.data.url,
            },
          },
        })
      return { success: true }
    } catch (error) {
      console.log(error)
    }
  },
  connectionOption
)

worker.on("ready", () => console.log("Worker ready"))
worker.on("completed", () => console.log("Job Completed"))

export default queue
