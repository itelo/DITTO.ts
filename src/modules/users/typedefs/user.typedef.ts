const typeDef = `
type User {
  _id: String,
  email: String,
  first_name: String,
  last_name: String,
  display_name: String
}
type Query {
  getUsers: [User]
  getUser(_id: String, email: String): User
}
`;

export default typeDef;
