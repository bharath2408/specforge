import { ZodError } from "zod";
import { specSchema } from "./schema.js";
import type { ParsedSpec, ValidationError, ValidationResult } from "./types.js";

/**
 * Validate a raw spec object against the SpecForge schema.
 */
export function validateSpec(rawSpec: unknown): ValidationResult {
  try {
    const parsed = specSchema.parse(rawSpec);

    const spec: ParsedSpec = {
      specforge: parsed.specforge,
      name: parsed.name,
      version: parsed.version,
      models: parsed.models as ParsedSpec["models"],
      api: parsed.api as ParsedSpec["api"],
      tests: (parsed.tests ?? {}) as ParsedSpec["tests"],
    };

    return {
      success: true,
      errors: [],
      spec,
    };
  } catch (err) {
    if (err instanceof ZodError) {
      const errors: ValidationError[] = err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      return {
        success: false,
        errors,
      };
    }

    return {
      success: false,
      errors: [
        {
          path: "",
          message: err instanceof Error ? err.message : String(err),
        },
      ],
    };
  }
}

/**
 * Validate and return a ParsedSpec, or throw on validation failure.
 */
export function validateSpecOrThrow(rawSpec: unknown): ParsedSpec {
  const result = validateSpec(rawSpec);

  if (!result.success) {
    const messages = result.errors
      .map((e) => (e.path ? `  ${e.path}: ${e.message}` : `  ${e.message}`))
      .join("\n");
    throw new Error(`Spec validation failed:\n${messages}`);
  }

  return result.spec!;
}
