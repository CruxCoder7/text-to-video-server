import express from "express"
import Processor from "../controllers/process"
import { fileMiddleware } from "../controllers/upload"

const processRouter = express.Router()

processRouter.get("/pdf", fileMiddleware, Processor.processPdf)
processRouter.get("/text", Processor.processText)

export default processRouter
