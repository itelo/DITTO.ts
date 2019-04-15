import lodash from "lodash";
import chalk from "chalk";
import glob from "glob";
import fs from "fs";
import path from "path";
import { ConfigAssetsObject } from "types/config/assets";
import { ConfigEnvsObject, Files } from "types/config/env";

const isEnvProduction = process.env.NODE_ENV === "production";

const OUT_DIR_DEBUG = isEnvProduction ? "dist" : "src",
  OUT_DIR_DEFAULT = isEnvProduction ? "dist" : "src";

const EXTENSION_DEBUG = isEnvProduction ? "js" : "ts",
  EXTENSION_DEFAULT = isEnvProduction ? "js" : "ts";

/**
 * Get files by glob patterns
 */
export const getGlobbedPaths = (
  globPatterns: [string] | string,
  excludes?: [string] | string
) => {
  // URL paths regex
  const urlRegex = new RegExp("^(?:[a-z]+:)?//", "i");

  // The output array
  let output = <any>[];

  // If glob pattern is array then we use each pattern in a recursive way, otherwise we use glob
  if (lodash.isArray(globPatterns)) {
    globPatterns.forEach(globPattern => {
      output = lodash.union(output, getGlobbedPaths(globPattern, excludes));
    });
  } else if (lodash.isString(globPatterns)) {
    if (urlRegex.test(globPatterns)) {
      output.push(globPatterns);
    } else {
      let files = glob.sync(globPatterns);

      if (excludes) {
        files = files.map(file => {
          if (lodash.isArray(excludes)) {
            for (const i in excludes) {
              if (excludes.hasOwnProperty(i)) {
                file = file.replace(excludes[i], "");
              }
            }
          } else {
            file = file.replace(excludes, "");
          }
          return file;
        });
      }
      output = lodash.union(output, files);
    }
  }

  return output;
};

/**
 * Validate NODE_ENV existence
 */
const validateEnvironmentVariable = () => {
  const environmentFiles = glob.sync(
    `./${
      process.env.NODE_ENV === "debug" ? OUT_DIR_DEBUG : OUT_DIR_DEFAULT
    }/config/envs/${process.env.NODE_ENV}.${
      process.env.NODE_ENV === "debug" ? EXTENSION_DEBUG : EXTENSION_DEFAULT
    }`
  );

  if (!environmentFiles.length) {
    if (process.env.NODE_ENV) {
      console.error(
        chalk.red(
          `+ Error: No configuration file found for "${
            process.env.NODE_ENV
          }" environment using development instead`
        )
      );
    } else {
      console.error(
        chalk.red(
          "+ Error: NODE_ENV is not defined! Using default development environment"
        )
      );
    }
    process.env.NODE_ENV = "development";
  }
  // Reset console color
  if (process.env.NODE_ENV !== "test") {
    console.log(chalk.white(""));
  }
};

/**
 * Validate config.domain is set
 */
const validateDomainIsSet = (config: ConfigEnvsObject) => {
  if (!config.domain && process.env.NODE_ENV !== "test") {
    console.log(
      chalk.red(
        "+ Important warning: config.domain is empty. It should be set to the fully qualified domain of the app."
      )
    );
  }
};

/**
 * Validate Secure=true parameter can actually be turned on
 * because it requires certs and key files to be available
 */
const validateSecureMode = (config: ConfigEnvsObject) => {
  if (!config.secure || config.secure.ssl !== true) {
    return true;
  }

  const privateKey = fs.existsSync(path.resolve(config.secure.privateKey));
  const certificate = fs.existsSync(path.resolve(config.secure.certificate));

  if (!privateKey || !certificate) {
    console.log(
      chalk.red(
        "+ Error: Certificate file or key file is missing, falling back to non-SSL mode"
      )
    );
    console.log(
      chalk.red(
        "  To create them, simply run the following from your shell: sh ./scripts/generate-ssl-certs.sh"
      )
    );
    console.log();
    config.secure.ssl = false;
  }
};

/**
 * Validate Session Secret parameter is not set to default in production
 */
const validateSessionSecret = (config: ConfigEnvsObject) => {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  if (config.sessionSecret === "BACKEND") {
    console.log(
      chalk.red(
        "+ WARNING: It is strongly recommended that you change sessionSecret config while running in production!"
      )
    );
    console.log(
      chalk.red(
        "  Please add `sessionSecret: process.env.SESSION_SECRET || 'super amazing secret'` to "
      )
    );
    console.log(
      chalk.red(`  "config/env/production.js" or "config/env/local.js"`)
    );
    console.log();
    return false;
  } else {
    return true;
  }
};

/**
 * Initialize global configuration files
 */
const initGlobalConfigFiles = (
  config: ConfigEnvsObject,
  assets: ConfigAssetsObject
) => {
  // Appending files
  config.files = {} as Files;

  // Setting Globbed model files
  config.files.models = getGlobbedPaths(assets.models);

  // Setting Globbed route files
  config.files.routes = getGlobbedPaths(assets.routes);

  // Setting Globbed config files
  config.files.configs = getGlobbedPaths(assets.configs);

  // Setting Globbed socket files
  config.files.sockets = getGlobbedPaths(assets.sockets);

  // Setting Globbed typedef files
  config.files.typedefs = getGlobbedPaths(assets.typedefs);

  // Setting Globbed resolver files
  config.files.resolvers = getGlobbedPaths(assets.resolvers);

  // Setting Globbed policies files
  config.files.policies = getGlobbedPaths(assets.policies);

  // Setting Globbed validations files
  config.files.validations = getGlobbedPaths(assets.validations);

  // Setting Globbed i18n files
  config.files.i18n = getGlobbedPaths(assets.i18n);
};

let instance: any;

/**
 * Initialize global configuration
 */
class StackGlobalConfig {
  _config: ConfigEnvsObject;
  constructor() {
    if (instance) {
      return instance;
    }
    this._config = {} as ConfigEnvsObject;
    instance = this;
  }

  get config() {
    if (Object.keys(this._config).length > 0) {
      return this._config;
    }
    return this.init();
  }
  init(): ConfigEnvsObject {
    // Validate NODE_ENV existence
    validateEnvironmentVariable();

    // Get the default assets
    const defaultAssets = require(path.join(
      process.cwd(),
      `${
        process.env.NODE_ENV === "debug" ? OUT_DIR_DEBUG : OUT_DIR_DEFAULT
      }/config/assets/default.${
        process.env.NODE_ENV === "debug" ? EXTENSION_DEBUG : EXTENSION_DEFAULT
      }`
    ));

    // console.log(defaultAssets);

    // Get the current assets
    const environmentAssets =
      require(path.join(
        process.cwd(),
        `${
          process.env.NODE_ENV === "debug" ? OUT_DIR_DEBUG : OUT_DIR_DEFAULT
        }/config/assets/`,
        `${process.env.NODE_ENV}.${
          process.env.NODE_ENV === "debug" ? EXTENSION_DEBUG : EXTENSION_DEFAULT
        }`
      )) || {};

    // Merge assets
    let assets = lodash.merge(defaultAssets, environmentAssets);
    assets = assets.default;

    // console.log(assets);

    // Get the default config
    const defaultConfig = require(path.join(
      process.cwd(),
      `${
        process.env.NODE_ENV === "debug" ? OUT_DIR_DEBUG : OUT_DIR_DEFAULT
      }/config/envs/default.${
        process.env.NODE_ENV === "debug" ? EXTENSION_DEBUG : EXTENSION_DEFAULT
      }`
    ));

    // console.log("defaultConfig");
    // console.log(defaultConfig);

    // Get the current config
    const environmentConfig =
      require(path.join(
        process.cwd(),
        `${
          process.env.NODE_ENV === "debug" ? OUT_DIR_DEBUG : OUT_DIR_DEFAULT
        }/config/envs/`,
        `${process.env.NODE_ENV}.${
          process.env.NODE_ENV === "debug" ? EXTENSION_DEBUG : EXTENSION_DEFAULT
        }`
      )) || {};

    const localEnvFilePath = `${
      process.env.NODE_ENV === "debug" ? OUT_DIR_DEBUG : OUT_DIR_DEFAULT
    }/config/envs/local-${process.env.NODE_ENV}.${
      process.env.NODE_ENV === "debug" ? EXTENSION_DEBUG : EXTENSION_DEFAULT
    }`;

    const localEnvConfig =
      fs.existsSync(path.join(process.cwd(), localEnvFilePath)) &&
      require(path.join(process.cwd(), localEnvFilePath));

    // Merge config files
    let config = lodash.merge(defaultConfig, environmentConfig, localEnvConfig);
    config = config.default;

    // read package.json for TUDOCOMPRA.JS project information
    const pkg = require(path.resolve("./package.json"));
    config.pkg = pkg;

    // Initialize global globbed files
    initGlobalConfigFiles(config, assets);
    // console.log("assets");
    // console.log(assets);

    // console.log("config");
    // console.log(config.files);

    // Validate Secure SSL mode can be used
    validateSecureMode(config);

    // // Validate session secret
    validateSessionSecret(config);

    // // Print a warning if config.domain is not set
    validateDomainIsSet(config);

    // // Expose configuration utilities
    config.utils = {
      getGlobbedPaths,
      validateSessionSecret
    };

    // @ts-ignore
    this._config = config;
    return config;
  }
}

/**
 * Set configuration object
 */
export default new StackGlobalConfig();
