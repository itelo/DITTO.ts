import mongoose, { HookNextFunction } from "mongoose";
import configStack from "@config/index";
import crypto from "crypto";
import validator from "validator";
import generatePassword from "generate-password";
import blacklistPassword from "@config/assets/blacklist-password";
import { Codes } from "@utils/constants/codes";
import createSeed from "@utils/models/createSeed";
import { HttpStatus } from "@utils/constants/httpStatus";
const config = configStack.config;

const Schema = mongoose.Schema;

export type UserModelMethods = mongoose.Document & {
  reset_password_token: string;
  reset_password_expires: Date;
  hashPassword: Function;
  authenticate: Function;
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
  additional_providers_data?: {
    facebook?: any;
    google?: any;
  };
  roles: string[];
  created_at: Date;
  updated_at?: Date;
  deleted_at?: Date;
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
  },
  last_name: {
    type: String,
    trim: true,
    default: ""
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
  phone: {
    type: String,
    index: {
      unique: true,
      sparse: true
    },
    lowercase: true,
    trim: true,
    validate: validatePhone
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
    enum: [
      USER_PROVIDERS.LOCAL,
      USER_PROVIDERS.GOOGLE,
      USER_PROVIDERS.FACEBOOK
    ],
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
  deleted_at: {
    type: Date
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
 * Seeds the User collection with document (User)
 * and provided options.
 */
UserSchema.statics.seed = createSeed("User", "_id");

export default mongoose.model<UserModel>("User", UserSchema);
