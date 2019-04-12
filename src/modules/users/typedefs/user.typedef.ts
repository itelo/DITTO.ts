import { gql } from "apollo-server-express";

const typeDef = gql`
  type User {
    _id: String
    email: String
    first_name: String
    last_name: String
    display_name: String
  }
  type Subscription {
    getterUser: User
  }
  type Query {
    getUsers: [User]
    getUser(_id: String, email: String): User
  }
`;

export default typeDef;
