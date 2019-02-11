// import StackGlobalConfig from "src/config/index";
import mongoose, { HookNextFunction } from "mongoose";
import configStack from "@config/index";
import crypto from "crypto";
import validator from "validator";
import generatePassword from "generate-password";
import blacklistPassword from "@config/assets/blacklist-password";
import { Codes } from "@utils/constants/codes";
// import * as owasp from "owasp-password-strength-test";
import chalk from "chalk";
import createSeed from "@utils/models/createSeed";
import { HttpStatus } from "@utils/constants/httpStatus";
const config = configStack.config;
// owasp.config(config.shared.owasp);

const Schema = mongoose.Schema;

export type UserAdminModelMethods = mongoose.Document & {
  reset_password_token: string;
  reset_password_expires: Date;
  hashPassword: Function;
  authenticate: Function;
  generateRandomPassphrase: Function;
  seed: Function;
};

export interface SafeUserStoreAdmin {
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  profile_image_urls: {
    original: string;
    x100: string;
    x256: string;
  };
  roles: string[];
  updated_at: Date;
  created_at: Date;
}

export interface UserAdminModel
  extends UserAdminModelMethods,
    SafeUserStoreAdmin {
  password: string;
  salt: string;
}
//  Exclude<UserStoreAdminModel, "password" | "salt">;

/**
 * A Validation function for local strategy properties
 */
const validateLocalStrategyProperty = {
  validator(property: any) {
    return !this.updated_at || property.length;
  },
  // @ts-ignore
  message: props => "should not be empty"
};

/**
 * A Validation function for local str}ategy email
 */
const validateLocalStrategyEmail = {
  validator(email: string) {
    return !this.updated_at || validator.isEmail(email, { require_tld: false });
  },
  // @ts-ignore
  message: props => ({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    code: Codes.AUTH__INVALID_EMAIL,
    message: "The email you passed is not a valid one"
  })
};

/**
 * UserStoreAdmin Schema
 */
const UserAdminSchema = new Schema({
  first_name: {
    type: String,
    trim: true,
    default: "",
    validate: validateLocalStrategyProperty
  },
  last_name: {
    type: String,
    trim: true,
    default: "",
    validate: validateLocalStrategyProperty
  },
  email: {
    type: String,
    index: {
      unique: true,
      sparse: true // For this to work on a previously indexed field, the index must be dropped & the application restarted.
    },
    lowercase: true,
    trim: true,
    default: "",
    validate: validateLocalStrategyEmail
  },
  password: {
    type: String,
    default: ""
  },
  salt: {
    type: String
  },
  profile_image_urls: {
    original: {
      type: String,
      default: "/public/images/common/default.png"
    },
    x100: {
      type: String,
      default: "/public/images/common/default.png"
    },
    x256: {
      type: String,
      default: "/public/images/common/default.png"
    }
  },
  roles: {
    type: [
      {
        type: String,
        enum: ["admin"]
      }
    ],
    default: ["admin"],
    required: "Please provide at least one role"
  },
  updated_at: {
    type: Date
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  /* For reset password */
  reset_password_token: {
    type: String
  },
  reset_password_expires: {
    type: Date
  }
});

/**
 * Hook a pre save method to hash the password
 */
UserAdminSchema.pre("save", async function(next: HookNextFunction) {
  if (this.password && this.isModified("password")) {
    this.salt = crypto.randomBytes(16).toString("base64");
    this.password = this.hashPassword(this.password);
  }

  next();
});

/**
 * Hook a pre validate method to test the local password
 */
UserAdminSchema.pre("validate", function(next: HookNextFunction) {
  if (
    (this.provider === "local" &&
      this.password &&
      this.isModified("password")) ||
    this.password === ""
  ) {
    if (blacklistPassword.includes(this.password)) {
      this.invalidate("password", Codes.AUTH__BLACKLIST_PASSWORD);
    }
  }

  next();
});

/**
 * Create instance method for hashing a password
 */
UserAdminSchema.methods.hashPassword = function(password: string) {
  if (this.salt && password) {
    return crypto
      .pbkdf2Sync(password, new Buffer(this.salt, "base64"), 10000, 64, "SHA1")
      .toString("base64");
  } else {
    return password;
  }
};

/**
 * Create instance method for authenticating user
 */
UserAdminSchema.methods.authenticate = function(password: string) {
  return this.password === this.hashPassword(password);
};

/**
 * Generates a random passphrase that passes the owasp test
 * Returns a promise that resolves with the generated passphrase, or rejects with an error if something goes wrong.
 * NOTE: Passphrases are only tested against the required owasp strength tests, and not the optional tests.
 */
UserAdminSchema.statics.generateRandomPassphrase = () =>
  new Promise((resolve, reject) => {
    let password = "";
    const repeatingCharacters = new RegExp("(.)\\1{2,}", "g");

    // iterate until the we have a valid passphrase
    // NOTE: Should rarely iterate more than once, but we need this to ensure no repeating characters are present
    while (password.length < 20 || repeatingCharacters.test(password)) {
      // build the random password
      password = generatePassword.generate({
        length: Math.floor(Math.random() * 20) + 20, // randomize length between 20 and 40 characters
        numbers: true,
        symbols: false,
        uppercase: true,
        excludeSimilarCharacters: true
      });

      // check if we need to remove any repeating characters
      password = password.replace(repeatingCharacters, "");
    }

    // resolve with the validated passphrase
    resolve(password);
  });

/**
 * Seeds the UserAdmin collection with document (UserStoreAdmin)
 * and provided options.
 */
UserAdminSchema.statics.seed = createSeed("Admin", "email");

export default mongoose.model<UserAdminModel>("Admin", UserAdminSchema);
