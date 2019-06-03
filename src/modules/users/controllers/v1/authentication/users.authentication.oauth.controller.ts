import passport from "passport";
import User, { UserModel, USER_PROVIDERS, SafeUser } from "@models/user.model";
import { Types } from "mongoose";
import { Request, Response, NextFunction } from "express";
import * as errorHandler from "@utils/errorHandler";
import { ErrorHandler } from "types/utils/errorHandler";
import { configureUserAndToken } from "@modules/users/config/strategies/jwt";
import { Codes } from "@utils/constants/codes";
import { HttpStatus } from "@utils/constants/httpStatus";
import * as responses from "@utils/formaters/responses";
import { ProviderUserProfile } from "@modules/users/config/strategies/facebook";
import qs from "qs";

/**
 * OAuth provider call
 */
export function oauthCall(req: Request, res: Response, next: NextFunction) {
  const strategy = req.params.strategy;

  // Authenticate
  passport.authenticate(strategy)(req, res, next);
}

/**
 * OAuth callback
 */
export function oauthCallback(req: Request, res: Response, next: NextFunction) {
  const strategy = req.params.strategy;

  passport.authenticate(strategy, {}, (err: any, user: any, und: any) => {
    console.log({ und });
    if (err) {
      console.log(err);
      console.log(errorHandler.getErrorMessageCodeAndHttpStatus(err));
    }

    const { token, user: userSafe } = configureUserAndToken(user);

    const { _id, ...userSafeWithotId } = userSafe as SafeUser & {
      _id: Types.ObjectId;
    };

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
  })(req, res, next);
}

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
          if (code === Codes.AUTH__EMAIL_ALREADY_IN_USE) {
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

  const provider = providerUserProfile.provider as
    | USER_PROVIDERS.FACEBOOK
    | USER_PROVIDERS.GOOGLE;

  user.additional_providers_data[provider] = providerUserProfile.providerData;

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

/**
 * Remove OAuth provider
 */
export async function removeOAuthProvider(req: Request, res: Response) {
  const user = req.user;
  const provider = req.body.provider;

  // Delete the additional provider
  if (user.additionalProvidersData[provider]) {
    delete user.additionalProvidersData[provider];

    // Then tell mongoose that we've updated the additionalProvidersData field
    user.markModified("additionalProvidersData");
  }

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
