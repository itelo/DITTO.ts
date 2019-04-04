import { Profile } from "passport-facebook";
import { Request } from "express";
import configStack from "@config/index";
/**
 * Module dependencies
 */
import passport from "passport";

import { OAuth2Strategy as GoogleStrategy } from "passport-google-oauth";
import { saveOAuthUserProfile } from "@modules/users/controllers/v1/users.authentication.controller";

export default () => {
  const { google } = configStack.config;

  // Use google strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: google.clientID,
        clientSecret: google.clientSecret,
        callbackURL: google.callbackURL,
        display: "popup",
        passReqToCallback: true,
        // @ts-ignore
        scope: [
          "https://www.googleapis.com/auth/userinfo.profile",
          "https://www.googleapis.com/auth/userinfo.email"
        ],
        session: false
      },
      // @ts-ignore
      (
        req: Request,
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any, info?: any) => void
      ) => {
        // Set the provider data and include tokens
        const providerData = profile._json;
        providerData.accessToken = accessToken;
        providerData.refreshToken = refreshToken;

        let userName = {};
        if (profile.name) {
          userName = {
            ...userName,
            firstName: profile.name.givenName!,
            lastName: profile.name.familyName,
            displayName: profile.displayName
          };
        }

        // Create the user OAuth profile
        const providerUserProfile = {
          ...userName,
          email: profile.emails![0].value,
          username: profile.username,
          profileImageURL: providerData.picture
            ? providerData.picture
            : undefined,
          provider: "google",
          providerIdentifierField: "id",
          providerData: {
            ...providerData,
            id: profile.id
          }
        };

        // Save the user OAuth profile
        saveOAuthUserProfile(req, providerUserProfile, done);
      }
    )
  );
};
