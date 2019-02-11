import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "types/utils/errorHandler";
import { UserModel } from "src/models/user.model";
import { UserAdminModel } from "src/models/admin.model";
import { UserStoreAdminModel } from "@models/store.admin.model";
import { model } from "mongoose";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import * as jwt from "jsonwebtoken";
import passport from "passport";
import configStack from "@config/index";

const User = model("User");
const Admin = model("Admin");
const StoreAdmin = model("UserStoreAdmin");

// Setup work and export for the JWT passport strategy
export default function() {
  const config = configStack.config;
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme(config.jwt.prefix),
    secretOrKey: config.jwt.secret
  };

  // switch (jwt_payload.roles.includes) {
  // "admin":
  // }

  // "admin", "user", "storeAdmin";

  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      for (const role of jwt_payload.roles) {
        switch (role) {
          case "user":
            return User.findOne({ _id: jwt_payload._id })
              .then((user: UserModel) => {
                // console.log(user);
                if (user) {
                  return done(undefined, user.toJSON());
                  // return done(undefined, jwt_payload);
                } else {
                  // return done(undefined, jwt_payload);
                  return done(undefined, false);
                }
              })
              .catch((err: Error) => {
                console.log("return done(err, false);");
                return done(err, false);
              });
          case "admin":
            return Admin.findOne({ _id: jwt_payload._id })
              .then((userAdmin: UserAdminModel) => {
                if (userAdmin) {
                  return done(undefined, userAdmin.toJSON());
                } else {
                  return done(undefined, false);
                }
              })
              .catch((err: Error) => {
                return done(err, false);
              });
          case "store-admin":
            return StoreAdmin.findOne({ _id: jwt_payload._id })
              .then((userStoreAdmin: UserStoreAdminModel) => {
                if (userStoreAdmin) {
                  return done(undefined, userStoreAdmin.toJSON());
                } else {
                  return done(undefined, false);
                }
              })
              .catch((err: Error) => {
                return done(err, false);
              });
        }
      }
      // jwt_payload.roles.includes("storeAdmin");
      // return done(undefined, jwt_payload);
    })
  );
}

/**
 * @function sanitizeUser
 * @export
 * @param {UserModel} user
 * @returns an object that contains a JWT and SafeUser
 */
export function configureUserAndToken(user: UserModel | UserStoreAdminModel) {
  // remove the sensitive data before send to client
  const safeUser = sanitizeUser(user);
  // select only the essential data to save on jwt
  const tokenUser = {
    email: safeUser.email,
    profile_image_urls: safeUser.profile_image_urls,
    display_name: safeUser.display_name,
    _id: safeUser._id,
    roles: safeUser.roles
  };

  const config = configStack.config;

  const token = jwt.sign(tokenUser, config.jwt.secret);

  // return user and token
  return {
    user: safeUser,
    token
  };
}

/**
 * @function sanitizeUser
 * @export
 * @param {UserModel} user
 * @returns {SafeUser}
 */
export function sanitizeUser(user: UserModel | UserStoreAdminModel) {
  try {
    // Remove sensitive data before login
    const { password, salt, ...safeUser } = user.toJSON();
    return safeUser;
  } catch (err) {
    if (err.message === "user.toJSON is not a function") {
      const { password, salt, ...safeUser } = user;
      return safeUser;
    }
  }
}
// jwt auth
export function handleJWTAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  passport.authenticate("jwt", { session: false }, function(
    err: ErrorHandler,
    user: UserModel,
    info
  ) {
    req.user = user;
    if (info) {
      // @ts-ignore disable
      req.err = info.message;
    }
    next();
  })(req, res, next);
}
