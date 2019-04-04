import { Application, Request, Response } from "express";
import { ConfigEnvsObject } from "types/config/env";
import { makeExecutableSchema } from "graphql-tools";
import { mergeTypes } from "merge-graphql-schemas";
import { graphqlExpress, graphiqlExpress } from "graphql-server-express";
import { printSchema } from "graphql/utilities/schemaPrinter";
import lodash from "lodash";

/**
 * Configure Graphql
 */
async function configureGraphql(app: Application, config: ConfigEnvsObject) {
  const typedefsFilesPromise = config.files.typedefs.map<
    Promise<{ default: string }>
  >((typedefFilePath: string) => import(typedefFilePath));

  const resolversFilesPromise = config.files.resolvers.map<
    Promise<{ default: string }>
  >((resolverFilePath: string) => import(resolverFilePath));

  const typedefsFilesWithDefault = await Promise.all(typedefsFilesPromise);
  const typedefsFiles = typedefsFilesWithDefault.map(file => file.default);
  const resolversFilesWithDefault = await Promise.all(resolversFilesPromise);
  const resolversFiles = resolversFilesWithDefault.map(file => file.default);

  const resolvers = lodash.merge(resolversFiles);
  const typeDefs = mergeTypes(typedefsFiles);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  app.use(
    "/api/graphql",
    graphqlExpress((req: Request, res: Response) => ({ schema }))
  );
  // context: { req, res, user: req.user },

  // /api/graphiql
  app.use(
    "/graphiql",
    graphiqlExpress({
      endpointURL: "/api/graphql"
      // subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`
    })
  );

  // /api/schema
  app.use("/schema", (_: Request, res: Response) => {
    res.set("Content-Type", "text/plain");
    res.send(printSchema(schema));
  });
}

export default configureGraphql;
