import type { NextFunction, Request, Response } from "express"

let file: Express.Multer.File
export const fileMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  req.file = file
  return next()
}

class Uploader {
  static async uploadPdf(req: Request, res: Response) {
    if (!req.file) throw new Error("No file uploaded")
    file = req.file
    res.json({ msg: "File Uploaded" })
  }

  static async uploadText(req: Request, res: Response) {}
}

export default Uploader
