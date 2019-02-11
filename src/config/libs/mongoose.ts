import lodash from "lodash";
import chalk from "chalk";
import path from "path";
import mongoose from "mongoose";
import MongoMemoryServer from "mongodb-memory-server";

import * as seed from "@config/libs/mongo-seed";
import { ConfigEnvsObject } from "types/config/env";
// Load the mongoose models

function getConnectionString() {
  return new Promise(async (resolve, reject) => {
    const mongoServer = new MongoMemoryServer();
    try {
      const mongoURI = await mongoServer.getConnectionString();
      const memoryOptions = {
        autoReconnect: true,
        reconnectTries: Number.MAX_VALUE,
        reconnectInterval: 1000
      };
      resolve({ mongoURI, memoryOptions });
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
}

export function seedDB(config: ConfigEnvsObject) {
  // return seed.start();
  // @ts-ignore
  if (config.seedDB && config.seedDB.seed) {
    // console.log(chalk.bold.red("Warning:  Database seeding is turned on"));
    return seed.start();
  }
  // console.log(
  // chalk.bold.yellowBright("Warning:  Database seeding is turned off")
  // );
}
export function loadModels(config: ConfigEnvsObject, callback?: Function) {
  // Globbing model files
  config.files.models.forEach((modelPath: string) => {
    require(path.resolve(modelPath));
  });

  if (callback) callback();
}
// Initialize Mongoose
export async function connect(config: ConfigEnvsObject, callback?: Function) {
  mongoose.Promise = config.db.promise;

  let mongoURI = config.db.uri;
  let memoryOptions = {};

  // @ts-ignore
  if (config.db.inMemory) {
    const result = await getConnectionString();
    // @ts-ignore
    mongoURI = result.mongoURI;
    // @ts-ignore
    memoryOptions = result.memoryOptions;
  }

  const options: any = lodash.merge(
    config.db.options || {},
    {
      useNewUrlParser: true
    },
    memoryOptions
  );

  mongoose
    .connect(
      mongoURI,
      options
    )
    // @ts-ignore
    .then(() => {
      // Enabling mongoose debug mode if required
      mongoose.set("debug", config.db.debug);
      // Call callback FN
      if (callback) callback(mongoose.connection.db);
    })
    .catch((err?: Error) => {
      console.log(err);
      console.error(chalk.red("Could not connect to MongoDB!"));
      if (callback) {
        if (err) {
          callback(undefined, err);
        } else {
          callback(undefined, "Could not connect to MongoDB!");
        }
      }
    });
}

export async function connectLoadAndSeed(
  config: ConfigEnvsObject,
  cb: Function
) {
  // return new Promise()
  // console.info(chalk.blueBright("Connecting to DB"));
  connect(
    config,
    (db: any) =>
      loadModels(config, () => {
        seed
          .start()
          .then(() => {
            cb(db);
          })
          .catch(err => {
            console.log(chalk.bgGreenBright(chalk.red(err)));
          });
      })
  );
}

export function disconnect(callback?: Function) {
  mongoose.connection.close((err: Error) => {
    if (process.env.NODE_ENV !== "test") {
      console.info(chalk.yellow("Disconnected from MongoDB."));
    }
    if (callback) return callback(err);
  });
}
