import { Application } from "express";

import * as authenticationLocal from "@modules/users/controllers/v1/authentication/users.authentication.local.controller";
import * as profile from "@modules/users/controllers/v1/profile/users.profile.password.controller";
import * as profileR from "@modules/users/controllers/v1/profile/users.profile.controller";
import * as middleware from "@modules/users/controllers/v1/users.middleware.controller";

// API V1 User Routes
export default (app: Application) => {
  // Setting up the users profile api
  app.route("/api/v1/users/me").get(authenticationLocal.me);

  app.route("/api/v1/users/password").post(profile.changePassword);

  app.route("/api/v1/users").put(profileR.update);

  app.route("/api/v1/s3").post(profileR.testS3);

  // app.route('/api/v1/users/picture').post(users.changeProfilePicture);
  // app.route("/api/v1/users/:userId");

  // Finish by binding the article middleware
  app.param("userId", middleware.userByID);
};
