import { Application } from "express";

import * as users from "@modules/users/controllers/v1/users.controller";
import * as authentication from "@modules/users/controllers/v1/users.authentication.controller";
import * as validations from "@modules/users/validations/v1/user.validation";
import * as password from "@modules/users/controllers/v1/users.password.controller";
import * as policies from "@modules/users/policies/v1/user.policy";
import { middleware } from "express-paginate";

// API V1 User Routes
export default (app: Application) => {
  app
    .route("/api/v1/users")
    .all(policies.isAllowed)
    .put(validations.edit, users.edit);

  // Setting up the users profile api
  app.route("/api/v1/users/me").get(users.me);

  app
    .route("/api/v1/users/profile")
    .all(policies.isAllowed)
    .post(users.changeProfilePicture);

  app
    .route("/api/v1/users/password")
    .all(policies.isAllowed)
    .post(validations.changePassword, password.changePassword);

  // Setting up the users authentication api
  app.route("/api/v1/signup").post(validations.signup, authentication.signup);
  app.route("/api/v1/signin").post(validations.signin, authentication.signin);

  // Setting the oauth routes
  app.route("/api/v1/auth/:strategy").get(authentication.oauthCall);
  app
    .route("/api/v1/auth/:strategy/callback")
    .get(authentication.oauthCallback);

  app.route("/api/v1/users/:userId");
  // .all(policies.isAllowed)
  // .get(users.read);

  // Finish by binding the article middleware
  app.param("userId", users.userByID);
};
