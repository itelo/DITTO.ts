import lodash from "lodash";
import configStack from "@config/index";
import mongoose from "mongoose";
import chalk from "chalk";
import { reject } from "bluebird";

export function start(seedConfig?: any) {
  return new Promise(async (resolve, reject) => {
    seedConfig = seedConfig || {};

    const config = configStack.config;

    const options =
      seedConfig.options ||
      // @ts-ignore
      (config.seedDB ? lodash.clone(config.seedDB.options, true) : {});
    const collections =
      seedConfig.collections ||
      // @ts-ignore
      (config.seedDB ? lodash.clone(config.seedDB.collections, true) : []);

    if (!collections.length) {
      return resolve();
    }

    const seeds = collections.filter((collection: any) => collection.model);

    // Use the reduction pattern to ensure we process seeding in desired order.
    try {
      for (const seedItem of seeds) {
        await seed(seedItem, options);
      }
      return onSuccessComplete();
    } catch (err) {
      return onError(err);
    }
    // Local Promise handlers

    function onSuccessComplete() {
      if (options.logResults) {
        console.log();
        console.log(chalk.bold.green("Database Seeding: Mongo Seed complete!"));
        console.log();
      }

      return resolve();
    }

    function onError(err: Error) {
      if (options.logResults) {
        console.log();
        console.log(chalk.bold.red("Database Seeding: Mongo Seed Failed!"));
        console.log(chalk.bold.red("Database Seeding: " + err));
        console.log();
      }

      return reject(err);
    }

    // Local Promise handlers
  });
}

function seed(collection: any, options: any) {
  // Merge options with collection options
  options = lodash.merge(options || {}, collection.options || {});

  return new Promise((resolve, reject) => {
    const Model = mongoose.model(collection.model);
    const docs = collection.docs;

    const skipWhen = collection.skip ? collection.skip.when : undefined;
    // @ts-ignore
    if (!Model.seed) {
      return reject(
        new Error(
          `Database Seeding: Invalid Model Configuration - ${
            collection.model
          }.seed() not implemented`
        )
      );
    }

    if (!docs || !docs.length) {
      return resolve();
    }

    // First check if we should skip this collection
    // based on the collection's "skip.when" option.
    // NOTE: If it exists, "skip.when" should be a qualified
    // Mongoose query that will be used with Model.find().
    skipCollection()
      .then(seedDocuments)
      .then(resolve)
      .catch(reject);

    function skipCollection() {
      return new Promise((resolve, reject) => {
        if (!skipWhen) {
          return resolve(false);
        }

        Model.find(skipWhen).exec((err, results) => {
          if (err) {
            return reject(err);
          }

          if (results && results.length) {
            return resolve(true);
          }

          return resolve(false);
        });
      });
    }

    function seedDocuments(skipCollection: any) {
      return new Promise((resolve, reject) => {
        if (skipCollection) {
          return onComplete([
            {
              message: chalk.yellow(
                `Database Seeding: ${collection.model} collection skipped`
              )
            }
          ]);
        }

        const workload = docs.filter((doc: any) => doc.data).map((doc: any) => {
          // @ts-ignore
          return Model.seed(doc.data, { overwrite: doc.overwrite });
        });

        Promise.all(workload)
          .then(onComplete)
          .catch(onError);

        // Local Closures

        function onComplete(responses: any) {
          if (options.logResults) {
            responses.forEach((response: any) => {
              if (response.message) {
                console.log(chalk.magenta(response.message));
              }
            });
          }

          return resolve();
        }

        function onError(err: any) {
          return reject(err);
        }
      });
    }
  });
}
