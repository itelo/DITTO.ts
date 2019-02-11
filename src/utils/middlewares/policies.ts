import { Response, NextFunction } from "express";
import * as responses from "@utils/formaters/responses";
import { HttpStatus } from "@utils/constants/httpStatus";
import { Codes } from "@utils/constants/codes";
import passport from "passport"; // needs to be imported because of 'user' property in Request interface

export function areAnyRolesAllowed(
  acl: any, // acl has no exported Acl type, thus it has to be 'any'
  res: Response,
  next: NextFunction,
  roles: string[],
  path: string,
  method: string
) {
  acl.areAnyRolesAllowed(
    roles,
    path,
    method,
    (err: Error, isAllowed: boolean) => {
      if (err) {
        console.error(err);
        // An authorization error occurred
        return responses.sendError(
          res,
          Codes.AUTH__UNEXPECTED_AUTHORIZATION,
          "Unexpected authorization error",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
        // res.status(500).send();
      } else {
        if (isAllowed) {
          // Access granted! Invoke next middleware
          return next();
        } else {
          return responses.sendError(
            res,
            Codes.AUTH__USER_NOT_AUTHORIZED,
            "The user has no authorization to access this route",
            HttpStatus.FORBIDDEN
          );
        }
      }
    }
  );
}
