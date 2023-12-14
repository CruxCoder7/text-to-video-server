import { Queue, Worker } from "bullmq"
import { utapi } from "../routes/uploadthing"
import fs from "fs"

const connectionOption = {
  connection: {
    connectTimeout: 10000,
  },
}

const queue = new Queue("imageQueue", connectionOption)
const worker = new Worker(
  "imageQueue",
  async (job) => {
    const { imageUrl: imgUrl } = job.data
    const fileBuffer = fs.readFileSync(imgUrl)
    const file = new File([fileBuffer], imgUrl)

    try {
      const response = await utapi.uploadFiles(file)
      if (response && response.data) return { img: response.data.url }
    } catch (error) {
      console.log(error)
    }
  },
  connectionOption
)

worker.on("ready", async () => {
  await queue.clean(0, 1000, "completed")
  console.log("Worker ready")
})

worker.on("completed", () => console.log("Job Completed"))

export { queue, worker }
