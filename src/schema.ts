import fs from "fs";
import { buildSchema, GraphQLSchema } from "graphql";

export function getSchema(
  path: string,
  encoding: BufferEncoding = "utf8"
): GraphQLSchema {
  const contents = fs.readFileSync(path, { encoding, flag: "r" });
  return buildSchema(contents, { assumeValid: true });
}
