import prisma from "../db"
import { Request, Response } from "express"

class Videos {
  static async getAll(req: Request, res: Response) {
    const videos = await prisma.video.findMany({
      orderBy: {
        id: "desc",
      },
    })
    return res.json(videos)
  }

  static async get(req: Request, res: Response) {
    const { id } = req.params
    const video = await prisma.video.findFirst({
      where: {
        id,
      },
    })

    if (!video) return res.json([])
    return res.json(video)
  }
}

export default Videos
