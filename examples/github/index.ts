import path from "path";
import { QueryBuilder } from "../../src/queryBuilder";
import { getSchema } from "../../src/schema";

const schemaPath = path.resolve(__dirname, "./schema.graphql");
const schema = getSchema(schemaPath);

const qb = new QueryBuilder(schema);
qb.setOperation("user")
  .setFields(["id", "name", "bio"])
  .setVariables({ login: { value: "t2y", required: true } });
console.log(qb.getQuery());