import { AppOptions } from "firebase-admin";
export interface App {
  title: string;
  description: string;
  keywords: string;
  googleAnalyticsTrackingID: string;
}

export interface Csrf {
  csrf: boolean;
  csp: boolean;
  xframe: string;
  p3p: string;
  xssProtection: boolean;
}

export interface Owasp {
  allowPassphrases: boolean;
  maxLength: number;
  minLength: number;
  minPhraseLength: number;
  minOptionalTestsToPass: number;
}

export interface Secure {
  ssl: boolean;
  privateKey: string;
  certificate: string;
  caBundle: string;
}

export interface Files {
  allJS: string[];
  models: string[];
  routes: string[];
  configs: string[];
  policies: string[];
  sockets: string[];
  typedefs: string[];
  resolvers: string[];
  validations: [string];
  i18n: string;
}

export type Elasticsearch = {
  host: string;
  indices: {
    products: {
      index: string;
      type: string;
    };
    stores: {
      index: string;
      type: string;
    };
  };
  retrySync: {
    maxRetries: number;
    retryInterval: number;
  };
};

export type Mailer = {
  from: string;
  options: {
    service: string;
    auth: {
      user: string;
      pass: string;
    };
  };
};

export interface ConfigEnvsObject {
  mailer: Mailer;
  elasticsearch: Elasticsearch;
  extension: string;
  outDir: string;
  app: App;
  sessionSecret: string;
  seedDB: {
    seed: boolean;
    options: any;
    collections: {
      model: string;
      docs: any[];
    }[];
  };
  db: {
    promise: Promise<any>;
    uri: string;
    debug: boolean;
    options?: {
      ssl?: boolean;
      sslValidate?: boolean;
      checkServerIdentity?: boolean;
      sslCA?: string;
      sslCert?: string;
      sslKey?: string;
      sslPass?: string;
    };
  };
  port: number;
  host: string;
  domain: string;
  csrf: Csrf;
  illegalUsernames: string[];
  shared: {
    owasp: Owasp;
  };
  files: Files;
  secure: Secure;
  firebase: FirebaseConfig;
  gMaps: { apiKey?: string };
  utils: {
    getGlobbedPaths: Function;
    validateSessionSecret: Function;
  };
  log: {
    format: string;
    fileLogger: {
      directoryPath: string;
      fileName: string;
      maxsize: number;
      maxFiles: number;
      json: boolean;
    };
  };
  jwt: {
    secret: string;
    prefix: string;
  };
  facebook: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  google: {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
  };
  multer: {
    userImagePath: string;
    variantImagePath: string;
    storeImagePath: string;
  };
}

export interface FirebaseConfig {
  app: AppOptions;
  storage: {
    baseRef: string;
    bucketName: string;
  };
}

// export interface ConfiguredEnvsObject extends ConfigEnvsObject {
//   // allJS: [string] | undefined;
//   models: [string] | undefined;
//   routes: [string] | undefined;
//   configs: [string] | undefined;
//   policies: [string] | undefined;
// }
