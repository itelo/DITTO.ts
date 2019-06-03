import { gql } from "apollo-server-express";

const typeDef = gql`
  type User {
    _id: String
    email: String
    first_name: String
    last_name: String
    display_name: String
  }
  type ResponseSuccessful {
    token: String
    user: User
  }
  type ResponseError {
    code: String
    message: String
    status: Int
  }
  type Subscription {
    getterUser: User
  }
  # union Response = ResponseSuccessful
  type Mutation {
    signin(email: String, password: String): ResponseSuccessful
  }
  type Query {
    getUsers: [User]
    getUser(_id: String, email: String): User
  }
`;

export default typeDef;
