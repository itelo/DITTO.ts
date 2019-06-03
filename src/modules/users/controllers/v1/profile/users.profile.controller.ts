import multer from "multer";
import * as errorHandler from "@utils/errorHandler";
import { Request, Response } from "express";
import "passport";
import path from "path";
import configStack from "@config/index";
import User, { UserModel } from "@models/user.model";
import nodemailer from "nodemailer";
import async from "async";
import crypto from "crypto";
import util from "util";
import { responsePathAsArray } from "graphql";
import * as R from "ramda";
import * as responses from "@utils/formaters/responses";
import {
  uploadToS3,
  uploadToFirebaseAndGetURL,
  deleteLocalImage,
  uploadToS3AndGetSignedURL
} from "@utils/images";
import { imageFileFilter } from "@config/libs/multer";
const whitelistedFields = ["first_name", "last_name", "email", "username"];

/**
 * Update user details
 */
export async function update(req: Request, res: Response) {
  // Init Variables
  let user = req.user;

  // Update whitelisted fields only
  user = R.merge(user, R.pick(whitelistedFields, req.body));

  user.updated = Date.now();
  user.displayName = `${user.firstName} ${user.lastName}`;

  try {
    await user.save();
    return responses.sendSuccessful(res, user);
  } catch (err) {
    const {
      code,
      message,
      status
    } = errorHandler.getErrorMessageCodeAndHttpStatus(err);
    return responses.sendError(res, code, message, status);
  }
}

export function testS3(req: Request, res: Response) {
  const config = configStack.config;
  // const user: UserModel | null = await User.findById(req.user._id);

  const destination = config.multer.userImagePath;
  const multerStorage = multer.diskStorage({
    destination: `${destination}`
  });

  const multerConfig = {
    storage: multerStorage,
    // Filtering to upload only images
    fileFilter: imageFileFilter
  };

  const upload = multer(multerConfig).single("newProfilePicture");

  upload(req, res, async (uploadError: any) => {
    console.log({ uploadError });
    try {
      // const user = (await User.findById(req.user._id)) as UserModel;
      // user.profile_image_urls = {
      //   original: `${dbDestination}/${user._id}/${req.file.filename}`,
      //   x100: `${dbDestination}/${user._id}/${req.file.filename}`,
      //   x256: `${dbDestination}/${user._id}/${req.file.filename}`
      // };
      // await user.save();

      // send to the client the updated user
      // res.json(sanitizeUser(user));

      /**
       * From now on we don't care if everything works or not
       * the reason for that is because we have the fallback images
       * this nested try is needed to avoid the catch
       * that should exist for the first user.save()
       * NOTE: DO NOT PUT THE CODE BELLOW IN THE SAME TRY OF PARENT
       */
      const image = await uploadToS3AndGetSignedURL("topzera", req.file);
      // const image = await uploadToFirebaseAndGetURL("topzera", req.file);
      const localImagePath = `${destination}/${req.file.filename}`;
      deleteLocalImage(path.resolve(localImagePath));
      console.log(image);
    } catch (err) {
      console.log(err);
    }
  });
}
