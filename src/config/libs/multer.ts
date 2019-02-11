import { Express } from "express";
import multer from "multer";

export function imageFileFilter(
  req: Express.Request,
  file: Express.Multer.File,
  callback: Function
) {
  if (
    file.mimetype !== "image/png" &&
    file.mimetype !== "image/jpg" &&
    file.mimetype !== "image/jpeg" &&
    file.mimetype !== "image/gif"
  ) {
    const err: Error = new Error();
    // err.code = "UNSUPPORTED_MEDIA_TYPE";
    return callback(err, false);
  }
  callback(undefined, true);
}
