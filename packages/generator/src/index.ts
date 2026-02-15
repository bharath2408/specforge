import type { ParsedSpec, GeneratedFile, GenerateOptions } from "@specforge-dev/core";
import { modelPlugin } from "./plugins/model.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { fastifyPlugin } from "./plugins/fastify.js";
import { testPlugin } from "./plugins/test.js";
import { docsPlugin } from "./plugins/docs.js";
import { middlewarePlugin } from "./plugins/middleware.js";
import { playwrightPlugin } from "./plugins/playwright.js";
import type { SpecForgePlugin } from "./types.js";

export { renderTemplate, loadTemplate } from "./engine.js";
export { modelPlugin } from "./plugins/model.js";
export { prismaPlugin } from "./plugins/prisma.js";
export { fastifyPlugin } from "./plugins/fastify.js";
export { testPlugin } from "./plugins/test.js";
export { docsPlugin } from "./plugins/docs.js";
export { middlewarePlugin } from "./plugins/middleware.js";
export { playwrightPlugin } from "./plugins/playwright.js";
export type { SpecForgePlugin, TemplateContext } from "./types.js";

const builtinPlugins: Record<string, SpecForgePlugin> = {
  model: modelPlugin,
  prisma: prismaPlugin,
  fastify: fastifyPlugin,
  test: testPlugin,
  docs: docsPlugin,
  middleware: middlewarePlugin,
  playwright: playwrightPlugin,
};

export interface GenerateResult {
  files: GeneratedFile[];
  pluginResults: Record<string, GeneratedFile[]>;
}

/**
 * Run all (or selected) generator plugins against a parsed spec.
 */
export function generate(
  spec: ParsedSpec,
  options: GenerateOptions
): GenerateResult {
  const pluginNames = options.plugins ?? Object.keys(builtinPlugins);
  const files: GeneratedFile[] = [];
  const pluginResults: Record<string, GeneratedFile[]> = {};

  for (const name of pluginNames) {
    const plugin = builtinPlugins[name];
    if (!plugin) {
      throw new Error(`Unknown generator plugin: ${name}`);
    }

    const generated = plugin.generate(spec, options);
    pluginResults[name] = generated;
    files.push(...generated);
  }

  return { files, pluginResults };
}

/**
 * Get a list of available built-in plugins.
 */
export function getBuiltinPlugins(): string[] {
  return Object.keys(builtinPlugins);
}
