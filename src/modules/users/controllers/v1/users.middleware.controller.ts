import mongoose from "mongoose";
import User, { UserModel, USER_ROLES } from "@models/user.model";
import { Request, Response, NextFunction } from "express";
import * as responses from "@utils/formaters/responses";
import { Codes } from "@utils/constants/codes";
import { HttpStatus } from "@utils/constants/httpStatus";

interface RequestWithUserAndUserDoc extends Request {
  userDoc: UserModel;
}

/**
 * UserDoc middleware
 */
export function userByID(
  req: RequestWithUserAndUserDoc,
  res: Response,
  next: NextFunction,
  id: string
) {
  if (id === "me") {
    return next();
  } else {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return responses.sendError(
        res,
        Codes.AUTH__USER_NOT_FOUND,
        "UserId is invalid",
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }

    let fieldsToRemoveFromUserDoc = "";

    if (req.user.roles.includes(USER_ROLES.ADMIN)) {
      fieldsToRemoveFromUserDoc = "-salt -password -providerData";
    }

    User.findById(id, fieldsToRemoveFromUserDoc).exec(function(err, userDoc) {
      if (err) {
        return next(err);
      } else if (!userDoc) {
        return responses.sendError(
          res,
          Codes.AUTH__USER_NOT_FOUND,
          "No user with that identifier has been found",
          HttpStatus.NOT_FOUND
        );
      }
      req.userDoc = userDoc;
      next();
    });
  }
}
