/**
 *
 *
 * firebase.google.com/docs/reference/js/firebase.auth.Auth
 */

export enum Codes {
  /**
   * AUTH codes
   */
  // Thrown if there is no user corresponding to the given param (username, userId, email)
  AUTH__USER_NOT_FOUND = "auth/user-not-found",
  AUTH__WRONG_PASSWORD = "auth/wrong-password",
  // Thrown if the passowrd is not strong enough.
  AUTH__WEAK_PASSWORD = "auth/weak-password",
  AUTH__BLACKLIST_PASSWORD = "auth/blacklist-password",
  // Thrown if the user's credential is no longer valid. The user must sign in again.
  AUTH__INVALID_USER_TOKEN = "auth/invalid-user-token",
  // Thrown if the user's credential has expired. This could also be thrown if a user has been deleted. Prompting the user to sign in again should resolve this for either case.
  AUTH__USER_TOKEN_EXPIRED = "auth/user-token-expired",
  // Thrown if the user's last sign-in time does not meet the security threshold
  AUTH__REQUIRES_RECENT_LOGIN = "auth/requires-recent-login",
  // Thrown if the user account has been disabled by an administrator. Accounts can be enabled or disable.
  AUTH__USER_DISABLED = "auth/user-disabled",
  // Thrown if the password reset code has expired.
  AUTH__EXPIRED_RESET_CODE = "auth/expired-rest-code",
  // Thrown if the password reset code is invalid. This can happen if the code is malformed or has already been used.
  AUTH__INVALID_RESET_CODE = "auth/invalid-rest-code",
  // Thrown if there already exists an account with the given email address.
  AUTH__EMAIL_ALREADY_IN_USE = "auth/email-already-in-use",
  // Thrown if there already exists an account with the given username address.
  // AUTH__USERNAME_ALREADY_IN_USE = "auth/username-already-in-use",
  // Thrown if there already exists an account with the given unique address.
  AUTH__UNIQUE_ALREADY_IN_USE = "auth/unique-already-in-use",
  // Thrown if the email address is not valid.
  AUTH__INVALID_EMAIL = "auth/invalid-email",
  AUTH__INVALID_USERNAME_FORMAT = "auth/invalid-username-format",
  AUTH__USER_NOT_AUTHORIZED = "auth/user-not_authorized",
  //
  // Unexpected authorization error
  AUTH__UNEXPECTED_AUTHORIZATION = "auth/unexpected-authorization",
  /**
   * Media codes
   */
  // Thrown if the the media passed is not one of desired.
  MEDIA__UNSUPPORTED_MEDIA_TYPE = "media/unsupported-media-type",
  // Thrown if the the media passed is too large.
  MEDIA__LIMIT_UNEXPECTED_FILE = "media/limit-unexpected-file",

  /**
   * unknown code
   */
  UNKNOWN_ERROR = "unknown_error",

  /**
   * Request Codes
   */
  REQUEST__MISSING_PARAMS = "request/missing-params",
  REQUEST__UNDESIRED_FIELDS = "request/undesired-fields",
  REQUEST__INVALID_PHONE = "request/invalid-phone",
  REQUEST__INVALID_NAME = "request/invalid-name",
  /**
   * Mongo Codes
   */
  MONGO__MISSING_DATA = "mongo/missing-data",
  MONGO__READ_ERROR = "mongo/read-error",
  MONGO__SAVE_ERROR = "mongo/save-error",

  /**
   * Models
   */
  USER__NOT_FOUND = "user/not-found"
}

// function firebaseToCON(code) {
//   return code.replace("/", "__").replace(new RegExp("-", "g"), "_");
// }
