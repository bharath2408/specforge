import type {
  ParsedSpec,
  GeneratedFile,
  GenerateOptions,
  FieldSpec,
} from "@specforge-dev/core";
import { renderTemplate } from "../engine.js";
import type { SpecForgePlugin } from "../types.js";

function mapFieldToTsType(field: FieldSpec): string {
  switch (field.type) {
    case "uuid":
    case "string":
    case "text":
      return "string";
    case "integer":
    case "float":
      return "number";
    case "boolean":
      return "boolean";
    case "datetime":
    case "date":
      return "string"; // ISO string in tests
    case "json":
      return "Record<string, unknown>";
    case "enum":
      return (field.values ?? []).map((v) => `"${v}"`).join(" | ");
    case "relation":
      return "string";
    default:
      return "unknown";
  }
}

function generateDefaultValue(
  fieldName: string,
  field: FieldSpec
): string {
  if (field.primary) return "`test-${counter}`";
  if (field.auto) {
    if (field.type === "datetime" || field.type === "date") {
      return "new Date().toISOString()";
    }
    return "`auto-${counter}`";
  }

  switch (field.type) {
    case "uuid":
      return "`test-uuid-${counter}`";
    case "string":
    case "text": {
      if (field.validate === "email") return "`test${counter}@example.com`";
      if (fieldName.toLowerCase().includes("email"))
        return "`test${counter}@example.com`";
      if (fieldName.toLowerCase().includes("name")) return "`Test ${counter}`";
      if (fieldName.toLowerCase().includes("url"))
        return "`https://example.com/${counter}`";
      if (fieldName.toLowerCase().includes("password"))
        return '"password-123"';
      return `"test-${fieldName}-" + counter`;
    }
    case "integer":
      return "counter";
    case "float":
      return "counter * 1.5";
    case "boolean":
      return "true";
    case "datetime":
    case "date":
      return "new Date().toISOString()";
    case "json":
      return "{}";
    case "enum":
      return field.values && field.values.length > 0
        ? `"${field.values[0]}"`
        : '"unknown"';
    case "relation":
      return "`related-${counter}`";
    default:
      return '"unknown"';
  }
}

function buildSampleData(
  modelSpec: { fields: Record<string, FieldSpec> }
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const [fieldName, fieldSpec] of Object.entries(modelSpec.fields)) {
    if (fieldSpec.primary || fieldSpec.auto) continue;

    switch (fieldSpec.type) {
      case "string":
      case "text":
        if (fieldSpec.validate === "email" || fieldName.toLowerCase().includes("email")) {
          data[fieldName] = "test@example.com";
        } else if (fieldName.toLowerCase().includes("name")) {
          data[fieldName] = "Test Entry";
        } else if (fieldName.toLowerCase().includes("password")) {
          data[fieldName] = "password-123";
        } else {
          data[fieldName] = `test-${fieldName}`;
        }
        break;
      case "integer":
        data[fieldName] = 1;
        break;
      case "float":
        data[fieldName] = 1.5;
        break;
      case "boolean":
        data[fieldName] = true;
        break;
      case "enum":
        data[fieldName] = fieldSpec.values?.[0] ?? "unknown";
        break;
      case "relation":
        data[fieldName] = "related-id";
        break;
      default:
        data[fieldName] = `test-${fieldName}`;
    }
  }
  return data;
}

function hasAuthOnEndpoint(auth: Record<string, unknown> | undefined): boolean {
  if (!auth) return false;
  return Object.values(auth).some(
    (v) => v !== "public" && v !== undefined
  );
}

function getDefaultAuthLevel(auth: Record<string, unknown> | undefined): string {
  if (!auth) return "authenticated";
  const levels = Object.values(auth).filter((v) => v !== "public");
  if (levels.includes("admin")) return "admin";
  return "authenticated";
}

export const playwrightPlugin: SpecForgePlugin = {
  name: "playwright",
  version: "0.1.0",

  generate(spec: ParsedSpec, _options: GenerateOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const hasAuth = spec.api.auth?.strategy != null;
    const hasEndpoints = spec.api.endpoints.length > 0;

    // Generate API test files for each endpoint
    for (const endpoint of spec.api.endpoints) {
      const modelName = endpoint.model;
      const modelSpec = spec.models[modelName];
      if (!modelSpec) continue;

      const auth = endpoint.auth as Record<string, unknown> | undefined;
      const endpointHasAuth = hasAuthOnEndpoint(auth);
      const requiredFields = Object.entries(modelSpec.fields)
        .filter(
          ([, f]) => !f.primary && !f.auto && !f.nullable && f.default === undefined
        )
        .map(([name]) => ({ name }));

      const sampleData = buildSampleData(modelSpec);
      const updateData = { ...sampleData };
      // Remove relation fields from update data
      for (const [key, fieldSpec] of Object.entries(modelSpec.fields)) {
        if (fieldSpec.type === "relation") {
          delete updateData[key];
        }
      }

      // Pre-compute per-action auth flags for template
      const authForAction = (action: string): boolean => {
        if (!auth) return false;
        const level = auth[action];
        return level !== undefined && level !== "public";
      };

      const content = renderTemplate("playwright/api-test.hbs", {
        modelName,
        endpoint: {
          path: `${spec.api.basePath}${endpoint.path}`,
        },
        actions: endpoint.actions,
        hasAuth: endpointHasAuth,
        defaultAuthLevel: getDefaultAuthLevel(auth),
        sampleData,
        updateData,
        requiredFields,
        authList: authForAction("list"),
        authGet: authForAction("get"),
        authCreate: authForAction("create"),
        authUpdate: authForAction("update"),
        authDelete: authForAction("delete"),
      });

      files.push({
        path: `tests/e2e/api/${modelName.toLowerCase()}.spec.ts`,
        content: content.replace(/\n{3,}/g, "\n\n"),
        overwrite: true,
      });
    }

    // Generate data factories for each model
    for (const [modelName, modelSpec] of Object.entries(spec.models)) {
      const fields: Record<
        string,
        { tsType: string; optional: boolean; defaultValue: string }
      > = {};

      for (const [fieldName, fieldSpec] of Object.entries(modelSpec.fields)) {
        fields[fieldName] = {
          tsType: mapFieldToTsType(fieldSpec),
          optional: !!(fieldSpec.nullable || fieldSpec.auto || fieldSpec.primary),
          defaultValue: generateDefaultValue(fieldName, fieldSpec),
        };
      }

      const content = renderTemplate("playwright/data-factory.hbs", {
        modelName,
        fields,
      });

      files.push({
        path: `tests/e2e/fixtures/${modelName.toLowerCase()}-factory.ts`,
        content: content.replace(/\n{3,}/g, "\n\n"),
        overwrite: true,
      });
    }

    // Generate auth setup if spec has auth strategy
    if (hasAuth) {
      const authEndpoint = `${spec.api.basePath}/auth/login`;
      const content = renderTemplate("playwright/auth-setup.hbs", {
        authEndpoint,
      });

      files.push({
        path: "tests/e2e/auth-setup.ts",
        content,
        overwrite: true,
      });
    }

    // Generate playwright config
    if (hasEndpoints) {
      const hasUiEntities = false; // API-only from spec.yaml
      const content = renderTemplate("playwright/config.hbs", {
        baseUrl: "http://localhost:3000",
        hasApiTests: true,
        hasUiTests: hasUiEntities,
      });

      files.push({
        path: "playwright.config.ts",
        content,
        overwrite: true,
      });
    }

    // Generate fixtures index
    if (Object.keys(spec.models).length > 0) {
      const indexLines = Object.keys(spec.models).map(
        (name) =>
          `export { create${name}, create${name}List } from "./${name.toLowerCase()}-factory.js";`
      );
      files.push({
        path: "tests/e2e/fixtures/index.ts",
        content:
          "// Generated by SpecForge — do not edit manually\n\n" +
          indexLines.join("\n") +
          "\n",
        overwrite: true,
      });
    }

    return files;
  },
};
