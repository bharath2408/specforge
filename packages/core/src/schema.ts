import { z } from "zod";

const fieldTypeEnum = z.enum([
  "uuid",
  "string",
  "text",
  "integer",
  "float",
  "boolean",
  "datetime",
  "date",
  "json",
  "enum",
  "relation",
]);

const relationKindEnum = z.enum([
  "one-to-one",
  "one-to-many",
  "many-to-one",
  "many-to-many",
]);

const authLevelEnum = z.enum(["public", "authenticated", "admin", "owner"]);

const crudActionEnum = z.enum(["list", "get", "create", "update", "delete"]);

const fieldSpecSchema = z
  .object({
    type: fieldTypeEnum,
    primary: z.boolean().optional(),
    unique: z.boolean().optional(),
    nullable: z.boolean().optional(),
    default: z.unknown().optional(),
    auto: z.boolean().optional(),
    validate: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    values: z.array(z.string()).optional(),
    model: z.string().optional(),
    kind: relationKindEnum.optional(),
  })
  .refine(
    (data) => {
      if (data.type === "enum" && (!data.values || data.values.length === 0)) {
        return false;
      }
      return true;
    },
    { message: "Enum fields must have a non-empty 'values' array" }
  )
  .refine(
    (data) => {
      if (data.type === "relation" && !data.model) {
        return false;
      }
      return true;
    },
    { message: "Relation fields must specify a 'model'" }
  );

const modelSpecSchema = z.object({
  fields: z.record(z.string(), fieldSpecSchema),
});

const authPerActionSchema = z.union([
  authLevelEnum,
  z.array(authLevelEnum),
]);

const endpointSpecSchema = z.object({
  path: z.string().startsWith("/"),
  model: z.string(),
  actions: z.array(crudActionEnum).min(1),
  auth: z.record(z.string(), authPerActionSchema).optional(),
});

const apiSpecSchema = z.object({
  basePath: z.string().startsWith("/"),
  auth: z
    .object({
      strategy: z.string(),
    })
    .optional(),
  endpoints: z.array(endpointSpecSchema).min(1),
});

const testExpectSchema = z.object({
  status: z.number().int().min(100).max(599),
  body: z.record(z.string(), z.unknown()).optional(),
});

const testCaseSchema = z.object({
  name: z.string().min(1),
  action: crudActionEnum,
  input: z.record(z.string(), z.unknown()).optional(),
  expect: testExpectSchema,
});

export const specSchema = z
  .object({
    specforge: z.string(),
    name: z.string().min(1),
    version: z.string(),
    models: z.record(z.string(), modelSpecSchema),
    api: apiSpecSchema,
    tests: z.record(z.string(), z.array(testCaseSchema)).optional().default({}),
  })
  .refine(
    (data) => {
      // Validate that all endpoint models reference defined models
      for (const endpoint of data.api.endpoints) {
        if (!data.models[endpoint.model]) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "All endpoint models must reference models defined in the 'models' section",
    }
  )
  .refine(
    (data) => {
      // Validate that all relation fields reference defined models
      for (const [, model] of Object.entries(data.models)) {
        for (const [, field] of Object.entries(model.fields)) {
          if (field.type === "relation" && field.model && !data.models[field.model]) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message:
        "All relation fields must reference models defined in the 'models' section",
    }
  );

export type SpecInput = z.input<typeof specSchema>;
export type SpecOutput = z.output<typeof specSchema>;
