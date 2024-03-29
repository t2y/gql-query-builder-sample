import {
  GraphQLEnumType,
  GraphQLFieldMap,
  GraphQLInputObjectType,
  GraphQLObjectType,
  GraphQLScalarType,
  GraphQLSchema,
} from "graphql";

export function getQueryNames(schema: GraphQLSchema): string[] {
  const query = schema.getType("Query") as GraphQLObjectType;
  if (query == null) {
    return [];
  }
  return Object.keys(query.getFields());
}

export function getQueryFields(schema: GraphQLSchema, name: string): any {
  const query = schema.getType("Query") as GraphQLObjectType;
  if (query == null) {
    return null;
  }
  return query.getFields()[name];
}

export function getQueryResponseDataType(queryType: any): any {
  const responseType = getDeeperType(queryType);
  const responseFields = responseType.getFields();
  if (responseFields.data === undefined) {
    return null;
  }
  return getDeeperType(responseFields.data.type);
}

export function getTypeFieldTree(
  name: string,
  fieldMap: GraphQLFieldMap<any, any>,
  depth: number = 0,
  appeared: string[] = [name]
): any {
  if (depth === 3) {
    return null;
  }

  const tree: { [key: string]: any } = { [name]: [] };
  const objectMap: { [key: string]: any } = {};
  Object.keys(fieldMap).map((key) => {
    const field = fieldMap[key];
    const fieldType = getDeeperType(field.type);
    if (fieldType instanceof GraphQLScalarType) {
      tree[name].push(key);
    } else if (fieldType instanceof GraphQLObjectType) {
      if (!appeared.includes(fieldType.name)) {
        appeared.push(fieldType.name);
        objectMap[key] = fieldType.getFields();
      }
    }
  });

  Object.entries(objectMap).map(([fieldName, fieldTypeFields]) => {
    const subTree = getTypeFieldTree(
      fieldName,
      fieldTypeFields,
      depth + 1,
      appeared
    );
    if (subTree !== null) {
      tree[name].push(subTree);
    }
  });

  return tree;
}

export function getQueryFieldTree(
  schema: GraphQLSchema,
  queryName: string
): any {
  const queryFields = getQueryFields(schema, queryName);
  const dataType = getQueryResponseDataType(queryFields.type);
  const tree = getTypeFieldTree(dataType.name, dataType.getFields());
  return { data: tree[dataType.name] };
}

// Return the deeper type found on object
// For example [[[Company]!]!]! will return only Company
export function getDeeperType(type: any, depth: number = 0): any {
  if (type.ofType && depth < 5) {
    return getDeeperType(type.ofType, depth + 1);
  }
  return type;
}

export function getQueryArgFields(
  parentName: string,
  fieldMap: GraphQLFieldMap<any, any>
): string[] {
  return Object.entries(fieldMap)
    .map(([name, field]) => {
      const type = getDeeperType(field.type);
      if (type instanceof GraphQLScalarType) {
        return `${parentName}.${name}`;
      } else if (type instanceof GraphQLInputObjectType) {
        const objectArgsFields = getDeeperType(type).getFields();
        const objectArgs = getQueryArgFields(
          `${parentName}.${name}`,
          objectArgsFields
        );
        return objectArgs;
      } else if (type instanceof GraphQLEnumType) {
        const enumValues = type.getValues();
        return `${parentName}.${name}`;
      } else {
        return `${parentName}.${name}`;
      }
    })
    .flat();
}

export function getQueryArgs(schema: GraphQLSchema, name: string): string[] {
  const args = getQueryFields(schema, name).args;
  return args
    .map((arg: any) => {
      const type = getDeeperType(arg.type);
      if (type instanceof GraphQLScalarType) {
        return arg.name;
      } else if (type instanceof GraphQLInputObjectType) {
        const objectArgsFields = getDeeperType(arg.type).getFields();
        const objectArgs = getQueryArgFields(arg.name, objectArgsFields);
        return objectArgs;
      }
    })
    .flat();
}
