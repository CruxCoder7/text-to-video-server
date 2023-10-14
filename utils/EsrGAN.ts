import fs from "fs"
import axios from "axios"
import path from "path"

const toB64 = (imgPath: string) => {
  const data = fs.readFileSync(path.resolve(imgPath))
  return Buffer.from(data).toString("base64")
}

type GanInput = {
  image: string
  scale?: number
}

export class Esrgan {
  private url: string
  private apiKey: string

  constructor(apiKey: string) {
    this.url = "https://api.segmind.com/v1/esrgan"
    this.apiKey = apiKey
  }

  async generate(data: GanInput) {
    if (this.apiKey === null)
      throw new Error("Not authenticated. Please add API Key.")
    if (data.image === "") throw new Error("Please enter a valid image path")

    data = {
      image: toB64(data.image || "https://www.segmind.com/butterfly.png"),
      scale: data.scale || 2,
    }

    return axios({
      url: this.url,
      data: JSON.stringify(data),
      method: "post",
      responseType: "stream",
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
        "x-api-key": `${this.apiKey}`,
      },
    })
  }
}
