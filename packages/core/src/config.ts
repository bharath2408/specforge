import * as fs from "node:fs";
import * as path from "node:path";
import { parse as parseYaml } from "yaml";
import type { SpecForgeConfig } from "./types.js";

const DEFAULT_CONFIG: SpecForgeConfig = {
  specDir: "spec",
  outputDir: ".",
  memoryDir: "memory",
  specsDir: "specs",
  plugins: ["model", "prisma", "fastify", "test"],
  git: {
    autoCreateBranch: false,
    branchPrefix: "spec/",
  },
};

const CONFIG_FILENAMES = ["specforge.config.yaml", "specforge.config.yml"];

/**
 * Load SpecForge configuration from a YAML config file or return defaults.
 */
export function loadConfig(cwd: string = process.cwd()): SpecForgeConfig {
  for (const filename of CONFIG_FILENAMES) {
    const configPath = path.join(cwd, filename);
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, "utf-8");
      const parsed = parseYaml(raw) as Partial<SpecForgeConfig> | null;
      if (parsed && typeof parsed === "object") {
        return mergeConfig(DEFAULT_CONFIG, parsed);
      }
    }
  }
  return { ...DEFAULT_CONFIG };
}

function mergeConfig(
  defaults: SpecForgeConfig,
  overrides: Partial<SpecForgeConfig>
): SpecForgeConfig {
  return {
    specDir: overrides.specDir ?? defaults.specDir,
    outputDir: overrides.outputDir ?? defaults.outputDir,
    memoryDir: overrides.memoryDir ?? defaults.memoryDir,
    specsDir: overrides.specsDir ?? defaults.specsDir,
    plugins: overrides.plugins ?? defaults.plugins,
    git: {
      autoCreateBranch:
        overrides.git?.autoCreateBranch ?? defaults.git.autoCreateBranch,
      branchPrefix: overrides.git?.branchPrefix ?? defaults.git.branchPrefix,
    },
  };
}

export { DEFAULT_CONFIG };
