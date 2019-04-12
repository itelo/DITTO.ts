import firebaseAdmin from "firebase-admin";

const serverEnv = {
  outDir: "src",
  extension: "ts",
  app: {
    title: "BITX.TS",
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
      // databaseURL: "https://bitx-cloud.firebaseio.com"/*,
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
