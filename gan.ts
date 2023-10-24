import fs from "fs"
import path from "path"
import { Esrgan } from "./utils/EsrGAN"

const apiKey = process.env.ESRGAN_API_KEY as string

const esr = new Esrgan(apiKey)

const copyImage = (image: string) => {
  const sourcePath = path.join(__dirname, "../images", image)
  const destinationPath = path.join(__dirname, "../enhanced_images", image)

  const sourceStream = fs.createReadStream(sourcePath)
  const destinationStream = fs.createWriteStream(destinationPath)

  sourceStream.pipe(destinationStream)

  destinationStream.on("finish", () => {
    console.log(
      `Error occurred, ${image} copied successfully to enhanced_images folder.`
    )
  })

  sourceStream.on("error", (err) => {
    console.error("Error copying file:", err)
  })

  destinationStream.on("error", (err) => {
    console.error("Error writing file:", err)
  })
}

export const EnhanceImage = async (image: string, count: number) => {
  try {
    console.log("Enhancing: " + image)
    const response = await esr.generate({ image })
    if (response.status === 200) {
      const saveDirectory = "../enhanced_images"
      const fileName = `downloaded_image_${count}.jpg`

      if (!fs.existsSync(saveDirectory)) {
        fs.mkdirSync(saveDirectory, { recursive: true })
      }

      const filePath = path.join(saveDirectory, fileName)

      const writer = fs.createWriteStream(filePath)
      response.data.pipe(writer)
      console.log(`Enhanced ${image}_${count}`)
      return new Promise((resolve, reject) => {
        writer.on("finish", resolve)
        writer.on("error", reject)
      })
    }
  } catch (error) {}
}
