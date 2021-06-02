import * as gql from "gql-query-builder";
import path from "path";
import repl from "repl";
import * as queryBuilder from "../queryBuilder";
import * as schema from "../schema";

const githubSchema = schema.getSchema(
  path.resolve(__dirname, "../../examples/github/schema.graphql")
);

// @ts-ignore
globalThis["gql"] = gql;
// @ts-ignore
globalThis["githubSchema"] = githubSchema;
// @ts-ignore
globalThis["githubQB"] = new queryBuilder.QueryBuilder(githubSchema);

for (const items of [queryBuilder, schema]) {
  Object.entries(items).map(([key, value]) => {
    // @ts-ignore
    globalThis[key] = value;
  });
}

const replServer = repl.start();
