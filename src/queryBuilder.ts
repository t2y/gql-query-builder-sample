import { query as gqlQuery } from "gql-query-builder";
import {
  GraphQLField,
  GraphQLFieldMap,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  graphqlSync,
} from "graphql";

export class QueryBuilderError extends Error {
  constructor(message: string, param: object = {}) {
    super(`${message} ${JSON.stringify(param)}`);
  }
}

export class QueryBuilder {
  private schema: GraphQLSchema;
  private queryType: GraphQLObjectType;
  private queryTypeFieldMap: GraphQLFieldMap<any, any>;

  private operation: string;
  private variables: object;
  private fields: Array<string | object>;

  constructor(schema: GraphQLSchema) {
    this.schema = schema;
    this.queryType = schema.getType("Query") as GraphQLObjectType;
    this.queryTypeFieldMap = this.queryType.getFields();
  }

  getOperations() {
    return Object.keys(this.queryTypeFieldMap);
  }

  setOperation(name: string) {
    if (this.queryTypeFieldMap[name] === undefined) {
      throw new QueryBuilderError("Operation not found", { name });
    }
    this.operation = name;
    this.variables = {};
    this.fields = [];
    return this;
  }

  getArgs(): string[] {
    const queryTypeField = this.queryTypeFieldMap[this.operation];
    if (queryTypeField == null) {
      return [];
    }
    return queryTypeField.args.map((field) => field.name);
  }

  getFields(): string[] {
    const queryTypeField = this.queryTypeFieldMap[this.operation];
    if (queryTypeField == null) {
      return [];
    }
    const type = queryTypeField.type as GraphQLObjectType;
    return Object.keys(type.getFields());
  }

  getTypeFromField(field: GraphQLField<{}, {}, {}>): GraphQLObjectType {
    if (field.type instanceof GraphQLNonNull) {
      return field.type.ofType as GraphQLObjectType;
    }
    console.log("TODO: handle various instances", field.type);
    return field.type as GraphQLObjectType;
  }

  validateFieldObject(typeName: string, field: object) {
    const type = this.schema.getType(typeName) as GraphQLObjectType;
    if (type == null) {
      throw new QueryBuilderError("Type not found in the schema", {
        typeName,
      });
    }

    const fieldMap = type.getFields();
    for (const [fieldName, fieldValues] of Object.entries(field)) {
      const gqlField = fieldMap[fieldName];
      if (gqlField == null) {
        throw new QueryBuilderError("Field not found in the type", {
          typeName,
          name: fieldName,
        });
      }
      for (const fieldValue of fieldValues) {
        const gqlFieldType = this.getTypeFromField(gqlField);
        if (typeof fieldValue === "string") {
          if (gqlFieldType.getFields()[fieldValue] == null) {
            throw new QueryBuilderError("Field not found in the type", {
              typeName: gqlFieldType.name,
              name: fieldValue,
            });
          }
        } else {
          this.validateFieldObject(gqlFieldType.name, fieldValue);
        }
      }
    }
  }

  setField(nameOrField: string | object) {
    if (typeof nameOrField === "string") {
      const name = nameOrField;
      if (!this.getFields().includes(name)) {
        throw new QueryBuilderError("Field not found in the operation", {
          operation: this.operation,
          name,
        });
      }
      if (this.fields.indexOf(name) < 0) {
        this.fields.push(name);
      }
      return this;
    } else if (typeof nameOrField === "object") {
      const field = nameOrField;
      const queryTypeField = this.queryTypeFieldMap[this.operation];
      const type = queryTypeField.type as GraphQLObjectType;
      this.validateFieldObject(type.name, field);
      for (let i = 0; i < this.fields.length; i++) {
        const value = this.fields[i];
        if (typeof value !== "string") {
          this.fields[i] = { ...value, ...field };
          return this;
        }
      }
      this.fields.push(field);
    } else {
      throw new QueryBuilderError("Unsupported field type", {
        type: typeof nameOrField,
      });
    }
    return this;
  }

  setFields(names: (string | object)[]) {
    names.forEach((name) => this.setField(name));
    return this;
  }

  validateArgument(key: string, value: any) {
    const queryTypeField = this.queryTypeFieldMap[this.operation];
    if (queryTypeField == null) {
      throw new QueryBuilderError("Query type not found", {
        operation: this.operation,
      });
    }

    const args = queryTypeField.args.filter((value) => value.name === key);
    if (args.length === 0) {
      throw new QueryBuilderError("Argument not found in the operation", {
        operation: this.operation,
        key,
      });
    }

    const arg = args[0];
    if (arg.type.toString().endsWith("!")) {
      // TODO: how to check required argument
      if (value["required"] == null || !value["required"]) {
        throw new QueryBuilderError("Argument must be required", {
          operation: this.operation,
          key,
        });
      }
    }
  }

  setVariables(variables: object) {
    for (const [key, value] of Object.entries(variables)) {
      this.validateArgument(key, value);
    }
    this.variables = { ...this.variables, ...variables };
    return this;
  }

  getQuery() {
    return gqlQuery({
      operation: this.operation,
      variables: this.variables,
      fields: this.fields,
    });
  }

  getRawQuery() {
    return this.getQuery().query;
  }

  validate() {
    // assert query and variables to detect a programming error
    const query = this.getQuery();
    const results = graphqlSync({
      schema: this.schema,
      source: query.query,
      variableValues: query.variables,
    });
    if (results.errors != null) {
      throw new QueryBuilderError(
        "Validating query and variables are invalid",
        {
          errors: results.errors,
        }
      );
    }
  }
}
