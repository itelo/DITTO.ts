import mongoose, { HookNextFunction } from "mongoose";
import configStack from "@config/index";
import crypto from "crypto";
import validator from "validator";
import generatePassword from "generate-password";
import blacklistPassword from "@config/assets/blacklist-password";
import { Codes } from "@utils/constants/codes";
import chalk from "chalk";
import createSeed from "@utils/models/createSeed";
import { HttpStatus } from "@utils/constants/httpStatus";
import states from "@utils/constants/states";
const config = configStack.config;

const Schema = mongoose.Schema;

export type UserModelMethods = mongoose.Document & {
  reset_password_token: string;
  reset_password_expires: Date;
  hashPassword: Function;
  authenticate: Function;
  generateRandomPassphrase: Function;
  seed: Function;
};

export interface SafeUser {
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  document: string;
  phone: string;

  city: string;
  state: string;
  profile_image_urls: {
    original: string;
    x256: string;
    x720: string;
  };
  provider: string;
  provider_data: object;
  additional_providers_data?: any;
  // {
  //   facebook?: any;
  //   google?: any;
  // };
  roles: string[];
  updated: Date;
  created: Date;
}

export interface UserModel extends UserModelMethods, SafeUser {
  password: string;
  salt: string;
}

export enum USER_ROLES {
  USER = "user",
  ADMIN = "admin"
}

export enum USER_PROVIDERS {
  LOCAL = "local",
  GOOGLE = "google",
  FACEBOOK = "facebook"
}

/**
 * A Validation function for local strategy properties
 */
const validateLocalStrategyProperty = {
  validator(property: any) {
    return (this.provider !== "local" && !this.updated) || property.length;
  },
  message: () => "should not be empty"
};

/**
 * A Validation function for local str}ategy email
 */
const validateLocalStrategyEmail = {
  validator(email: string) {
    return (
      (this.provider !== "local" && !this.updated) ||
      validator.isEmail(email, { require_tld: false })
    );
  },
  // @ts-ignore
  message: props => ({
    status: HttpStatus.UNPROCESSABLE_ENTITY,
    code: Codes.AUTH__INVALID_EMAIL,
    message: "The email you passed is not a valid one"
  })
};

const validatePhone = {
  validator: (v: string) => {
    return v.length === 10 || v.length === 11;
  },
  // @ts-ignore
  message: props => `${props.value} is not a valid phone number!`
};

/**
 * User Schema
 */
const UserSchema = new Schema({
  first_name: {
    type: String,
    trim: true,
    default: ""
    // validate: validateLocalStrategyProperty
  },
  last_name: {
    type: String,
    trim: true,
    default: ""
    // validate: validateLocalStrategyProperty
  },
  display_name: {
    type: String,
    trim: true
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
  document: {
    type: String,
    trim: true,
    validate: (doc: string) => /^[0-9]{11}$/.test(doc)
  },
  phone: {
    type: String,
    index: {
      unique: true,
      sparse: true // For this to work on a previously indexed field, the index must be dropped & the application restarted.
    },
    lowercase: true,
    trim: true,
    validate: validatePhone
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    enum: states,
    trim: true,
    uppercase: true
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
    x256: {
      type: String,
      default: "/public/images/common/default.png"
    },
    x720: {
      type: String,
      default: "/public/images/common/default.png"
    }
  },
  provider: {
    type: String,
    required: "should not be empty"
  },
  provider_data: {},
  additional_providers_data: {},
  roles: {
    type: [
      {
        type: String,
        enum: [USER_ROLES.ADMIN, USER_ROLES.USER]
      }
    ],
    default: [USER_ROLES.USER],
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
  },
  albums: [
    {
      album_id: String
    }
  ]
});

/**
 * Hook a pre save method to hash the password
 */
UserSchema.pre("save", function(next: HookNextFunction) {
  if (this.password && this.isModified("password")) {
    this.salt = crypto.randomBytes(16).toString("base64");
    this.password = this.hashPassword(this.password);
  }

  next();
});

/**
 * Hook a pre validate method to test the local password
 */
UserSchema.pre("validate", function(next: HookNextFunction) {
  if (
    (this.provider === USER_PROVIDERS.LOCAL &&
      this.password &&
      this.isModified("password")) ||
    (this.provider === USER_PROVIDERS.LOCAL && this.password === "")
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
UserSchema.methods.hashPassword = function(password: string) {
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
UserSchema.methods.authenticate = function(password: string) {
  return this.password === this.hashPassword(password);
};

/**
 * Find possible not used username
 */
UserSchema.statics.findUniqueUsername = (
  username: string,
  suffix: string,
  callback: Function
) => {
  const possibleUsername = username.toLowerCase() + (suffix || "");

  this.findOne({
    username: possibleUsername
  })
    .then((user: UserModel) => {
      if (!user) {
        callback(possibleUsername);
      } else {
        return this.findUniqueUsername(
          username,
          `${suffix || 0} + 1`,
          callback
        );
      }
    })
    .catch((err: Error) => {
      if (!err) {
      } else {
        callback(undefined);
      }
    });
};

/**
 * Generates a random passphrase that passes the owasp test
 * Returns a promise that resolves with the generated passphrase, or rejects with an error if something goes wrong.
 * NOTE: Passphrases are only tested against the required owasp strength tests, and not the optional tests.
 */
UserSchema.statics.generateRandomPassphrase = () =>
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
 * Seeds the User collection with document (User)
 * and provided options.
 */
UserSchema.statics.seed = createSeed("User", "username");

export default mongoose.model<UserModel>("User", UserSchema);
