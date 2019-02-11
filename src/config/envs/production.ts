import path from "path";

export default {
  outDir: "dist",
  extension: "js",
  secure: {
    ssl: true,
    privateKey: "./config/sslcerts/key.pem",
    certificate: "./config/sslcerts/cert.pem",
    caBundle: "./config/sslcerts/cabundle.crt"
  },
  port: process.env.PORT || 8443,
  // Binding to 127.0.0.1 is safer in production.
  host: process.env.HOST || "127.0.0.1",
  db: {
    uri:
      process.env.MONGOHQ_URL ||
      process.env.MONGODB_URI ||
      "mongodb://" +
        (process.env.DB_1_PORT_27017_TCP_ADDR || "localhost") +
        "/bitx",
    options: {
      /**
       * Uncomment to enable ssl certificate based authentication to mongodb
       * servers. Adjust the settings below for your specific certificate
       * setup.
       * for connect to a replicaset, rename server:{...} to replset:{...}
       * ssl: true,
       * sslValidate: false,
       * checkServerIdentity: false,
       * sslCA: fs.readFileSync('./config/sslcerts/ssl-ca.pem'),
       * sslCert: fs.readFileSync('./config/sslcerts/ssl-cert.pem'),
       * sslKey: fs.readFileSync('./config/sslcerts/ssl-key.pem'),
       * sslPass: '1234'
       */
    },
    // Enable mongoose debug mode
    debug: process.env.MONGODB_DEBUG || false
  },
  jwt: {
    secret: process.env.JWT_SECRET
  },
  log: {
    // logging with Morgan - https://github.com/expressjs/morgan
    // Can specify one of 'combined', 'common', 'dev', 'short', 'tiny'
    format: process.env.LOG_FORMAT || "combined",
    fileLogger: {
      directoryPath: process.env.LOG_DIR_PATH || process.cwd(),
      fileName: process.env.LOG_FILE || "app.log",
      maxsize: 10485760,
      maxFiles: 2,
      json: false
    }
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
    sandbox: false
  },
  firebase: {
    storage: {
      baseRef: ""
    }
  },
  multer: {
    userImagePath: process.env.MULTER_IMAGE_PATH || "./public/images/users",
    variantImagePath:
      process.env.MULTER_IMAGE_PATH || "./public/images/variants",
    storeImagePath: process.env.MULTER_IMAGE_PATH || "./public/images/stores"
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
  }
};
