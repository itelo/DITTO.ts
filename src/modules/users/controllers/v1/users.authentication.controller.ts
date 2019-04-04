import passport from "passport";
import User, { UserModel } from "@models/user.model";

import { Request, Response, NextFunction } from "express";
import * as errorHandler from "@utils/errorHandler";
import { ErrorHandler } from "types/utils/errorHandler";
import { configureUserAndToken } from "@modules/users/config/strategies/jwt";
import { Codes } from "@utils/constants/codes";
import { HttpStatus } from "@utils/constants/httpStatus";
import * as responses from "@utils/formaters/responses";
import { ProviderUserProfile } from "@modules/users/config/strategies/facebook";
import qs from "qs";

// URLs for which user can't be redirected on signin
const noReturnUrls = ["/authentication/signin", "/authentication/signup"];

export async function signup(req: Request, res: Response) {
  // For security measurement we remove the roles from the req.body object
  req.body.roles = undefined;

  // Init user and add missing fields
  const user = new User(req.body);

  user.provider = "local";

  // Then save the user
  try {
    const userDoc = (await user.save()) as UserModel;
    const data = configureUserAndToken(userDoc);

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
 * Singin api, provide a way to the user get the user and token
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

/**
 * OAuth provider call
 */
export function oauthCall(req: Request, res: Response, next: NextFunction) {
  const strategy = req.params.strategy;
  // console.log({ req });

  const redirectTo = req.query.redirectTo;
  // res.header("Access-Control-Allow-Origin", "*");
  console.log(
    `/api/v1/auth/facebook/callback?redirectTo=${encodeURIComponent(
      redirectTo
    )}`
  );
  // Authenticate
  passport.authenticate(strategy, {
    // @ts-ignore
    // callbackURL: `/api/v1/auth/${strategy}/callback?redirectTo=${encodeURIComponent(
    //   redirectTo
    // )}`
  })(req, res, next);
}

/**
 * OAuth callback
 */
export function oauthCallback(req: Request, res: Response, next: NextFunction) {
  const strategy = req.params.strategy;

  const redirectTo = req.query.redirectTo;
  // res.header("Access-Control-Allow-Origin", "*");
  // console.log("serio?");
  // console.log(
  //   `/api/v1/auth/facebook/callback?redirectTo=${encodeURIComponent(
  //     redirectTo
  //   )}`
  // );
  // info.redirect_to contains inteded redirect path
  passport.authenticate(
    strategy,
    {
      // @ts-ignore
      // callbackURL: `/api/v1/auth/${strategy}/callback?redirectTo=${encodeURIComponent(
      //   redirectTo
      // )}`
    },
    (err: any, user: any, und: any) => {
      console.log({ und });
      if (err) {
        // return res.redirect(
        console.log(err);
        // `/authentication/signin?err=${encodeURIComponent(
        console.log(errorHandler.getErrorMessageCodeAndHttpStatus(err));
        // )}`
        // );
      }

      const { token, user: userSafe } = configureUserAndToken(user);

      // @ts-ignore
      const { _id, ...userSafeWithotId } = userSafe;

      const data = {
        token,
        user: {
          ...userSafeWithotId,
          _id: _id.toHexString()
        }
      };

      res
        .status(301)
        .redirect(
          `http://localhost:3001/oath/callback?data=${qs.stringify(data)}`
        );
    }
  )(req, res, next);
}

// }
/**
 * Helper function to save or update a OAuth user profile
 */
export function saveOAuthUserProfile(
  req: Request,
  providerUserProfile: ProviderUserProfile,
  done: (error: any, user?: any, info2?: any) => void
) {
  // Setup info and user objects
  const info = {};

  // Define a search query fields
  const searchMainProviderIdentifierField = `providerData.${
    providerUserProfile.providerIdentifierField
  }`;
  const searchAdditionalProviderIdentifierField = `additional_providers_data.${
    providerUserProfile.provider
  }.${providerUserProfile.providerIdentifierField}`;

  // Define main provider search query
  const mainProviderSearchQuery = {
    provider: providerUserProfile.provider,
    [searchMainProviderIdentifierField]:
      providerUserProfile.providerData[
        providerUserProfile.providerIdentifierField
      ]
  };

  // Define additional provider search query
  const additionalProviderSearchQuery = {
    [searchAdditionalProviderIdentifierField]:
      providerUserProfile.providerData[
        providerUserProfile.providerIdentifierField
      ]
  };

  // Define a search query to find existing user with current provider profile
  const searchQuery = {
    $or: [mainProviderSearchQuery, additionalProviderSearchQuery]
  };

  // Find existing user with this provider account
  User.findOne(searchQuery, async (err, existingUser) => {
    if (err) {
      return done(err);
    }

    if (!req.user) {
      if (!existingUser) {
        const userToBeSaved = {
          first_name: providerUserProfile.firstName,
          last_name: providerUserProfile.lastName,
          display_name: providerUserProfile.displayName,
          profile_image_urls: {
            original: providerUserProfile.profileImageURL,
            x256: providerUserProfile.profileImageURL,
            x720: providerUserProfile.profileImageURL
          },
          provider: providerUserProfile.provider,
          provider_data: providerUserProfile.providerData
        };
        const user = new User(userToBeSaved);

        // Email intentionally added later to allow defaults (sparse settings) to be applid.
        // Handles case where no email is supplied.
        // See comment: https://github.com/meanjs/mean/pull/1495#issuecomment-246090193
        // @ts-ignore
        user.email = providerUserProfile.email;

        // And save the user
        try {
          await user.save();
          done(undefined, user, info);
        } catch (err) {
          const { code } = errorHandler.getErrorMessageCodeAndHttpStatus(err);
          if (code === "auth/email-already-in-use") {
            try {
              const u = await User.findOne({ email: user.email });
              if (u) {
                addProviderToAnExistingUSer(u, providerUserProfile, info, done);
              } else {
                done(err, user, info);
              }
            } catch (err) {
              done(err, user, info);
            }
          } else {
            done(err, user, info);
          }
        }
      } else {
        return done(err, existingUser, info);
      }
    } else {
      // User is already logged in, join the provider data to the existing user
      const user = req.user;

      // Check if an existing user was found for this provider account
      if (existingUser) {
        if (user.id !== existingUser.id) {
          return done(
            new Error("Account is already connected to another user"),
            user,
            info
          );
        }

        return done(
          new Error("User is already connected using this provider"),
          user,
          info
        );
      }

      addProviderToAnExistingUSer(user, providerUserProfile, info, done);
    }
  });
}

const addProviderToAnExistingUSer = async (
  user: UserModel,
  providerUserProfile: ProviderUserProfile,
  info: any,
  done: (error: any, user?: any, info?: any) => void
) => {
  // Add the provider data to the additional provider data field
  if (!user.additional_providers_data) {
    user.additional_providers_data = {};
  }

  user.additional_providers_data[providerUserProfile.provider] =
    providerUserProfile.providerData;

  // Then tell mongoose that we've updated the additional_providers_data field
  user.markModified("additional_providers_data");

  // And save the user
  try {
    await user.save();
    done(undefined, user, info);
  } catch (err) {
    done(err, user, info);
  }
};
