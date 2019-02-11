import UserAdmin, {
  UserAdminModel as AdminModel
} from "@models/admin.model";
import { Request, Response } from "express";
import * as errorHandler from "@utils/errorHandler";
import { ErrorHandler } from "types/utils/errorHandler";
import { configureUserAndToken } from "@modules/users/config/strategies/jwt";

import { Codes } from "@utils/constants/codes";
import { HttpStatus } from "@utils/constants/httpStatus";
import * as responses from "@utils/formaters/responses";

export async function signin(req: Request, res: Response) {
  // first search user by email
  const { email, password } = req.body;

  return UserAdmin.findOne({ email: email.toLowerCase() })
    .then((userDoc: AdminModel) => {
      // console.log(userDoc);
      // then validate the password of the user founded
      if (!userDoc) {
        const message = "Cound not found any user with that email";
        return responses.sendError(
          res,
          Codes.AUTH__USER_NOT_FOUND,
          message,
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      } else if (!userDoc.authenticate(password)) {
        const message = "The password not match if the email you passed";
        return responses.sendError(
          res,
          Codes.AUTH__WRONG_PASSWORD,
          message,
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      } else {
        const data = configureUserAndToken(userDoc);
        return responses.sendSuccessful(res, data, HttpStatus.OK);
      }
    })
    .catch((err: ErrorHandler) => {
      const {
        code,
        message,
        status
      } = errorHandler.getErrorMessageCodeAndHttpStatus(err);
      responses.sendError(res, code, message, status);
    });
}
