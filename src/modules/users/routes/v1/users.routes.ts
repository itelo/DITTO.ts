import { Application } from "express";

import * as authenticationLocal from "@modules/users/controllers/v1/authentication/users.authentication.local.controller";
import * as profile from "@modules/users/controllers/v1/profile/users.profile.password.controller";
import * as middleware from "@modules/users/controllers/v1/users.middleware.controller";

// API V1 User Routes
export default (app: Application) => {
  // Setting up the users profile api
  app.route("/api/v1/users/me").get(authenticationLocal.me);

  app.route("/api/v1/users/password").post(profile.changePassword);

  app.route("/api/v1/users/:userId");

  // Finish by binding the article middleware
  app.param("userId", middleware.userByID);

  // Setting up the users profile api
  // app.route('/api/v1/users').put(users.update);
  // app.route('/api/v1/users/accounts').delete(users.removeOAuthProvider);

  // app.route('/api/v1/users/picture').post(users.changeProfilePicture);
};
