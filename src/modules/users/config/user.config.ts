import passport from "passport";
import { Application } from "express";
import path from "path";
import configStack from "@config/index";
import { handleJWTAuthentication } from "@modules/users/config/strategies/jwt";

/**
 * Module init function
 */
export default (app: Application) => {
  // Initialize strategies
  const config = configStack.config;

  // Add passport's middleware
  app.use(passport.initialize());

  app.use(handleJWTAuthentication);

  config.utils
    .getGlobbedPaths(
      path.join(__dirname, `./strategies/**/*.${config.extension}`)
    )
    .forEach((strategy: string) => {
      const _strategy = require(path.resolve(strategy));
      _strategy.default(config);
    });
};
