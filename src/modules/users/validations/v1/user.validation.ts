import { body, oneOf } from "express-validator/check";
import i18next from "i18next";
import { Codes } from "@utils/constants/codes";
import { HttpStatus } from "@utils/constants/httpStatus";
import { i18nKeys } from "@utils/constants/i18n";
import middlewareValidation from "@utils/middlewares/validations";

export const edit = [
  body("first_name")
    .not()
    .matches(/\d/)
    .optional()
    .withMessage("First name cannot contain numbers!"),
  body("last_name")
    .not()
    .matches(/\d/)
    .optional()
    .withMessage("Last name cannot contain numbers!"),
  body("display_name")
    .not()
    .matches(/\d/)
    .optional()
    .withMessage("Display name cannot contain numbers!"),
  body("phone")
    .custom(phone => {
      if (!(phone.length === 10 || phone.length === 11)) {
        throw i18next.t(i18nKeys.INVALID_FORMAT_PHONE);
      }

      return true;
    })
    .optional()
    .withMessage(() => ({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      code: Codes.REQUEST__INVALID_PHONE,
      message: i18next.t(i18nKeys.INVALID_FORMAT_PHONE)
    })),
  middlewareValidation
];

export const signup = [
  // username must be an email
  body("email")
    .isEmail()
    .withMessage(() => ({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      code: Codes.AUTH__INVALID_EMAIL,
      message: i18next.t(i18nKeys.INVALID_FORMAT_EMAIL)
    }))
    .not()
    .isEmpty()
    .withMessage("should not be empty"),
  // password must be at least 5 chars long
  body("password")
    .isLength({ min: 6 })
    .withMessage(() => ({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      code: Codes.AUTH__WEAK_PASSWORD,
      message: i18next.t(i18nKeys.WEAK_PASSWORD)
    }))
    .not()
    .isEmpty()
    .withMessage("should not be empty"),
  // firstName must be an email
  body("first_name")
    .not()
    .isEmpty()
    .withMessage("should not be empty"),
  // lastName must be an email
  body("last_name")
    .not()
    .isEmpty()
    .withMessage("should not be empty"),
  // username must be an email
  // body("username")
  //   .not()
  //   .isEmpty()
  //   .withMessage("should not be empty"),
  body("document")
    .not()
    .isEmpty()
    .withMessage("should not be empty"),
  body("city")
    .not()
    .isEmpty()
    .withMessage("should not be empty"),
  body("state")
    .not()
    .isEmpty()
    .withMessage("should not be empty"),
  body("roles")
    .isEmpty()
    .withMessage("should be empty"),
  body("provider")
    .isEmpty()
    .withMessage("should be empty"),
  body("provider_data")
    .isEmpty()
    .withMessage("should be empty"),
  body("additional_providers_data")
    .isEmpty()
    .withMessage("should be empty"),
  body("salt")
    .isEmpty()
    .withMessage("should be empty"),
  body("display_name")
    .isEmpty()
    .withMessage("should be empty"),
  middlewareValidation
];

export const signin = [
  oneOf(
    [
      body("email")
        .not()
        .isEmpty()
        .withMessage("should not be empty")
        .isEmail()
        .withMessage({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          code: Codes.AUTH__INVALID_EMAIL,
          message: "The email you passed is not a valid one2"
        })
      // body("username")
      //   .not()
      //   .isEmpty()
      //   .withMessage("should not be empty")
    ],
    {
      code: Codes.REQUEST__MISSING_PARAMS,
      message: "Please, provide an email",
      status: HttpStatus.UNPROCESSABLE_ENTITY
    }
  ), // password must be at least 5 chars long
  body("password")
    .isLength({ min: 6 })
    .withMessage({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      code: Codes.AUTH__WEAK_PASSWORD,
      message: "Password should have at least 6 caracteres"
    })
    .not()
    .isEmpty()
    .withMessage("should not be empty"),
  middlewareValidation
];

export const changePassword = [
  // username must be an email
  body("currentPassword")
    .not()
    .isEmpty()
    .withMessage("should not be empty"),
  // password must be at least 5 chars long
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage({
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      code: Codes.AUTH__WEAK_PASSWORD,
      message: "Password should have at least 6 caracteres"
    })
    .not()
    .isEmpty()
    .withMessage("should not be empty"),
  // password must be at least 5 chars long
  body("verifyPassword")
    .not()
    .isEmpty()
    .withMessage("should not be empty"),
  middlewareValidation
];

export const addAddress = [
  body("name")
    .exists({ checkFalsy: true })
    .withMessage("should not be empty"),
  body("state")
    .exists({ checkFalsy: true })
    .withMessage("should not be empty"),
  body("country")
    .exists({ checkFalsy: true })
    .withMessage("should not be empty"),
  body("city")
    .exists({ checkFalsy: true })
    .withMessage("should not be empty"),
  body("zip_code")
    .exists({ checkFalsy: true })
    .withMessage("should not be empty"),
  body("street")
    .exists({ checkFalsy: true })
    .withMessage("should not be empty"),
  body("number")
    .exists({ checkFalsy: true })
    .withMessage("should not be empty"),
  body("neighborhood")
    .exists({ checkFalsy: true })
    .withMessage("should not be empty"),
  // body("location").custom(({ latitude, longitude }) => {
  //   validateLatLong(latitude, longitude);

  //   return true;
  // }),
  middlewareValidation
];

function validateLatLong(latitude: number, longitude: number): void {
  if (
    !(
      latitude &&
      longitude &&
      !isNaN(Number(latitude)) &&
      !isNaN(Number(longitude))
    )
  ) {
    throw new Error(
      "Location object must be in format '{ latitude, longitude }'"
    );
  }
}

export const editAddress = [
  body("location").custom(location => {
    if (location) {
      validateLatLong(location.latitude, location.longitude);
    }

    return true;
  }),
  middlewareValidation
];
