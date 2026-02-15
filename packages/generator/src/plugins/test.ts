import type { ParsedSpec, GeneratedFile, GenerateOptions } from "@specforge/core";
import { renderTemplate } from "../engine.js";
import type { SpecForgePlugin } from "../types.js";

export const testPlugin: SpecForgePlugin = {
  name: "test",
  version: "0.1.0",

  generate(spec: ParsedSpec, _options: GenerateOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    for (const [modelName, testCases] of Object.entries(spec.tests)) {
      if (!testCases || testCases.length === 0) continue;

      const content = renderTemplate("test/test.hbs", {
        modelName,
        tests: testCases,
      });

      files.push({
        path: `tests/${modelName.toLowerCase()}.test.ts`,
        content,
        overwrite: true,
      });
    }

    return files;
  },
};
