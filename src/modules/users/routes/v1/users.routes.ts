import { Application } from "express";

import * as authenticationLocal from "@modules/users/controllers/v1/authentication/users.authentication.local.controller";
import * as authenticationOauth from "@modules/users/controllers/v1/authentication/users.authentication.oauth.controller";
import * as profile from "@modules/users/controllers/v1/profile/users.profile.password.controller";
import * as middleware from "@modules/users/controllers/v1/users.middleware.controller";

// API V1 User Routes
export default (app: Application) => {
  // Setting up the users profile api
  app.route("/api/v1/users/me").get(authenticationLocal.me);

  app.route("/api/v1/users/password").post(profile.changePassword);

  // Setting up the users authentication api
  app.route("/api/v1/signup").post(authenticationLocal.signup);
  app.route("/api/v1/signin").post(authenticationLocal.signin);

  // Setting the oauth routes
  app.route("/api/v1/auth/:strategy").get(authenticationOauth.oauthCall);
  app
    .route("/api/v1/auth/:strategy/callback")
    .get(authenticationOauth.oauthCallback);

  app.route("/api/v1/users/:userId");

  // Finish by binding the article middleware
  app.param("userId", middleware.userByID);
};
