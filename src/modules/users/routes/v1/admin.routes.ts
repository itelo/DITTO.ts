import { Application } from "express";

import * as userAdmin from "@modules/users/controllers/v1/admin.controller";

// API V1 Store Routes
export default (app: Application) => {
  app.route("/api/v1/user/admin/signin").post(userAdmin.signin);
};
