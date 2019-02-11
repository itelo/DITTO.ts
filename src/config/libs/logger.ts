// import config from "src/config";
import lodash from "lodash";
import chalk from "chalk";
import fs from "fs";
import * as winston from "winston";
import configStack from "@config/index";

interface LoggerInstance extends winston.LoggerInstance {
  setupFileLogger: Function;
  getLogOptions: Function;
  getMorganOptions: Function;
  getLogFormat: Function;
}

// list of valid formats for the logging
const validFormats = ["combined", "common", "dev", "short", "tiny"];

// Instantiating the default winston application logger with the Console
// transport

class AwesomeLogger extends winston.Logger {
  /**
   * The options to use with winston logger
   *
   * Returns a Winston object for logging with the File transport
   */
  getLogOptions = () => {
    const config = configStack.config;
    const _config = lodash.clone(config);
    // @ts-ignore
    const configFileLogger = _config.log.fileLogger;

    if (
      !lodash.has(_config, "log.fileLogger.directoryPath") ||
      !lodash.has(_config, "log.fileLogger.fileName")
    ) {
      if (process.env.NODE_ENV !== "test") {
        console.log("unable to find logging file configuration");
      }
      return false;
    }

    const logPath = `${configFileLogger.directoryPath}/${
      configFileLogger.fileName
    }`;

    return {
      level: "debug",
      colorize: false,
      filename: logPath,
      timestamp: true,
      maxsize: configFileLogger.maxsize ? configFileLogger.maxsize : 10485760,
      maxFiles: configFileLogger.maxFiles ? configFileLogger.maxFiles : 2,
      json: lodash.has(configFileLogger, "json")
        ? configFileLogger.json
        : false,
      eol: "\n",
      tailable: true,
      showLevel: true,
      handleExceptions: true,
      humanReadableUnhandledException: true
    };
  };

  /**
   * Instantiate a winston's File transport for disk file logging
   *
   */
  setupFileLogger = () => {
    const fileLoggerTransport = this.getLogOptions();
    if (!fileLoggerTransport) {
      return false;
    }

    try {
      // Check first if the configured path is writable and only then
      // instantiate the file logging transport
      if (fs.openSync(fileLoggerTransport.filename, "a+")) {
        logger.add(winston.transports.File, fileLoggerTransport);
      }

      return true;
    } catch (err) {
      if (process.env.NODE_ENV !== "test") {
        console.log();
        console.log(
          chalk.red(
            "An error has occured during the creation of the File transport logger."
          )
        );
        console.log(chalk.red(err));
        console.log();
      }

      return false;
    }
  };

  /**
   * The options to use with morgan logger
   *
   * Returns a log.options object with a writable stream based on winston
   * file logging transport (if available)
   */
  getMorganOptions = () => {
    // A stream object with a write function that will call the built-in winston
    // logger.info() function.
    // Useful for integrating with stream-related mechanism like Morgan's stream
    // option to log all HTTP requests to a file
    return {
      stream: {
        // NOTE Arrow function is need here to not lose the context, aka this
        write: (msg: string) => {
          return this.info(msg);
        }
      }
    };
  };

  /**
   * The format to use with the logger
   *
   * Returns the log.format option set in the current environment configuration
   */
  getLogFormat = () => {
    const config = configStack.config;

    let format =
      config.log && config.log.format
        ? config.log.format.toString()
        : "combined";

    // make sure we have a valid format
    if (!lodash.includes(validFormats, format)) {
      format = "combined";

      if (process.env.NODE_ENV !== "test") {
        console.log();
        console.log(
          chalk.yellow(
            `Warning: An invalid format was provided. The logger will use the default format of "${format}"`
          )
        );
        console.log();
      }
    }

    return format;
  };
}

const logger: LoggerInstance = new AwesomeLogger({
  transports: [
    new winston.transports.Console({
      level: "info",
      colorize: true,
      showLevel: true,
      handleExceptions: true,
      humanReadableUnhandledException: true
    })
  ],
  exitOnError: false
});

logger.setupFileLogger();

export default logger;
