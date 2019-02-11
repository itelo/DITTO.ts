import { Request } from "express";
import { Location } from "express-validator/check/location";
import i18next from "i18next";
import { Codes } from "@utils/constants/codes";
import { HttpStatus } from "@utils/constants/httpStatus";

interface ErrorResponse {
  code: Codes;
  status: HttpStatus;
  message: string;
}

interface ErrorFormatter {
  nestedErrors: any;
  location: Location;
  param: string;
  msg: string | ErrorResponse;
  value: any;
}

interface ErrorFormatterEmpty {
  nestedErrors?: undefined;
  location?: undefined;
  param?: undefined;
  msg?: undefined;
  value?: undefined;
}

interface HandleWithExpressValidationErrorsResultFalse {
  error?: undefined;
  hasError: false;
}

interface HandleWithExpressValidationErrorsResultTrue {
  error: ErrorResponse;
  hasError: true;
}
/**
 *
 *
 * @export
 * @param {Request} req
 * @param {(ErrorFormatter[] | ErrorFormatterEmpty[])} validationErrors
 * @returns {(HandleWithExpressValidationErrorsResultFalse
 *   | HandleWithExpressValidationErrorsResultTrue)}
 */
export function handleWithExpressValidationErrors(
  req: Request,
  validationErrors: ErrorFormatter[] | ErrorFormatterEmpty[]
):
  | HandleWithExpressValidationErrorsResultFalse
  | HandleWithExpressValidationErrorsResultTrue {
  const sbe = [];
  const snbe = [];
  let singleError;

  const bodyFields = req.body ? Object.keys(req.body) : [];

  for (const error of validationErrors) {
    if (typeof error.msg === "object") {
      singleError = error.msg;
    }
  }

  /**
   * Due to how the express validation works, we need to check if
   * has any errors from 'oneOf', if oneOf error occurs they will put in
   * error.nestedError, then we can move on
   */
  for (const error of validationErrors) {
    if (error.nestedErrors) {
      for (const nestedError of error.nestedErrors) {
        /**
         * Nested errors contain all errors describe in oneOf validation,
         * this mean we need to check in body if the body even contain that field,
         */
        if (bodyFields.includes(nestedError.param)) {
          singleError = nestedError.msg;
          break;
        }
      }
      /**
       * Here we check if we found any possible error
       * if not, we attributed the error message to our error
       */
      if (typeof singleError !== "object") {
        singleError = error.msg;
      }
    }
  }

  // if (singleError)

  if (typeof singleError !== "object") {
    for (const error of validationErrors) {
      if (error.location === "body") {
        if (error.msg === "should not be empty") {
          snbe.push(error.param);
        } else if (error.msg === "should be empty") {
          sbe.push(error.param);
        } else if (
          (error.param === "password" || error.param === "email") &&
          Object.keys(error.msg).length > 0
        ) {
          singleError = error.msg;
        }
      } else if (error.location === "headers") {
        /**
         * put the error in the singleError helper then break
         * we break were because, normally the error will be
         * missing tokens, so, this error is the most important one
         */
        singleError = error.msg;
        break;
      }
    }
  }

  /**
   * first we check if "signleError" variable contain something,
   * if this variable is not undefiend, they must contain
   */
  if (singleError && typeof singleError !== "string") {
    return {
      error: { ...singleError },
      hasError: true
    };
  }

  /**
   * then we check if "should be empty", due to we don't want the client
   * to hard insert information.
   */

  if (sbe.length > 0) {
    const fields = sbe.join(",").replace(/,([^,]*)$/, " and $1");
    const message = `${fields} should not be in the request`;
    return {
      error: {
        code: Codes.REQUEST__UNDESIRED_FIELDS,
        message,
        status: HttpStatus.UNPROCESSABLE_ENTITY
      },
      hasError: true
    };
  }

  /**
   * finally we check if "should not be empty", due to we want the request
   * have all data
   */
  if (snbe.length > 0) {
    const fields = translateFields(snbe)
      .join(",")
      .replace(/,([^,]*)$/, ` ${i18next.t("pluralFieldsRequired")} $1`);

    const message = `${fields} ${i18next.t("REQUIRED_FIELD", {
      count: snbe.length
    })}`;
    return {
      error: {
        code: Codes.REQUEST__MISSING_PARAMS,
        message,
        status: HttpStatus.UNPROCESSABLE_ENTITY
      },
      hasError: true
    };
  }

  return {
    hasError: false
  };
}

function translateFields(snbe: string[]) {
  return snbe.map(t => {
    return i18next.t(t);
  });
}
