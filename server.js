// server.js
const cors = require('cors');
const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

const app = express();

app.use(cors());
// This is needed to be able to read `req.body` in express
app.use(express.json());

// Construct a schema, using GraphQL's schema language
const schema = buildSchema(`
  type User {
    id: ID!
    username: String!
    password: String!
    policy: Policy
  }

  type Policy {
    id: ID!
    content: String!
  }

  type Query {
    users: [User]
  }

  type Mutation {
    login(username: String!, password: String!): User
    transferPolicy(toUserId: ID!): Policy
  }
`);

// Add hardcoded users
let users = [
  { id: "1", username: "user1", password: "password1", policy: { id: "p1", content: "Policy Content" } },
  { id: "2", username: "user2", password: "password2", policy: null },
];

let sessionUser = null;

// The root provides a resolver function for each API endpoint
const root = {
  users: () => {
    return users;
  },
  login: ({ username, password }) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      sessionUser = user;
      return user;
    } else {
      throw new Error("Invalid login credentials");
    }
  },
  transferPolicy: ({ toUserId }) => {
    const fromUser = sessionUser;
    const toUser = users.find(u => u.id === toUserId);
    if (fromUser.policy && toUser) {
      toUser.policy = fromUser.policy;
      fromUser.policy = null;
      return toUser.policy;
    } else {
      throw new Error("Transfer failed");
    }
  },
};

// Middleware for checking authentication
app.use((req, res, next) => {
  req.user = sessionUser;
  next();
});

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));

app.listen(4000, () => console.log('Running a GraphQL API server at localhost:4000/graphql'));