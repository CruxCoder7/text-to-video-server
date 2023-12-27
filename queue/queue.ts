import { Queue, Worker } from "bullmq"
import { imageQueueWorkerJob, videoQueueWorkerJob } from "../workers/workers"

const connectionOption = {
  connection: {
    connectTimeout: 10000,
  },
}

export const QUEUE_NAMES = {
  imageQueue: "imageQueue",
  videoQueue: "videoQueue",
}

export type VideoQueueJobData = {
  summarized_text: string
  video_id: string
  target_language: string
  audio_name: string
  video_name: string
}

export type ImageQueueJobData = {
  imageUrl: string
}

const imageQueue = new Queue<ImageQueueJobData>(
  QUEUE_NAMES.imageQueue,
  connectionOption
)
const videoQueue = new Queue<VideoQueueJobData>(
  QUEUE_NAMES.videoQueue,
  connectionOption
)
const imageWorker = new Worker(
  QUEUE_NAMES.imageQueue,
  imageQueueWorkerJob,
  connectionOption
)

imageWorker.on("ready", async () => {
  await imageQueue.clean(0, 1000, "completed")
  console.log("Image Worker ready")
})

imageWorker.on("completed", () => console.log("Image Job Completed"))

const videoWorker = new Worker(
  QUEUE_NAMES.videoQueue,
  videoQueueWorkerJob,
  connectionOption
)

videoWorker.on("ready", async () => {
  await videoQueue.clean(0, 1000, "completed")
  console.log("Video Worker ready")
})

videoWorker.on("completed", () => console.log("Worker Job Completed"))

export { imageQueue, videoQueue }
