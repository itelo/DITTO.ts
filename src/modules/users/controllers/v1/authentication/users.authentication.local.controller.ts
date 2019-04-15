import passport from "passport";
import User, { UserModel, USER_PROVIDERS } from "@models/user.model";

import { Request, Response, NextFunction } from "express";
import * as errorHandler from "@utils/errorHandler";
import { ErrorHandler } from "types/utils/errorHandler";
import {
  configureUserAndToken,
  sanitizeUser
} from "@modules/users/config/strategies/jwt";
import { Codes } from "@utils/constants/codes";
import { HttpStatus } from "@utils/constants/httpStatus";
import * as responses from "@utils/formaters/responses";
import { ProviderUserProfile } from "@modules/users/config/strategies/facebook";
import qs from "qs";

export async function signup(req: Request, res: Response) {
  // For security measurement we remove the roles from the req.body object
  req.body.roles = undefined;

  // Init user and add missing fields
  const user = new User(req.body);

  user.provider = USER_PROVIDERS.LOCAL;

  // Then save the user
  try {
    const userDoc = (await user.save()) as UserModel;

    const data = configureUserAndToken(userDoc);

    return responses.sendSuccessful(res, data, HttpStatus.OK);
  } catch (err) {
    // console.log(err);
    const {
      code,
      message,
      status
    } = errorHandler.getErrorMessageCodeAndHttpStatus(err);
    responses.sendError(res, code, message, status);
  }
}

/**
 * Singin api, provide a way to the user get the user and token
 * to sign, the email and password is required, the login can be
 * also achieve by username and password
 */
export async function signin(req: Request, res: Response) {
  // first search user by email
  const { email, password, username } = req.body;
  const query = [];

  if (email) {
    query.push({ email: email.toLowerCase() });
  }

  if (username) {
    query.push({ username: username.toLowerCase() });
  }

  const field = !email ? "username" : "email";

  return User.findOne({
    $or: query
  })
    .then(async (userDoc: UserModel) => {
      // then validate the password of the user founded
      if (!userDoc) {
        const message = `Cound not found any user with that ${field} `;
        return responses.sendError(
          res,
          Codes.AUTH__USER_NOT_FOUND,
          message,
          HttpStatus.UNPROCESSABLE_ENTITY
        );
      } else if (userDoc.provider !== "local") {
        let additionalProvidersName: any = [];
        if (userDoc.additional_providers_data) {
          additionalProvidersName = Object.keys(
            userDoc.additional_providers_data
          );
        }
        const providers = [userDoc.provider, ...additionalProvidersName];
        return res.json({
          message: `auth/provider-not-local:${providers}`
        });
      } else if (!userDoc.authenticate(password)) {
        const message = `The password not match if the ${field} you passed`;
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

export function me(req: Request, res: Response) {
  return responses.sendSuccessful(res, sanitizeUser(req.user));
}
