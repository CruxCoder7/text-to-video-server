import express from "express"
import multer from "multer"
import Uploader from "../controllers/upload"

const uploadRouter = express.Router()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, "uploads/")
  },
  filename: (_req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  },
})

const upload = multer({ storage })

uploadRouter.post("/pdf", upload.single("file"), Uploader.uploadPdf)
uploadRouter.post("/text", Uploader.uploadText)

export default uploadRouter
