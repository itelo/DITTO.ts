import { Application } from "express";

import * as albums from "@modules/albums/controllers/v1/albums.controller";
// import * as validations from "@modules/users/validations/v1/user.validation";
import * as policies from "@modules/users/policies/v1/user.policy";
import { middleware } from "express-paginate";

// API V1 User Routes
export default (app: Application) => {
  app.route("/api/v1/albums").post(albums.uploadPhotos);
};
