/**
 * Module dependencies
 */
// import adminPolicy from "../policies/admin.server.policy";
import * as middleware from "@modules/users/controllers/v1/users.middleware.controller";
import * as admin from "@modules/users/controllers/v1/admin.controller";

import { Application } from "express";

export default (app: Application) => {
  // const config = configStack.config;

  // Users collection routes
  app.route("/api/users").get(admin.list);

  // Single user routes
  app
    .route("/api/users/:userId")
    .get(admin.read)
    .put(admin.update)
    .delete(admin.remove);

  // Finish by binding the user middleware
  app.param("userId", middleware.userByID);
};
