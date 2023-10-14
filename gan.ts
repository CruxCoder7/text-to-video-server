import fs from "fs"
import path from "path"
import { Esrgan } from "./utils/EsrGAN"

const apiKey = "SG_9674d976dcde6861"

const esr = new Esrgan(apiKey)

export const EnhanceImage = async (image: string, count: number) => {
  esr
    .generate({
      image,
    })
    .then((response) => {
      if (response.status === 200) {
        const saveDirectory = "./enhanced_images"
        const fileName = `downloaded_image_${count}.jpg`

        if (!fs.existsSync(saveDirectory)) {
          fs.mkdirSync(saveDirectory, { recursive: true })
        }

        const filePath = path.join(saveDirectory, fileName)

        const writer = fs.createWriteStream(filePath)
        response.data.pipe(writer)

        count += 1

        return new Promise((resolve, reject) => {
          writer.on("finish", resolve)
          writer.on("error", reject)
        })
      }
    })
    .catch((err) => console.log(err))
}
