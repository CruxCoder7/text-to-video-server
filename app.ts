import cors from "cors"
import express, { urlencoded } from "express"
import fs from "fs"
import { EnhanceImage } from "./gan"
import { GPT } from "./gpt"
import { GenerateImages } from "./image_gen"
import multer from "multer"
import pdfParser from "pdf-parse"

const app = express()

app.use(cors())
app.use(express.json())
app.use(urlencoded({ extended: true }))

type PromptType = {
  prompt: string
}

const storage = multer.memoryStorage() // implement diskStorage to store the PDFs

const upload = multer({ storage })

// pipeline test
app.get("/", async (_req, res) => {
  const input_text = `   
    Prime Minister Shri Narendra Modi will inaugurate the  Akhil Bharatiya Shiksha Samagam on 29th July 2023 at Bharat Mandapam, Pragati Maidan in Delhi at 10 AM. It coincides with  the 3rd anniversary of National Education Policy 2020. 
    During the programme, Prime Minister will release the first instalment of funds under the PM SHRI Scheme. These schools will nurture students in a way that they become engaged, productive, and contributing citizens for building an equitable, inclusive, and plural society as envisaged by National Education Policy (NEP) 2020. Prime Minister will also release education and skill curriculum books translated into 12 Indian languages.
    Guided by the vision of the Prime Minister, NEP 2020 was launched with a view to groom the youth and prepare them for leading the country in Amrit Kaal. It aims to prepare them for meeting the challenges of the future, while keeping them grounded in basic human values. During the three years of its implementation the policy has brought radical transformation in the realms of school, higher and skill education. The two day programme, being held on 29th and 30th July, will provide a platform for academics, sector experts, policy makers, industry representatives, teachers and students from schools, higher education and skilling institutions, among others, to share their insights, success stories and best practices in implementing the NEP 2020 and work out strategies for taking it further ahead.
    The Akhil Bhartiya Shiksha Samagam will include sixteen sessions, in which discussions will be held on themes including Access to Quality Education and Governance, Equitable and Inclusive Education, Issues of Socio-Economically Disadvantaged Group, National Institute Ranking Framework, Indian knowledge System, Internationalisation of Education, among others.
    `
  const response = await GPT(input_text)
  const img_prompts = response.image_prompts.map(
    (data: PromptType) => data.prompt
  )
  await GenerateImages(img_prompts)

  const img_paths = fs.readdirSync("images")

  for (const img_path of img_paths) {
    let i = 1
    await EnhanceImage(`images/${img_path}`, i)
    i += 1
  }

  res.send("DONE")
})
// sse test
app.get("/stream", (_req, res) => {
  console.log("Client Conn")
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Access-Control-Allow-Origin", "*")

  let count = 0
  const maxCount = 10

  const intervalId = setInterval(() => {
    if (count < maxCount) {
      const date = new Date().toLocaleString()
      res.write(`data: ${date}\n\n`)
      count++
    } else {
      console.log("Closing connection after sending 10 messages")
      clearInterval(intervalId)
      res.end()
    }
  }, 1000)

  res.on("close", () => {
    console.log("Client Closed Conn")
    clearInterval(intervalId)
    res.end()
  })
})

let fileBuffer: Buffer

// pdf upload routes
app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No PDF file uploaded" })
  }

  fileBuffer = req.file.buffer

  res.status(200).json({ msg: "PDF Uploaded" })
})
app.get("/pdf", async (_req: express.Request, res: express.Response) => {
  res.setHeader("Content-Type", "text/event-stream")
  res.setHeader("Cache-Control", "no-cache")
  res.setHeader("Connection", "keep-alive")

  const pdfText = await pdfParser(fileBuffer)
  if (!pdfText) {
    res.status(500)
    console.log("Error parsing JSON")
  }

  res.write(`data: Parsed PDF \n\n`)
  console.log(pdfText.text)

  setTimeout(() => {
    res.write(`data: Summarizing \n\n`)
  }, 500)

  const resp = await GPT(pdfText.text as unknown as string)
  console.log(resp.summarized_text)
  res.write(`data: Summarized\n\n`)

  res.on("close", () => {
    console.log("Client Closed Conn")
    res.end()
  })
})

// text upload routes
app.post("/upload-text", async (req, res) => {
  const input_text: { data: string } = req.body
  console.log(input_text.data)

  const resp = await GPT(input_text.data)

  console.log(resp.image_prompts)
  console.log(resp.summarized_text)

  res.status(200).json({ msg: "Text Uploaded" })
})

app.listen(5000, () => console.log("Listening in 5000"))
