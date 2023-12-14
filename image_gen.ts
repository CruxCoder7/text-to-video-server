import axios from "axios"
import { createWriteStream, existsSync, mkdirSync } from "fs"
import { join } from "path"
import dotenv from "dotenv"
import { queue } from "./queue/queue"
dotenv.config()

const isValidImage = (img: string) => {
  if (img.includes(".jpg") || img.includes(".jpeg") || img.includes(".png"))
    return true
  return false
}

const api_key = process.env.SERP_API_KEY as string

export async function GenerateImages(img_prompt: string, count: number) {
  const res = await fetch(
    `${process.env.SERPAPI_ENDPOINT}&q=${img_prompt}&api_key=${api_key}&gl=in&ijn=1`
  )
  const data = await res.json()
  let imageUrl = ""
  for (let idx = 0; idx < data.images_results.length; idx++) {
    if (isValidImage(data.images_results[idx].original)) {
      imageUrl = data.images_results[idx].original
      break
    }
  }

  const saveDirectory = "../images"

  if (!existsSync(saveDirectory)) mkdirSync(saveDirectory, { recursive: true })

  const fileName = `downloaded_image_${count}.jpg`

  const filePath = join(saveDirectory, fileName)

  try {
    const imgDownloadData = await axios({
      method: "get",
      url: imageUrl,
      responseType: "stream",
    })

    if (imgDownloadData.status === 200) {
      const writer = createWriteStream(filePath)
      imgDownloadData.data.pipe(writer)
      console.log(`Image downloaded to ${filePath}`)

      return new Promise((resolve, reject) => {
        writer.on("finish", () => {
          queue.add("imageQueue", { imageUrl: filePath })
          resolve(true)
        })
        writer.on("error", reject)
      })
    }
  } catch (error) {
    console.log(error)
  }
}
