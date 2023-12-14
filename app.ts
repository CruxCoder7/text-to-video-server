import cors from "cors"
import { config } from "dotenv"
import express, { urlencoded } from "express"
import processRouter from "./routes/process"
import uploadRouter from "./routes/upload"
import videosRouter from "./routes/videos"
config()

const app = express()

app.use(cors())
app.use(express.json())
app.use(urlencoded({ extended: true }))

app.use("/upload", uploadRouter)
app.use("/process", processRouter)
app.use("/videos", videosRouter)

app.get("/test", async (req, res) => {
  const key = process.env.GOOGLE_SEARCH_API_KEY as string
  const cx = process.env.GOOGLE_SEARCH_API_CX as string
  const q = "backend"
  const data = await fetch(
    `${process.env.GOOGLE_SEARCH_API_ENDPOINT}?key=${key}&cx=${cx}&q=${q}`
  )
  const resp = await data.json()
  res.json(resp)
})

app.listen(5000, () => console.log("Listening in 5000"))
