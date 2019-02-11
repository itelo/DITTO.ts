import { Response } from "express";
import { Codes } from "@utils/constants/codes";
import { HttpStatus } from "@utils/constants/httpStatus";

/**
 * A function that encapsuled the error data to send to client
 * in a cleaner way
 *
 * @param {Response} res the express Response object
 * @param {Codes} code our own errors code to help us debug and handle errors, e.g. auth/user-not-found
 * @param {string} message a custom message with more details to user
 * @param {HttpStatus} status http status code
 */
export function sendError(
  res: Response,
  code: Codes,
  message: string,
  status: HttpStatus
) {
  res.status(status).json({
    success: false,
    error: {
      message,
      status,
      code
    }
  });
}

/**
 * A function that encapsuled the successful data to send to client
 * in a cleaner way
 *
 * @param {Response} res the express Response object
 * @param {any} data the data to send to client
 * @param {HttpStatus} status http status code
 */
export function sendSuccessful(
  res: Response,
  data: any,
  status: HttpStatus = 200
) {
  res.status(status).json({
    success: true,
    data
  });
}
