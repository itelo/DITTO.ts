import { Request, Response, NextFunction } from "express";
import * as responses from "@utils/formaters/responses";
import { Codes } from "@utils/constants/codes";
import { HttpStatus } from "@utils/constants/httpStatus";
import { validationResult } from "express-validator/check";
import { handleWithExpressValidationErrors } from "@utils/formaters/validations";

export default function middlewareValidation(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const errors = validationResult(req);

  // check if the request contain any validation error
  if (!errors.isEmpty()) {
    const result = handleWithExpressValidationErrors(req, errors.array());

    // check if our function extract the error
    if (result.hasError) {
      return responses.sendError(
        res,
        result.error.code,
        result.error.message,
        result.error.status
      );
    } else {
      // send a default message to guaranted that the error pass to our program
      return responses.sendError(
        res,
        Codes.UNKNOWN_ERROR,
        "Your request did not match if our specification and we could not find the reason",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  } else {
    next();
  }
}
