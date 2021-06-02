# gql-query-builder-sample

[GraphQL Query Builder](https://github.com/atulmy/gql-query-builder) sample application.

Add schema validation before generating GraphQL query.

Use GitHub GraphQL API as an example.

* https://docs.github.com/en/graphql/overview/public-schema
* https://docs.github.com/en/graphql/overview/explorer

## How to build

```bash
$ yarn install
$ yarn build
```

## How to run on repl

```typescript
$ yarn repl
> const qb = new QueryBuilder(githubSchema)
> qb.setOperation("user").setFields(["id", "name"]).setVariables({login: {value: "t2y", required: true}})
> qb.getRawQuery()
'query ($login: String!) { user (login: $login) { id, name } }'
>
(To exit, press Ctrl+C again or Ctrl+D or type .exit)
```

## How to test

```bash
$ yarn test
 PASS  tests/github.ts
  ✓ simple (7 ms)
  ✓ call multiple setField() (1 ms)
  ✓ nested query (1 ms)
  ✓ Field error (10 ms)
  ✓ Argument error (1 ms)
```

