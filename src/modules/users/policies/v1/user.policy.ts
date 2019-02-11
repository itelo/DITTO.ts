/**
 * Module dependencies
 */
import aclConstructor from "acl";
import { Request, Response, NextFunction } from "express";
import * as responses from "@utils/formaters/responses";
import { HttpStatus } from "@utils/constants/httpStatus";
import { Codes } from "@utils/constants/codes";
import passport from "passport";
import { UserModel } from "@models/user.model";

// Using the memory backend
// console.log(aclConstructor);

const acl = new aclConstructor(new aclConstructor.memoryBackend());

interface RequestWithUserDoc extends Request {
  userDoc: UserModel;
}

/**
 * Invoke Users Permissions
 */
export function invokeRolesPolicies() {
  acl.allow([
    {
      roles: ["user"],
      allows: [
        {
          resources: "/api/v1/users/me",
          permissions: ["get"]
        },
        {
          resources: "/api/v1/users",
          permissions: ["put"]
        },
        {
          resources: "/api/v1/users/profile",
          permissions: ["post"]
        },
        {
          resources: "/api/v1/users/password",
          permissions: ["post"]
        },
        {
          resources: "/api/v1/users/address",
          permissions: ["post"]
        },
        {
          resources: "/api/v1/users/address/:addressId",
          permissions: ["delete"]
        }
      ]
    },
    {
      roles: ["admin"],
      allows: [
        {
          resources: "/api/v1/users/me",
          permissions: ["*"]
        },
        {
          resources: "/api/v1/users",
          permissions: ["*"]
        },
        {
          resources: "/api/v1/users/profile",
          permissions: ["*"]
        },
        {
          resources: "/api/v1/users/password",
          permissions: ["*"]
        },
        {
          resources: "/api/v1/users/address",
          permissions: ["*"]
        },
        {
          resources: "/api/v1/users/address/:addressId",
          permissions: ["*"]
        }
      ]
    }
  ]);
}

/**
 * Check If Articles Policy Allows
 */
export function isAllowed(
  req: RequestWithUserDoc,
  res: Response,
  next: NextFunction
) {
  const roles = req.user ? req.user.roles : ["guest"];
  const { userId, addressId } = req.params;
  const user: UserModel = req.user;

  // if addressId is passed, it has to check if it belongs to user
  if (addressId) {
    if (
      user &&
      user.addresses.find(({ _id }) =>
        _id ? _id.toString() === addressId : false
      )
    ) {
      return next();
    }
  }

  if (req.user && userId && req.user._id.toString() === userId) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(
    roles,
    req.route.path,
    req.method.toLowerCase(),
    (err, isAllowed) => {
      if (err) {
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
