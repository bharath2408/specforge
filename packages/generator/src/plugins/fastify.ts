import type { ParsedSpec, GeneratedFile, GenerateOptions } from "@specforge/core";
import { renderTemplate } from "../engine.js";
import type { SpecForgePlugin } from "../types.js";

export const fastifyPlugin: SpecForgePlugin = {
  name: "fastify",
  version: "0.1.0",

  generate(spec: ParsedSpec, _options: GenerateOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    const routes: { importName: string; fileName: string }[] = [];

    for (const endpoint of spec.api.endpoints) {
      const modelName = endpoint.model;
      const fileName = modelName.toLowerCase();
      const importName = modelName.charAt(0).toLowerCase() + modelName.slice(1);

      routes.push({ importName, fileName });

      const content = renderTemplate("fastify/route.hbs", {
        modelName,
        endpoint: {
          path: endpoint.path,
          auth: endpoint.auth ?? {},
        },
        actions: endpoint.actions,
      });

      files.push({
        path: `src/routes/${fileName}.ts`,
        content,
        overwrite: true,
      });
    }

    // Generate server entry point
    const serverContent = renderTemplate("fastify/server.hbs", {
      routes,
      basePath: spec.api.basePath,
    });

    files.push({
      path: "src/server.ts",
      content: serverContent,
      overwrite: true,
    });

    return files;
  },
};
