import express from "express"
import Videos from "../controllers/videos"

const videosRouter = express.Router()

videosRouter.get("/", Videos.getAll)
videosRouter.get("/:id", Videos.get)

export default videosRouter
