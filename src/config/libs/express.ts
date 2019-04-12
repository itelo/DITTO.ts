import { ConfigEnvsObject } from "types/config/env";
import express, { Application, Request, Response, NextFunction } from "express";
import morgan from "morgan";

import bodyParser from "body-parser";
// import mongoose from "mongoose";
// import MongoStore from "connect-mongo";
import compress from "compression";
import methodOverride from "method-override";
import cookieParser from "cookie-parser";
import helmet from "helmet";
// import flash from "connect-flash";
import path from "path";
import lodash from "lodash";
import lusca from "lusca";
import i18next, { Resource } from "i18next";
import cors from "cors";
import logger from "./logger";
import * as responses from "@utils/formaters/responses";
import { Codes } from "@utils/constants/codes";
import { HttpStatus } from "@utils/constants/httpStatus";

/**
 * Initialize local variables
 */
function initLocalVariables(app: Application, config: ConfigEnvsObject) {
  // Setting application local variables
  app.locals.title = config.app.title;
  app.locals.description = config.app.description;
  if (config.secure && config.secure.ssl === true) {
    app.locals.secure = config.secure.ssl;
  }
  app.locals.keywords = config.app.keywords;
  app.locals.googleAnalyticsTrackingID = config.app.googleAnalyticsTrackingID;
  // app.locals.facebookAppId = config.facebook.clientID;
  // app.locals.twitterUsername = config.twitter.username;
  // app.locals.jsFiles = config.files.client.js;
  // app.locals.cssFiles = config.files.client.css;
  // app.locals.livereload = config.livereload;
  // app.locals.logo = config.logo;
  // app.locals.favicon = config.favicon;
  app.locals.env = process.env.NODE_ENV;
  app.locals.domain = config.domain;

  // Passing the request url to environment locals
  app.use(function(req: Request, res: Response, next: NextFunction) {
    res.locals.host = req.protocol + "://" + req.hostname;
    res.locals.url = req.protocol + "://" + req.headers.host + req.originalUrl;
    next();
  });
}

/**
 * Initialize application middleware
 */
function initMiddleware(app: Application, config: ConfigEnvsObject) {
  //
  app.use(
    cors({
      origin: "http://localhost:3001"
    })
  );

  // Should be placed before express.static
  app.use(
    compress({
      filter(req: Request, res: Response) {
        // @ts-ignore
        return /json|text|javascript|css|font|svg/.test(
          res.get("Content-Type")
        );
      },
      level: 9
    })
  );

  // Enable logger (morgan) if enabled in the configuration file
  if (lodash.has(config, "log.format")) {
    app.use(morgan(logger.getLogFormat(), logger.getMorganOptions()));
  }

  // Environment dependent middleware
  if (process.env.NODE_ENV === "development") {
    // Disable views cache
    app.set("view cache", false);
  } else if (process.env.NODE_ENV === "production") {
    app.locals.cache = "memory";
  }

  // Request body parsing middleware should be above methodOverride
  app.use(
    bodyParser.urlencoded({
      extended: true
    })
  );
  app.use(bodyParser.json());
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (
      err.constructor === SyntaxError &&
      err.status >= 400 &&
      err.status < 500 &&
      err.message.indexOf("JSON")
    ) {
      console.error(err);

      responses.sendError(
        res,
        Codes.REQUEST__MISSING_PARAMS,
        "Malformed JSON input",
        HttpStatus.UNPROCESSABLE_ENTITY
      );
    }
  });
  app.use(methodOverride());

  // Add the cookie parser and flash middleware
  app.use(cookieParser());
  // app.use(flash());
}

/**
 * Invoke modules server configuration
 */
function initModulesConfiguration(app: Application, config: ConfigEnvsObject) {
  config.files.configs.forEach(async (configPath: string) => {
    const modules = await import(path.resolve(configPath));
    modules.default(app);
  });
}

/**
 * Configure Helmet headers configuration for security
 */
function initHelmetHeaders(app: Application) {
  // six months expiration period specified in seconds
  const SIX_MONTHS = 15778476;

  app.use(helmet.frameguard());
  app.use(helmet.xssFilter());
  app.use(helmet.noSniff());
  app.use(helmet.ieNoOpen());
  app.use(
    helmet.hsts({
      maxAge: SIX_MONTHS,
      includeSubdomains: true,
      force: true
    })
  );
  app.disable("x-powered-by");
}

/**
 * Configure the modules ACL policies
 */
function initModulesServerPolicies(config: ConfigEnvsObject) {
  // Globbing policy files
  config.files.policies.forEach(async (policyPath: string) => {
    const policies = await import(path.resolve(policyPath));

    policies.invokeRolesPolicies();
  });
}

// /**
//  * Configure the modules validations
//  */
// function initModulesServerValidations(config: ConfigEnvsObject) {
//   // Globbing policy files
//   config.files.validations.forEach(async (validationPath: string) => {
//     const validations = await import(path.resolve(validationPath));
//     // policies.invokeRolesPolicies();
//   });
// }

/**
 * Configure the modules server routes
 */
function initModulesServerRoutes(app: Application, config: ConfigEnvsObject) {
  // Globbing routing files
  config.files.routes.forEach(async (routePath: string) => {
    const routes = await import(path.resolve(routePath));

    routes.default(app);
  });
}

/**
 * Configure the static routes
 */
function initStaticRoutes(app: Application) {
  // Setting the app router and static folder
  app.use(
    "/public",
    express.static(path.resolve("./public"), { maxAge: 86400000 })
  );
}

/**
 * Configure Graphql
 */
function configureGraphql(app: Application, config: ConfigEnvsObject) {
  // Load the Socket.io configuration
  const server = require("./graphqlv2").default(app, config);

  // Return server object
  return server;
}

/**
 * Configure Socket.io
 */
function configureSocketIO(app: Application) {
  // Load the Socket.io configuration
  const server = require("./socket.io").default(app);

  // Return server object
  return server;
}

/**
 * Configure i18n
 */
async function initI18N(app: Application, config: ConfigEnvsObject) {
  app.use(function(req, res, next) {
    const lng = req.get("content-language");
    if (lng) i18next.changeLanguage(lng);

    next();
  });

  const resources = {} as Resource;

  for (const langPath of config.files.i18n) {
    const helper = langPath.split("/");
    const langName = helper[helper.length - 1].split(".").shift();
    if (langName) {
      const translation = await import(path.resolve(langPath));
      resources[langName] = { translation: translation.default };
    }
  }

  i18next.init(
    {
      fallbackLng: "pt-BR",
      resources,
      debug: false
    },
    (err: Error) => {
      if (err) {
        throw `something went wrong loading ${err}`;
      }
    }
  );
}

/**
 * Initialize the Express application
 */
export function init(config: ConfigEnvsObject) {
  // Initialize express app
  const app = express();

  // Initialize local variables
  initLocalVariables(app, config);

  // Initialize Express middleware
  initMiddleware(app, config);

  // Initialize Helmet security headers
  initHelmetHeaders(app);

  // Initialize Modules configuration
  initModulesConfiguration(app, config);

  // Initialize modules server authorization policies
  initModulesServerPolicies(config);

  // Initialize modules server routes
  initModulesServerRoutes(app, config);

  initStaticRoutes(app);

  // init
  initI18N(app, config);

  // configure graphql
  const server = configureGraphql(app, config);

  return server;
}
