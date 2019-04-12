import User, { UserModel } from "@models/user.model";
import { sanitizeUser } from "@modules/users/config/strategies/jwt";
import { PubSub } from "apollo-server";

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
