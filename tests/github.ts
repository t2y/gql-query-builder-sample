import path from "path";
import { QueryBuilder, QueryBuilderError } from "../src/queryBuilder";
import { getSchema } from "../src/schema";

const schemaPath = path.resolve(__dirname, "../examples/github/schema.graphql");
const schema = getSchema(schemaPath);

/*
 * success
 */
test("simple", async () => {
  const qb = new QueryBuilder(schema);
  qb.setOperation("user")
    .setFields(["id", "name", "bio"])
    .setVariables({ login: { value: "t2y", required: true } });
  const query = qb.getQuery();
  expect(query.query).toEqual(
    "query ($login: String!) { user (login: $login) { id, name, bio } }"
  );
  expect(query.variables).toEqual({ login: "t2y" });
  expect(() => {
    qb.validate();
  }).not.toThrow(QueryBuilderError);
});

test("call multiple setField()", async () => {
  const qb = new QueryBuilder(schema);
  qb.setOperation("user")
    .setField("id")
    .setField("name")
    .setField("bio")
    .setField("id")
    .setField("name")
    .setVariables({ login: { value: "t2y", required: true } });
  const query = qb.getQuery();
  expect(query.query).toEqual(
    "query ($login: String!) { user (login: $login) { id, name, bio } }"
  );
  expect(query.variables).toEqual({ login: "t2y" });
  expect(() => {
    qb.validate();
  }).not.toThrow(QueryBuilderError);
});

test("nested query", async () => {
  const qb = new QueryBuilder(schema);
  qb.setOperation("user")
    .setFields(["id", "bio"])
    .setVariables({ login: { value: "t2y", required: true } })
    .setField({ itemShowcase: ["hasPinnedItems", { items: ["totalCount"] }] })
    .setField("name");
  expect(qb.getRawQuery()).toEqual(
    "query ($login: String!) { user (login: $login) { id, bio, itemShowcase { hasPinnedItems, items { totalCount } }, name } }"
  );
  expect(() => {
    qb.validate();
  }).not.toThrow(QueryBuilderError);
});

/*
 * occur a validation error
 */
test("Field error", async () => {
  const qb = new QueryBuilder(schema);
  qb.setOperation("user");
  expect(() => {
    qb.setField("unknonw");
  }).toThrow(QueryBuilderError);
  expect(() => {
    qb.setField({ itemShowcase: ["hasNotPinnedItems"] });
  }).toThrow(QueryBuilderError);
  expect(() => {
    qb.setField({ itemShowcase: [{ items: ["count"] }] });
  }).toThrow(QueryBuilderError);
});

test("Argument error", async () => {
  const qb = new QueryBuilder(schema);
  qb.setOperation("user").setField("id");
  expect(() => {
    qb.setVariables({ login: "t2y" });
  }).toThrow(QueryBuilderError);
  expect(() => {
    qb.setVariables({ login: { value: "t2y", required: false } });
  }).toThrow(QueryBuilderError);
});
