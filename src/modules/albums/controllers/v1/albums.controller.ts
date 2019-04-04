import Album, { AlbumModel } from "@models/albums.model";
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

export function uploadPhoto(req: RequestWithUser, res: Response) {
  const config = configStack.config;
  // const user: UserModel | null = await User.findById(req.user._id);

  const destination = config.multer.userImagePath;
  const userId = req.user._id;

  console.log({ userId });

  const socketId = req.get("X-SOCKET_ID");
  const { sizes } = req.body as { sizes: number[] };

  const multerStorage = multer.diskStorage({
    destination: `${destination}/${userId}`
  });

  const multerConfig = {
    storage: multerStorage,
    // Filtering to upload only images
    fileFilter: imageFileFilter
  };

  const upload = multer(multerConfig).single("newProfilePicture");

  const dbDestination =
    destination[0] === "." ? destination.slice(1) : destination;

  upload(req, res, async uploadError => {
    try {
      // const user = (await User.findById(req.user._id)) as UserModel;
      // user.profile_image_urls = {
      //   original: `${dbDestination}/${user._id}/${req.file.filename}`,
      //   x100: `${dbDestination}/${user._id}/${req.file.filename}`,
      //   x256: `${dbDestination}/${user._id}/${req.file.filename}`
      // };
      // await user.save();

      /**
       * From now on we don't care if everything works or not
       * the reason for that is because we have the fallback images
       * this nested try is needed to avoid the catch
       * that should exist for the first user.save()
       * NOTE: DO NOT PUT THE CODE BELLOW IN THE SAME TRY OF PARENT
       */
      try {
        const urls = await Promise.all(
          sizes.map(
            size =>
              resizeUploadToFirebaseAndGetURL(
                req.file,
                size,
                `${destination}/${userId}`,
                `photos/${userId}`
              )
            // console.log();
          )
        );
        const mappedUrls = urls.map((url, index) => ({
          [`x${sizes[index]}`]: url
        }));

        console.log({ mappedUrls });
        // return { [`x${size}`]: url };

        // Album.save()

        responses.sendSuccessful(res, mappedUrls);
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

export function uploadPhotos(req: RequestWithUser, res: Response) {
  const config = configStack.config;
  // const user: UserModel | null = await User.findById(req.user._id);

  const destination = config.multer.userImagePath;
  const userId = "test";
  const multerStorage = multer.diskStorage({
    destination: `${destination}/${userId}`
  });

  const multerConfig = {
    storage: multerStorage,
    // Filtering to upload only images
    fileFilter: imageFileFilter
  };

  const upload = multer(multerConfig).array("newProfilePicture");

  const dbDestination =
    destination[0] === "." ? destination.slice(1) : destination;

  upload(req, res, async uploadError => {
    try {
      // const user = (await User.findById(req.user._id)) as UserModel;
      // user.profile_image_urls = {
      //   original: `${dbDestination}/${user._id}/${req.file.filename}`,
      //   x100: `${dbDestination}/${user._id}/${req.file.filename}`,
      //   x256: `${dbDestination}/${user._id}/${req.file.filename}`
      // };
      // await user.save();

      /**
       * From now on we don't care if everything works or not
       * the reason for that is because we have the fallback images
       * this nested try is needed to avoid the catch
       * that should exist for the first user.save()
       * NOTE: DO NOT PUT THE CODE BELLOW IN THE SAME TRY OF PARENT
       */
      try {
        const sizes: [number, number] = [200, 720];

        // @ts-ignore
        const promises = req.files.reduce((acc: Promise<string>[], file) => {
          sizes.forEach(size => {
            const promise = resizeUploadToFirebaseAndGetURL(
              file,
              size,
              `${destination}/${userId}`,
              `photos/${userId}`
            );

            acc.push(promise);
          });
          return acc;
        }, []) as Promise<string>[];

        const urls: string[] = await Promise.all(promises);

        const mappedUrls = urls.map((url, index) => ({
          [`x${sizes[index % 2]}`]: url
        }));

        console.log({ mappedUrls });
        responses.sendSuccessful(res, mappedUrls);
        // return;
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
