import fs from "fs";
import {
  buildClientSchema,
  buildSchema,
  getIntrospectionQuery,
  GraphQLSchema,
} from "graphql";
import fetch from "node-fetch";

export function getSchema(
  path: string,
  encoding: BufferEncoding = "utf8"
): GraphQLSchema {
  const contents = fs.readFileSync(path, { encoding, flag: "r" });
  return buildSchema(contents, { assumeValid: true });
}

export async function getSchemaFromQuery(
  endpoint: string = "http://localhost:4000",
  authorization: string = ""
): Promise<GraphQLSchema> {
  const query = getIntrospectionQuery({
    descriptions: false,
    schemaDescription: false,
  });
  const response = await fetch(`${endpoint}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: authorization,
    },
    body: JSON.stringify({ query }),
  });

  if (response.status !== 200) {
    throw new Error(response.statusText);
  }

  const json = await response.json();
  if (json.errors !== undefined) {
    throw new Error(json.errors);
  }
  const introspection = json.data;
  return buildClientSchema(introspection, { assumeValid: true });
}
