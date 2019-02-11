import { UserModel } from "@models/user.model";
import { model } from "mongoose";
const User = model("User");

import { Request, Response } from "express";
import * as errorHandler from "@utils/errorHandler";
import { ErrorHandler } from "types/utils/errorHandler";
import { configureUserAndToken } from "@modules/users/config/strategies/jwt";

import { Codes } from "@utils/constants/codes";
import { HttpStatus } from "@utils/constants/httpStatus";
import * as responses from "@utils/formaters/responses";

export async function signup(req: Request, res: Response) {
  // For security measurement we remove the roles from the req.body object
  req.body.roles = undefined;

  // Init user and add missing fields
  // @ts-ignore
  const user: UserModel = new User(req.body);
  user.provider = "local";
  user.display_name = `${user.first_name} ${user.last_name}`;

  // Then save the user
  try {
    const userDoc: UserModel = await user.save();
    const data = configureUserAndToken(userDoc);
    // res.json(data);
    return responses.sendSuccessful(res, data, HttpStatus.OK);
  } catch (err) {
    console.log(err);
    const {
      code,
      message,
      status
    } = errorHandler.getErrorMessageCodeAndHttpStatus(err);
    responses.sendError(res, code, message, status);
  }
}

/**
 * Singin api, provide a way  to the user get the user and token
 * to sign, the email and password is required, the login can be
 * also achieve by username and password
 *
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
      // console.log(userDoc);
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
          // @ts-ignore
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
