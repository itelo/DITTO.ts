import * as express from "express";
/**
 * Module dependencies
 */
import passport from "passport";
import {
  Strategy as FacebookStrategy,
  Profile,
  VerifyFunction
} from "passport-facebook";
import configStack from "@config/index";
import { saveOAuthUserProfile } from "@modules/users/controllers/v1/users.authentication.controller";

export default () => {
  const { facebook } = configStack.config;
  // const facebook = {
  //   clientID: config.facebook.clientId,
  //   clientSecret: config.facebook.clientSecret,
  //   callbackURL: config.facebook.callbackURL
  // };

  const opts = {
    clientID: facebook.clientID,
    clientSecret: facebook.clientSecret,
    callbackURL: facebook.callbackURL,
    profileFields: ["id", "name", "displayName", "emails", "photos"],
    passReqToCallback: true,
    scope: ["email"],
    display: "popup",
    session: false
  };

  // Use facebook strategy
  passport.use(
    new FacebookStrategy(
      // @ts-ignore
      opts,
      // @ts-ignore
      (
        req: express.Request,
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any, info?: any) => void
      ) => {
        // @ts-ignore
        console.log({ redirectTo: req.redirectTo });

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
          email: profile.emails ? profile.emails[0].value : undefined,
          profileImageURL: profile.id
            ? `//graph.facebook.com/${profile.id}/picture?type=large`
            : // TODO: PUT DEFAULT IMAGE
              "undefined",
          provider: "facebook",
          providerIdentifierField: "id",
          providerData
        };

        // Save the user OAuth profile
        saveOAuthUserProfile(req, providerUserProfile, done);
      }
    )
  );
};

export type ProviderUserProfile = {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  profileImageURL: string;
  provider: string;
  providerIdentifierField: string;
  providerData: any;
};
