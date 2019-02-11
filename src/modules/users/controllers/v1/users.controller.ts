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

export function me(req: RequestWithUser, res: Response) {
  return responses.sendSuccessful(res, sanitizeUser(req.user));
}

export function changeProfilePicture(req: RequestWithUser, res: Response) {
  const config = configStack.config;
  // const user: UserModel | null = await User.findById(req.user._id);

  const destination = config.multer.userImagePath;
  const multerStorage = multer.diskStorage({
    destination: `${destination}/${req.user._id}`
  });

  const multerConfig = {
    storage: multerStorage
  };

  // @ts-ignore Filtering to upload only images
  multerConfig.fileFilter = imageFileFilter;

  const upload = multer(multerConfig).single("newProfilePicture");

  const dbDestination =
    destination[0] === "." ? destination.slice(1) : destination;

  upload(req, res, async uploadError => {
    try {
      const user = (await User.findById(req.user._id)) as UserModel;
      user.profile_image_urls = {
        original: `${dbDestination}/${user._id}/${req.file.filename}`,
        x100: `${dbDestination}/${user._id}/${req.file.filename}`,
        x256: `${dbDestination}/${user._id}/${req.file.filename}`
      };
      await user.save();

      // send to the client the updated user
      res.json(sanitizeUser(user));

      /**
       * From now on we don't care if everything works or not
       * the reason for that is because we have the fallback images
       * this nested try is needed to avoid the catch
       * that should exist for the first user.save()
       * NOTE: DO NOT PUT THE CODE BELLOW IN THE SAME TRY OF PARENT
       */
      try {
        const sizes: [number, number] = [100, 256];

        const urls: string[] = await Promise.all(
          sizes.map(size =>
            resizeUploadToFirebaseAndGetURL(
              req.file,
              size,
              `${destination}/${user._id}`,
              `users/${user._id}`
            )
          )
        );

        user.profile_image_urls = {
          ...user.profile_image_urls,
          x100: urls[0],
          x256: urls[1]
        };

        user.save();
      } catch (ignore) {
        // if something fails, it's acceptable
        console.error(ignore);
      }
    } catch (err) {
      console.log(err);
      return responses.sendError(
        res,
        Codes.MONGO__SAVE_ERROR,
        "Error while updating user information!",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  });
}

export async function read(req: RequestWithUserAndUserDoc, res: Response) {
  responses.sendSuccessful(res, sanitizeUser(req.userDoc));
}
export async function list(req: Request, res: Response) {
  try {
    const usersDoc = await User.find();
    responses.sendSuccessful(res, usersDoc);
  } catch (err) {
    console.log(err);
  }
}

export async function edit(req: Request, res: Response) {
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

  first_name && (user.first_name = first_name);
  last_name && (user.last_name = last_name);
  display_name && (user.display_name = display_name);
  phone && (user.phone = phone);

  try {
    const newUser = await user.save();
    req.user = newUser.toJSON();
    return responses.sendSuccessful(res, sanitizeUser(newUser));
  } catch (err) {
    console.error(err);
    return responses.sendError(
      res,
      Codes.MONGO__SAVE_ERROR,
      "Error while updating user information!",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
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

    User.findById(id).exec(function(err, userDoc) {
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
