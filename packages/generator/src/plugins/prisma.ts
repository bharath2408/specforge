import type { ParsedSpec, GeneratedFile, GenerateOptions, FieldSpec } from "@specforge/core";
import { renderTemplate } from "../engine.js";
import type { SpecForgePlugin } from "../types.js";

function mapFieldToPrismaType(field: FieldSpec): string {
  switch (field.type) {
    case "uuid":
      return "String";
    case "string":
      return "String";
    case "text":
      return "String";
    case "integer":
      return "Int";
    case "float":
      return "Float";
    case "boolean":
      return "Boolean";
    case "datetime":
      return "DateTime";
    case "date":
      return "DateTime";
    case "json":
      return "Json";
    case "enum":
      return "String"; // Simplified: use String for enums
    case "relation":
      return "String"; // FK column type
    default:
      return "String";
  }
}

function buildPrismaAttrs(fieldName: string, field: FieldSpec): string {
  const attrs: string[] = [];

  if (field.primary) {
    attrs.push("@id");
  }

  if (field.type === "uuid" && field.primary) {
    attrs.push("@default(uuid())");
  }

  if (field.unique) {
    attrs.push("@unique");
  }

  if (field.auto && field.type === "datetime") {
    attrs.push("@default(now())");
  }

  if (field.default !== undefined && !field.auto && !field.primary) {
    if (typeof field.default === "string") {
      attrs.push(`@default("${field.default}")`);
    } else if (typeof field.default === "boolean" || typeof field.default === "number") {
      attrs.push(`@default(${field.default})`);
    }
  }

  if (field.type === "relation") {
    attrs.push(`// FK to ${field.model}`);
  }

  return attrs.join(" ");
}

export const prismaPlugin: SpecForgePlugin = {
  name: "prisma",
  version: "0.1.0",

  generate(spec: ParsedSpec, _options: GenerateOptions): GeneratedFile[] {
    const models: Record<string, { fields: Record<string, Record<string, unknown>>; relations: string[] }> = {};

    // First pass: count how many FK fields per model point to each target
    // so we know when to disambiguate relation names.
    const fkCountPerModel: Record<string, Record<string, number>> = {};
    for (const [modelName, modelSpec] of Object.entries(spec.models)) {
      fkCountPerModel[modelName] = {};
      for (const [, fieldSpec] of Object.entries(modelSpec.fields)) {
        if (fieldSpec.type === "relation" && fieldSpec.model) {
          fkCountPerModel[modelName][fieldSpec.model] =
            (fkCountPerModel[modelName][fieldSpec.model] ?? 0) + 1;
        }
      }
    }

    for (const [modelName, modelSpec] of Object.entries(spec.models)) {
      const fields: Record<string, Record<string, unknown>> = {};
      const relations: string[] = [];

      for (const [fieldName, fieldSpec] of Object.entries(modelSpec.fields)) {
        const prismaType = mapFieldToPrismaType(fieldSpec);
        const prismaAttrs = buildPrismaAttrs(fieldName, fieldSpec);
        const nullable = fieldSpec.nullable ? "?" : "";

        fields[fieldName] = {
          prismaType: prismaType + nullable,
          prismaAttrs,
        };

        // Add relation decorator
        if (fieldSpec.type === "relation" && fieldSpec.model) {
          const needsDisambiguation = fkCountPerModel[modelName][fieldSpec.model] > 1;
          // Derive a relation name from the FK field (e.g. assigneeId -> assignee, creatorId -> creator)
          const relationAlias = fieldName.replace(/Id$/, "");
          const relationName = needsDisambiguation
            ? `  @relation("${modelName}_${relationAlias}")`
            : "";
          relations.push(
            `${relationAlias}  ${fieldSpec.model}  @relation(${needsDisambiguation ? `"${modelName}_${relationAlias}", ` : ""}fields: [${fieldName}], references: [id])`
          );
        }
      }

      models[modelName] = { fields, relations };
    }

    // Add reverse relations
    for (const [modelName, modelSpec] of Object.entries(spec.models)) {
      for (const [fieldName, fieldSpec] of Object.entries(modelSpec.fields)) {
        if (fieldSpec.type === "relation" && fieldSpec.model) {
          const targetModel = models[fieldSpec.model];
          if (targetModel) {
            const kind = fieldSpec.kind ?? "many-to-one";
            const needsDisambiguation = fkCountPerModel[modelName][fieldSpec.model!] > 1;
            const relationAlias = fieldName.replace(/Id$/, "");

            if (kind === "many-to-one" || kind === "one-to-many") {
              const reverseName = needsDisambiguation
                ? `${relationAlias}${modelName}s`
                : `${modelName.toLowerCase()}s`;
              const relationTag = needsDisambiguation
                ? `  @relation("${modelName}_${relationAlias}")`
                : "";
              targetModel.relations.push(
                `${reverseName}  ${modelName}[]${relationTag}`
              );
            }
          }
        }
      }
    }

    const content = renderTemplate("prisma/schema.hbs", { models });

    return [
      {
        path: "prisma/schema.prisma",
        content,
        overwrite: true,
      },
    ];
  },
};
