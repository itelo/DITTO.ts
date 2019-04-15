import { Application } from "express";
import { ConfigEnvsObject } from "types/config/env";
import chalk from "chalk";
import configStack from "@config/index";
import * as mongooseService from "@config/libs/mongoose";
import * as express from "@config/libs/express";

export function init(config: ConfigEnvsObject, callback: Function) {
  // if (process.env.NODE_ENV === "test") {
  // mongooseService.connectLoadAndSeed(config, (db: any) => {
  //   const app = express.init(config);
  //   if (callback) callback(app, db, config);
  // });
  // } else {
  mongooseService.connect(config, (db: any) => {
    // Initialize Models
    mongooseService.loadModels(config);

    // Initialize express
    const app = express.init(config);
    if (callback) callback(app, db, config);
  });
  // }
}

export function start(callback?: Function) {
  console.log("NODE_ENV => ", process.env.NODE_ENV);
  const config = configStack.config;

  // console.log(config);

  init(config, (app: Application, db: any, config: any) => {
    // Start the app by listening on <port> at <host>
    app.listen(config.port, config.host, () => {
      // Create server URL
      const server = `${(process.env.NODE_ENV === "secure"
        ? "https://"
        : "http://") + config.host}:${config.port}`;
      // Logging initialization
      console.log("--");
      console.log(chalk.green(config.app.title));
      console.log();
      console.log(chalk.green(`Environment:     ${process.env.NODE_ENV}`));
      console.log(chalk.green(`Server:          ${server}`));
      process.env.NODE_ENV !== "production" &&
        console.log(chalk.green(`Database:        ${config.db.uri}`));
      console.log(chalk.green(`App version:     ${config.pkg.version}`));
      if (config.pkg["pkg-version"])
        console.log(
          chalk.green(`BITX.JS version: ${config.pkg["pkg-version"]}`)
        );
      console.log("--");

      if (callback) callback(app, db, config);
    });
  });
}

export function cleanStart(): Promise<Application> {
  const config = configStack.config;

  return new Promise(resolve => {
    return init(config, (app: Application) => resolve(app));
  });
}
