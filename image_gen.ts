import axios from "axios"
import { existsSync, mkdirSync, createWriteStream } from "fs"
import { join } from "path"

const isValidImage = (img: string) => {
  if (img.includes(".jpg") || img.includes(".jpeg") || img.includes(".png"))
    return true
  return false
}

const api_key =
  "d99683db03932999a1798511a0108a2b8b47b1347a4f5b13dca8d9b8b2d0b1e1"

export async function GenerateImages(IMAGE_PROMPTS: string[]) {
  let i = 1
  for (const img_prompt of IMAGE_PROMPTS) {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_images&q=${img_prompt}&api_key=${api_key}&gl=in&ijn=1`
    )
    const data = await res.json()

    let imageUrl = ""
    for (let idx = 0; idx < data.images_results.length; idx++) {
      if (isValidImage(data.images_results[idx].original)) {
        imageUrl = data.images_results[idx].original
        break
      }
    }

    const saveDirectory = "./images"
    const fileName = `downloaded_image_${i}.jpg`

    if (!existsSync(saveDirectory)) {
      mkdirSync(saveDirectory, { recursive: true })
    }

    const filePath = join(saveDirectory, fileName)
    i += 1

    axios({
      method: "get",
      url: imageUrl,
      responseType: "stream",
    })
      .then((response) => {
        const writer = createWriteStream(filePath)
        response.data.pipe(writer)

        return new Promise((resolve, reject) => {
          writer.on("finish", resolve)
          writer.on("error", reject)
        })
      })
      .then(() => {
        console.log(`Image downloaded to ${filePath}`)
      })
      .catch((error) => {
        console.error("Error downloading image:", error)
      })
  }
}
