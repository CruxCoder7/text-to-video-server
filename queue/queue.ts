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
    const imgUrl = job.data.imageUrl
    const fileBuffer = fs.readFileSync(imgUrl)
    const file = new File([fileBuffer], imgUrl)

    const response = await utapi.uploadFiles(file)
    console.log(response.data)

    return { success: true }
  },
  connectionOption
)

worker.on("ready", () => console.log("Worker ready"))
worker.on("completed", () => {
  console.log("Job Completed")
})

export default queue
