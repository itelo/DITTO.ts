import defaultEnvConfig from "@config/envs/default";
import path from "path";

export default {
  db: {
    uri:
      process.env.MONGOHQ_URL ||
      process.env.MONGODB_URI ||
      "mongodb://" +
        (process.env.DB_1_PORT_27017_TCP_ADDR || "localhost") +
        "/bitx-dev",
    options: {},
    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false
  },
  jwt: {
    secret: "config.secret"
  },
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: "dev",
    fileLogger: {
      directoryPath: process.cwd(),
      fileName: "app.log",
      maxsize: 10485760,
      maxFiles: 2,
      json: false
    }
  },
  firebase: {
    storage: {
      baseRef: "dev"
    }
  },
  app: {
    title: defaultEnvConfig.app.title + " - Development Environment"
  },
  facebook: {
    clientID: process.env.FACEBOOK_ID || "APP_ID",
    clientSecret: process.env.FACEBOOK_SECRET || "APP_SECRET",
    callbackURL: "/api/auth/facebook/callback"
  },
  google: {
    clientID: process.env.GOOGLE_ID || "APP_ID",
    clientSecret: process.env.GOOGLE_SECRET || "APP_SECRET",
    callbackURL: "/api/auth/google/callback"
  },
  paypal: {
    clientID: process.env.PAYPAL_ID || "CLIENT_ID",
    clientSecret: process.env.PAYPAL_SECRET || "CLIENT_SECRET",
    callbackURL: "/api/auth/paypal/callback",
    sandbox: true
  },
  multer: {
    userImagePath: "./public/images/dev/users",
    variantImagePath: "./public/images/dev/variants",
    storeImagePath: "./public/images/dev/stores"
  },
  mailer: {
    from: process.env.MAILER_FROM || "MAILER_FROM",
    options: {
      service: process.env.MAILER_SERVICE_PROVIDER || "MAILER_SERVICE_PROVIDER",
      auth: {
        user: process.env.MAILER_EMAIL_ID || "MAILER_EMAIL_ID",
        pass: process.env.MAILER_PASSWORD || "MAILER_PASSWORD"
      }
    }
  },
  livereload: true
};
