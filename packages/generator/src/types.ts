import type { ParsedSpec, GeneratedFile, GenerateOptions } from "@specforge/core";

export interface SpecForgePlugin {
  name: string;
  version: string;
  generate(spec: ParsedSpec, options: GenerateOptions): GeneratedFile[];
}

export interface TemplateContext {
  spec: ParsedSpec;
  modelName?: string;
  modelSpec?: Record<string, unknown>;
  endpoint?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ExtendedPlugin extends SpecForgePlugin {
  hooks?: {
    beforeGenerate?: (spec: ParsedSpec, options: GenerateOptions) => void;
    afterGenerate?: (files: GeneratedFile[]) => void;
  };
}
