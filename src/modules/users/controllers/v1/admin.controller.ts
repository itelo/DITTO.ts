import mongoose from "mongoose";
import configStack from "@config/index";
import User, { SafeUser, UserModel } from "@models/user.model";
import { sanitizeUser } from "@modules/users/config/strategies/jwt";
import multer from "multer";
import { Request, Response, NextFunction } from "express";
import { imageFileFilter } from "@config/libs/multer";
import { resizeUploadToFirebaseAndGetURL } from "@utils/images";
import * as responses from "@utils/formaters/responses";
import { getPaginatedDocumentsFromRequest } from "@utils/models/pagination";
import { Codes } from "@utils/constants/codes";
import { HttpStatus } from "@utils/constants/httpStatus";

interface RequestWithUser extends Request {
  user: UserModel;
}

interface RequestWithUserAndUserDoc extends RequestWithUser {
  userDoc: UserModel;
}

/**
 * Get a User
 */
export async function read(req: RequestWithUserAndUserDoc, res: Response) {
  responses.sendSuccessful(res, sanitizeUser(req.userDoc));
}

/**
 * Update a User
 */
export async function update(req: Request, res: Response) {
  const { first_name, last_name, display_name, phone } = req.body;
  const _user: UserModel = req.user;

  const user = await User.findById(_user._id);

  if (!user) {
    return responses.sendError(
      res,
      Codes.AUTH__USER_NOT_FOUND,
      "Error while getting authenticated user!",
      HttpStatus.UNAUTHORIZED
    );
  }

  if (first_name) user.first_name = first_name;
  if (last_name) user.last_name = last_name;
  if (display_name) user.display_name = display_name;
  if (phone) user.phone = phone;

  try {
    const newUser = await user.save();
    req.user = newUser.toJSON();
    return responses.sendSuccessful(res, sanitizeUser(newUser));
  } catch (err) {
    return responses.sendError(
      res,
      Codes.MONGO__SAVE_ERROR,
      "Error while updating user information!",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * Delete a user
 */
export async function remove(req: RequestWithUserAndUserDoc, res: Response) {
  const user = req.userDoc;
  user.deleted_at = new Date();
  try {
    await user.save();
    return responses.sendSuccessful(res, sanitizeUser(user));
  } catch (err) {
    return responses.sendError(
      res,
      Codes.MONGO__SAVE_ERROR,
      "Error while deleting user information!",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}

/**
 * List users
 */
export async function list(req: Request, res: Response) {
  try {
    const usersDoc = await User.find({}, "-salt -password -providerData").sort(
      "-created"
    );
    responses.sendSuccessful(res, usersDoc);
  } catch (err) {
    console.log(err);
  }
}
