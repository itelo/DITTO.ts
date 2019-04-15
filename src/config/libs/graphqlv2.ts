import { Application, Request, Response } from "express";
import { ConfigEnvsObject } from "types/config/env";
import { makeExecutableSchema } from "graphql-tools";
import { createServer } from "http";

import { mergeTypes } from "merge-graphql-schemas";
// import { graphqlExpress, graphiqlExpress } from "graphql-server-express";
import { ApolloServer } from "apollo-server-express";
import { printSchema } from "graphql/utilities/schemaPrinter";
import { importSchema } from "graphql-import";
import lodash from "lodash";
import { DocumentNode } from "graphql";
// ensure type
import "passport";

/**
 * Configure Graphql
 */
function configureGraphql(app: Application, config: ConfigEnvsObject) {
  console.log({ typedefFilePath: config.files.typedefs });
  // console.log({ typedefFilePath: config.files.typedefs });

  const typeDefs = config.files.typedefs.map<DocumentNode>(
    (typedefFilePath: string) =>
      require(typedefFilePath.replace("src/", "@")).default
  );

  console.log({ typeDefs });

  const resolversFiles = config.files.resolvers.map<string>(
    (resolverFilePath: string) =>
      require(resolverFilePath.replace("src/", "@")).default
  );

  // const typeDefs = Promise.all(typedefsFilesPromise);
  // const resolversFiles = Promise.all(resolversFilesPromise);
  // const resolversFiles = resolversFilesWithDefault.map(file => file.default);

  const resolvers = lodash.merge(resolversFiles);
  // const typeDefs = typedefsFilesWithDefault.map(file => file.default);

  // GraphQL: Schema
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      if (req) {
        // add the user to the context
        return { req, user: req.user };
      }

      return {};
    },
    subscriptions: {
      onConnect: (connectionParams, webSocket) => {
        // console.log({ connectionParams, webSocket });
        // if (connectionParams.authToken) {
        //   return validateToken(connectionParams.authToken)
        //     .then(findUser(connectionParams.authToken))
        //     .then(user => {
        //       return {
        //         currentUser: user,
        //       };
        //     });
        // }
        // throw new Error('Missing auth token!');
      }
    },
    playground: {
      endpoint: `http://${config.host}:${config.port}/graphql`,
      settings: {
        "general.betaUpdates": false,
        "editor.cursorShape": "line",
        "editor.fontSize": 14,
        "editor.fontFamily":
          "'Source Code Pro', 'Consolas', 'Inconsolata', 'Droid Sans Mono', 'Monaco', monospace",
        "editor.theme": "dark",
        "editor.reuseHeaders": true,
        "prettier.printWidth": 80,
        "request.credentials": "omit",
        "tracing.hideTracingResponse": true
      }
    }
  });

  server.applyMiddleware({ app, path: "/graphql" });

  const httpServer = createServer(app);

  server.installSubscriptionHandlers(httpServer);

  return httpServer;
  // const schema = makeExecutableSchema({
  //   typeDefs,
  //   resolvers
  // });

  // app.use(
  //   "/api/graphql",
  //   graphqlExpress((req: Request, res: Response) => ({ schema }))
  // );
  // // context: { req, res, user: req.user },

  // // /api/graphiql
  // app.use(
  //   "/graphiql",
  //   graphiqlExpress({
  //     endpointURL: "/api/graphql"
  //     // subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`
  //   })
  // );

  // // /api/schema
  // app.use("/schema", (_: Request, res: Response) => {
  //   res.set("Content-Type", "text/plain");
  //   res.send(printSchema(schema));
  // });
}

export default configureGraphql;
