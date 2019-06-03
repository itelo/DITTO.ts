import { Application } from "express";

import * as authenticationLocal from "@modules/users/controllers/v1/authentication/users.authentication.local.controller";
import * as authenticationOAuth from "@modules/users/controllers/v1/authentication/users.authentication.oauth.controller";
import * as passwords from "@modules/users/controllers/v1/profile/users.profile.password.controller";
import * as validation from "@modules/users/validations/v1/user.validation";
// API V1 User Routes
export default (app: Application) => {
  // Setting up the users password api
  app.route("/api/v1/auth/forgot").post(passwords.forgot);
  app.route("/api/v1/auth/reset/:token").get(passwords.validateResetToken);
  app.route("/api/v1/auth/reset/:token").post(passwords.reset);

  // Setting up the users authentication api
  app
    .route("/api/v1/signup")
    .all(validation.signup)
    .post(authenticationLocal.signup);
  app.route("/api/v1/signin").post(authenticationLocal.signin);

  // Setting the oauth routes
  app.route("/api/v1/auth/:strategy").get(authenticationOAuth.oauthCall);
  app
    .route("/api/v1/auth/:strategy/callback")
    .get(authenticationOAuth.oauthCallback);

  app
    .route("/api/v1/users/accounts")
    .delete(authenticationOAuth.removeOAuthProvider);
};
