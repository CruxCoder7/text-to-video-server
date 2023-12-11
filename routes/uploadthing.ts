import { UTApi } from "uploadthing/server"
import dotenv from "dotenv"
dotenv.config()

export const utapi = new UTApi({
  apiKey: process.env.UPLOADTHING_SECRET,
})
