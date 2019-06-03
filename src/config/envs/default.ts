import firebaseAdmin from "firebase-admin";

const serverEnv = {
  outDir: "src",
  extension: "ts",
  app: {
    title: "DITTO.TS",
    description: "RESTFUL API FOR 'BACKEND'",
    keywords: "mongodb, express, node.js, mongoose, passport, typescript",
    googleAnalyticsTrackingID:
      process.env.GOOGLE_ANALYTICS_TRACKING_ID || "GOOGLE_ANALYTICS_TRACKING_ID"
  },
  jwt: {
    prefix: "JWT"
  },
  db: {
    promise: global.Promise
  },
  port: process.env.PORT || 3000,
  host: process.env.HOST || "0.0.0.0",
  // DOMAIN config should be set to the fully qualified application accessible
  // URL. For example: https://www.myapp.com (including port if required).
  domain: process.env.DOMAIN,
  // Lusca config
  csrf: {
    csrf: false,
    csp: false,
    xframe: "SAMEORIGIN",
    p3p: "ABCDEF",
    xssProtection: true
  },
  firebase: {
    app: {
      credential: process.env.FIREBASE_ADMIN_JSON
        ? firebaseAdmin.credential.cert(
            JSON.parse(process.env.FIREBASE_ADMIN_JSON)
          )
        : firebaseAdmin.credential.cert(
            require("../../../firebase-admin-sdk.json")
          )
    },
    storage: {
      bucketName: "gallerist-b72a4.appspot.com"
    }
  },
  aws: {
    s3: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || "AKIAZIZYQBSNABYC2F53",
      secretAccessKey:
        process.env.S3_SECRET_ACCESS_KEY ||
        "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",
      bucket: process.env.S3_BUCKET || "test-ditto"
    }
  },
  uploads: {
    // Storage can be 'local' | 's3' | 'firebase'
    storage: process.env.UPLOADS_STORAGE || "local",
    profile: {
      image: {
        // dest: "./modules/users/client/img/profile/uploads/",
        limits: {
          fileSize: 1 * 1024 * 1024 // Max file size in bytes (1 MB)
        }
      }
    }
  },
  gMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY
  },
  shared: {
    owasp: {
      allowPassphrases: true,
      maxLength: 128,
      minLength: 6,
      minPhraseLength: 20,
      minOptionalTestsToPass: 2
    }
  }
};

export default serverEnv;
