import { Application } from "express";

import * as users from "@modules/users/controllers/v1/users.controller";
import * as authentication from "@modules/users/controllers/v1/users.authentication.controller";
import * as validations from "@modules/users/validations/v1/user.validation";
import * as password from "@modules/users/controllers/v1/users.password.controller";
import * as policies from "@modules/users/policies/v1/user.policy";
import { middleware } from "express-paginate";
// API V1 User Routes
export default (app: Application) => {
  /**
   * @apiDefine UserNotAuthenticated
   *
   * @apiError (403) UserNotAuthenticated User not authenticated
   * @apiErrorExample {Object} UserNotAuthenticated Error-Response:
   * {
   *    "success": false,
   *    "error": {
   *        "message": "The user has no authorization to access this route",
   *        "status": 403,
   *        "code": "auth/user-not_authorized"
   *    }
   * }
   */

  /**
   * @apiDefine UserOrderDataResponse
   *
   * @apiSuccess (200) {Number} data.adjustment_total The sum of all adjustments on this order
   * @apiSuccess (200) {Number} data.total Result of item_total + adjustment_total
   * @apiSuccess (200) {Number} data.item_total The sum of all the line items for this order
   * @apiSuccess (200) {Number} data.shipment_total The total value of all shipments’ costs
   * @apiSuccess (200) {Number} data.additional_tax_total The sum of all shipments’ and line items’ additional_tax
   * @apiSuccess (200) {Number} data.included_tax_total The sum of all shipments’ and line items’ included_tax
   * @apiSuccess (200) {Number} data.promo_total The sum of all shipments’, line items’ and promotions’ promo_total
   * @apiSuccess (200) {String} data.state Order's current state
   * @apiSuccess (200) {String} data.email Email of the user that create the order
   * @apiSuccess (200) {String} data.currency Currency
   * @apiSuccess (200) {Number} data.item_count Number of items in the order
   * @apiSuccess (200) {Object[]} data.state_history Array of objects containing past order's states
   * @apiSuccess (200) {Object[]} data.order_stores OrderStores' objects for each store of the order
   * @apiSuccess (200) {Object[]} data.user ID of the user that create the order
   */

  /**
   * @apiDefine UserDataResponse
   *
   * @apiSuccess (200) {Boolean} success Success
   * @apiSuccess (200) {Object} data User object
   * @apiSuccess (200) {Object} data.profile_image_urls Profile pictures object
   * @apiSuccess (200) {String} data.profile_image_urls.original
   * @apiSuccess (200) {String} data.profile_image_urls.x100
   * @apiSuccess (200) {String} data.profile_image_urls.x256
   * @apiSuccess (200) {String} data.first_name First name
   * @apiSuccess (200) {String} data.last_name Last name
   * @apiSuccess (200) {String} data.display_name Display name
   * @apiSuccess (200) {String} data.email Email
   * @apiSuccess (200) {String[]} data.roles Roles
   * @apiSuccess (200) {String} data._id ID
   * @apiSuccess (200) {String} data.phone Phone
   * @apiSuccess (200) {Object[]} data.addresses Addresses in AddressSchema's format
   * @apiSuccess (200) {String} data.created Date when user was created
   * @apiSuccess (200) {String} data.provider Signup provider
   *
   * @apiSuccessExample {Object} Response-Example:
   * "data": {
   *     "profile_image_urls": {
   *         "original": "/public/images/common/default.png",
   *         "x100": "/public/images/common/default.png",
   *         "x256": "/public/images/common/default.png"
   *     },
   *     "first_name": "User",
   *     "last_name": "Local",
   *     "email": "user@localhost.com",
   *     "roles": [ "user" ],
   *     "_id": "5c374bbe0fae130c9f5a36e7",
   *     "phone": "12312335111",
   *     "addresses": [
   *         {
   *             "_id": "5c375ec030472819c08082fe",
   *             "name": "Casa",
   *             "state": "Amapá",
   *             "country": "Brazil",
   *             "city": "Belém",
   *             "zip_code": "66040100",
   *             "street": "Av. Conselheiro Furtado",
   *             "number": "1625",
   *             "neighbourhood": "Cremação",
   *             "location": {
   *                 "coordinates": [
   *                     48.1321,
   *                     1.48
   *                 ],
   *                 "_id": "5c375fdfde24f41a121c7cc8",
   *                 "type": "Point"
   *             }
   *         }
   *     ],
   *     "created": "2019-01-10T13:42:22.806Z",
   *     "provider": "local",
   *     "display_name": "User Local",
   * }
   */
  app
    .route("/api/v1/users")
    .all(policies.isAllowed)
    // .get(users.list)
    /**
     *
     * @api {PUT} /api/v1/users Update user's info
     * @apiGroup Users
     *
     *
     * @apiParam  {String} first_name User's new first name
     * @apiParam  {String} last_name User's new last name
     * @apiParam  {String} display_name User's new display name
     * @apiParam  {String} phone User's new phone
     *
     * @apiSuccess (200) {Boolean} success Success
     *
     * @apiParamExample  {Object} Request-Example:
     * {
     *   first_name: "User",
     *   last_name : "Local",
     *   display_name: "User Local",
     *   phone: "12312335111"
     * }
     *
     * @apiUse UserDataResponse
     *
     * @apiUse UserNotAuthenticated
     *
     * @apiError (401) ErrorGetAuthenticatedUser Error while getting authenticated user
     * @apiErrorExample {Object} ErrorGetAuthenticatedUser Error-Response:
     * {
     *    "success": false,
     *    "error": {
     *        "message": "Error while getting authenticated user",
     *        "status": 403,
     *        "code": "auth/user-not-found"
     *    }
     * }
     * @apiError (500) InputValidationError Wrong input
     * @apiErrorExample InputValidationError Error-Response:
     * {
     *     "success": false,
     *     "error": {
     *         "message": "Your request not match if our specification and we could not find the reason",
     *         "status": 500,
     *         "code": "unknown_error"
     *     }
     * }
     * @apiError (500) UpdateUserError Save error
     * @apiErrorExample UpdateUserError Error-Response:
     * {
     *    "success": false,
     *     "error": {
     *         "message": "Error while updating user information!",
     *         "status": 500,
     *         "code": "mongo/save-error"
     *     }
     * }
     */
    .put(validations.edit, users.edit);

  // Setting up the users profile api
  app
    .route("/api/v1/users/me")
    /**
     * @api {GET} /api/v1/users/me Get authenticated user's info
     *
     * @apiGroup Users
     *
     * @apiUse UserDataResponse
     *
     * @apiUse UserNotAuthenticated
     */
    .get(users.me);

  app
    .route("/api/v1/users/profile")
    .all(policies.isAllowed)
    .post(users.changeProfilePicture);

  /**
   *
   * @api {POST} /api/v1/users/password Change user's password
   * @apiGroup Users
   *
   *
   * @apiParam  {String} currentPassword User's current password
   * @apiParam  {String} newPassword User's new password
   * @apiParam  {String} verifyPassword User's current password verification
   *
   * @apiSuccess (200) {Boolean} success Success
   *
   * @apiParamExample  {Object} Request-Example:
   * {
   *   currentPassword: "pass",
   *   newPassword : "pass2",
   *   verifyPassword: "pass"
   * }
   *
   *
   * @apiSuccessExample {Object} Response-Example:
   * "data": {
   *     message: "Password changed successfully"
   * }
   *
   * @apiError (422) IncorrectPassword Incorrect password
   * @apiErrorExample {Object} IncorrectPassword Error-Response:
   * {
   *    "success": false,
   *    "error": {
   *        "message": "Current password is incorrect",
   *        "status": 422,
   *    }
   * }
   * @apiError (422) NoMatchPassword Passwords don't match
   * @apiErrorExample {Object} NoMatchPassword Error-Response:
   * {
   *    "success": false,
   *    "error": {
   *        "message": "Passwords do not match",
   *        "status": 422,
   *    }
   * }
   * @apiError (500) InputValidationError Wrong input
   * @apiErrorExample InputValidationError Error-Response:
   * {
   *     "success": false,
   *     "error": {
   *         "message": "Your request not match if our specification and we could not find the reason",
   *         "status": 500,
   *         "code": "unknown_error"
   *     }
   * }
   * @apiError (500) UpdateUserError Save error
   * @apiErrorExample UpdateUserError Error-Response:
   * {
   *    "success": false,
   *     "error": {
   *         "message": "Error while updating user information!",
   *         "status": 500,
   *         "code": "mongo/save-error"
   *     }
   * }
   */
  app
    .route("/api/v1/users/password")
    .all(policies.isAllowed)
    .post(validations.changePassword, password.changePassword);

  /**
   *
   * @api {POST} /api/v1/signup User signup
   * @apiGroup Users
   *
   *
   * @apiParam  {String} email User's  email
   * @apiParam  {String} password User's password
   * @apiParam  {String} first_name User's first name
   * @apiParam  {String} last_name User's last name
   * @apiParam  {String} phone User's phone
   *
   * @apiSuccess (200) {Boolean} success Success
   *
   * @apiParamExample  {Object} Request-Example:
   * {
   *     "first_name": "first_name",
   *     "last_name": "last_name",
   *     "email": "your@email.com",
   *     "document": "61339054094",
   *     "password": "password"
   *     "phone": "phone",
   *     "city": "Belém",
   *     "state": "Pará"
   * }
   *
   *
   * @apiSuccessExample {Object} Response-Example:
   * {
   * "success": true,
   * "data": {
   *     "user": {
   *         "profile_image_urls": {
   *             "original": "/public/images/common/default.png",
   *             "x100": "/public/images/common/default.png",
   *             "x256": "/public/images/common/default.png"
   *         },
   *         "first_name": "first_name",
   *         "last_name": "last_name",
   *         "email": "your@email.com",
   *         "document": "61339054094",
   *         "roles": [
   *             "user"
   *         ],
   *         "_id": "id",
   *         "city": "Belém",
   *         "state": "Pará"
   *         "created": "2018-11-26T20:31:17.674Z",
   *         "provider": "local",
   *         "display_name": "display_name",
   *         "__v": 0,
   *         "addresses": [],
   *         "phone": "phone"
   *     },
   *     "token": "token"}
   *
   * }
   *
   * @apiError (422) EmailAlreadyExists Email already exists
   * @apiErrorExample {Object} EmailAlreadyExists Error-Response:
   * {
   *    "success": false,
   *    "error": {
   *        "message": "Email alreadyExists",
   *        "status": 422,
   *        "code": "auth/email-already-in-use"
   *    }
   *
   * }
   *
   * @apiError (422) FirstNameRequired User first name required
   * @apiErrorExample {Object} FirstNameRequired Error-Response:
   * {
   *     "success": false,
   *     "error": {
   *         "message": "First name is a required field",
   *         "status": 422,
   *         "code": "request/missing-params"
   *     }
   * }
   * @apiError (422) LastNameRequired User last name required
   * @apiErrorExample {Object} LastNameRequired Error-Response:
   * {
   *     "success": false,
   *     "error": {
   *         "message": "Last name is a required field",
   *         "status": 422,
   *         "code": "request/missing-params"
   *     }
   * }
   * @apiError (422) EmailRequired Email required
   * @apiErrorExample {Object} EmailRequired Error-Response:
   * {
   *     "success": false,
   *     "error": {
   *         "message": "Email is a required field",
   *         "status": 422,
   *         "code": "request/missing-params"
   *     }
   * }
   */
  // Setting up the users authentication api

  app.route("/api/v1/signup").post(validations.signup, authentication.signup);

  /**
   *
   * @api {POST} /api/v1/signin User signin
   * @apiGroup Users
   *
   *
   * @apiParam  {String} email User's  email
   * @apiParam  {String} password User's password
   *
   * @apiSuccess (200) {Boolean} success Success
   *
   * @apiParamExample  {Object} Request-Example:
   * {
   *     "email": "your@email.com",
   *     "password": "pass"
   * }
   *
   *
   * @apiSuccessExample {Object} Response-Example:
   * {
   * "success": true,
   * "data": {
   *     "user": {
   *         "profile_image_urls": {
   *             "original": "/public/images/common/default.png",
   *             "x100": "/public/images/common/default.png",
   *             "x256": "/public/images/common/default.png"
   *         },
   *         "first_name": "first_name",
   *         "last_name": "last_name",
   *         "email": "your@email.com",
   *         "roles": [
   *             "user"
   *         ],
   *         "_id": "id",
   *         "created": "2018-11-26T20:31:17.674Z",
   *         "provider": "local",
   *         "display_name": "display_name",
   *         "__v": 0,
   *         "addresses": []
   *     },
   *     "token": "token"}
   *
   * }
   * @apiError (422) NoMatchPassword Password doesn't match
   * @apiErrorExample {Object} NoMatchPassword Error-Response:
   * {
   *       "success": false,
   *       "error": {
   *           "message": "The password not match if the email you passed",
   *           "status": 422,
   *           "code": "auth/wrong-password"
   *       }
   * }
   * @apiError (422) EmailNotFound Email not found
   * @apiErrorExample {Object} EmailNotFound Error-Response:
   * {
   *    "success": false,
   *    "error": {
   *        "message": "Cound not found any user with that email",
   *        "status": 422,
   *        "code": "auth/user-not-found"
   * }
   *
   * }
   */

  app.route("/api/v1/signin").post(validations.signin, authentication.signin);

  app.route("/api/v1/users/:userId");
  // .all(policies.isAllowed)
  // .get(users.read);

  // Finish by binding the article middleware
  app.param("userId", users.userByID);
};
