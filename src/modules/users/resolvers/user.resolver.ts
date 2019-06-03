import { Codes } from "./../../../utils/constants/codes";
import * as errorHandler from "@utils/errorHandler";
import User, { UserModel } from "@models/user.model";
import {
  sanitizeUser,
  configureUserAndToken
} from "@modules/users/config/strategies/jwt";
import { PubSub } from "apollo-server";
import { HttpStatus } from "@utils/constants/httpStatus";

const pubsub = new PubSub();

type GetUserArgs = {
  _id?: string;
  email?: string;
};

const GETTER_USER = "GETTER_USER";

const UserResolveFunctions = {
  Subscription: {
    getterUser: {
      resolve: (user: any) => {
        console.log({ user });
        return user;
      },
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => {
        console.log("subscribe");
        return pubsub.asyncIterator([GETTER_USER]);
      }
    }
  },
  Mutation: {
    signin: async (
      _: any,
      {
        email,
        password,
        username
      }: { username: string; email: string; password: string }
    ) => {
      // first search user by email
      const query = [];

      if (email) {
        query.push({ email: email.toLowerCase() });
      }

      if (username) {
        query.push({ username: username.toLowerCase() });
      }

      const field = !email ? "username" : "email";

      return User.findOne({
        $or: query
      })
        .then(async (userDoc: UserModel) => {
          // then validate the password of the user founded
          if (!userDoc) {
            const message = `Cound not found any user with that ${field} `;
            return {
              code: Codes.AUTH__USER_NOT_FOUND,
              message,
              status: HttpStatus.UNPROCESSABLE_ENTITY
            };
            // return responses.sendError(
            //   res,
            //
            //
            //
            // );
          } else if (userDoc.provider !== "local") {
            let additionalProvidersName: any = [];
            if (userDoc.additional_providers_data) {
              additionalProvidersName = Object.keys(
                userDoc.additional_providers_data
              );
            }
            const providers = [userDoc.provider, ...additionalProvidersName];
            return {
              code: `auth/provider-not-local:${providers}`,
              message:
                "You are trying to signin with email, but your acount are created with facebook or google",
              status: HttpStatus.UNPROCESSABLE_ENTITY
            };
            // return res.json({
            //   message: `auth/provider-not-local:${providers}`
            // });
          } else if (!userDoc.authenticate(password)) {
            const message = `The password not match if the ${field} you passed`;
            throw JSON.stringify(
              {
                code: Codes.AUTH__WRONG_PASSWORD,
                message,
                status: HttpStatus.UNPROCESSABLE_ENTITY
              },
              undefined,
              2
            );
            // JSON.stringify(
            // {
            // code: Codes.AUTH__WRONG_PASSWORD,
            // message
            // status: HttpStatus.UNPROCESSABLE_ENTITY
            // },
            // undefined,
            // 2
            // );
            // );
            // return responses.sendError(
            //   res,
            //   Codes.AUTH__WRONG_PASSWORD,
            //   message,
            //   HttpStatus.UNPROCESSABLE_ENTITY
            // );
          } else {
            const data = configureUserAndToken(userDoc);
            return data;
            // return responses.sendSuccessful(res, data, HttpStatus.OK);
          }
        })
        .catch(err => {
          // const {
          //   code,
          //   message,
          //   status
          // } =
          // errorHandler.getErrorMessageCodeAndHttpStatus(err)
          console.log(err);
          throw new Error(err);
          // responses.sendError(res, code, message, status);
        });
    }
  },
  Query: {
    getUsers: async () => {
      try {
        const users = await User.find();
        const userSanitized = users.map(sanitizeUser);
        return userSanitized;
      } catch (err) {
        throw err;
      }
    },
    getUser: async (_: any, { _id, email }: GetUserArgs) => {
      try {
        const user = await User.findOne({
          $or: [{ _id }, { email }]
        });
        if (user) {
          console.log(user._id);
          console.log(
            pubsub.publish(GETTER_USER, { getterUser: sanitizeUser(user) })
          );

          return sanitizeUser(user);
        }
        throw "not found any user";
      } catch (err) {
        throw err;
      }
    }
  }
};

export default UserResolveFunctions;
