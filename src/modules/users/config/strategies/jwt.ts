import { Request, Response, NextFunction } from "express";
import { ErrorHandler } from "types/utils/errorHandler";
import User, { UserModel, SafeUser } from "src/models/user.model";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import * as jwt from "jsonwebtoken";
import passport from "passport";
import configStack from "@config/index";

// Setup work and export for the JWT passport strategy
export default function() {
  const config = configStack.config;
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwt.secret
  };

  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) =>
      User.findOne({ _id: jwt_payload._id })
        .then((user: UserModel) => {
          if (user) {
            return done(undefined, user.toJSON());
          } else {
            return done(undefined, false);
          }
        })
        .catch((err: Error) => {
          console.log("return done(err, false);");
          return done(err, false);
        })
    )
  );
}

type ConfiguredUserAndToken = {
  user: SafeUser;
  token: string;
};

/**
 * @function sanitizeUser
 * @export
 * @param {UserModel} user
 * @returns an object that contains a JWT and SafeUser
 */
export function configureUserAndToken(
  user: UserModel
  // | UserStoreAdminModel
): ConfiguredUserAndToken {
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
export function sanitizeUser(
  user: UserModel
  // | UserStoreAdminModel
) {
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
