import express from "express"
import Processor from "../controllers/process"
import { fileMiddleware } from "../controllers/upload"

const processRouter = express.Router()

processRouter.get("/pdf", fileMiddleware, Processor.processPdf)

export default processRouter
