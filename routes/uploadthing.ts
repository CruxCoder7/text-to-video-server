import { UTApi } from "uploadthing/server"
import { config } from "dotenv"
config()

export const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_SECRET,
})
