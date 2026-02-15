import * as fs from "node:fs";
import * as path from "node:path";
import YAML from "yaml";
import type {
  CustomCommandDefinition,
  CustomCommandsFile,
  CustomCommandVariable,
} from "./types.js";

const COMMANDS_DIR = ".specforge";
const COMMANDS_FILE = "commands.yaml";

const BUILT_IN_COMMANDS = new Set([
  "init",
  "validate",
  "generate",
  "test",
  "diff",
  "constitution",
  "specify",
  "clarify",
  "plan",
  "brainstorm",
  "tasks",
  "analyze",
  "watch",
  "issues",
  "implement",
  "remove",
  "command",
  "update",
  "review",
]);

const VARIABLE_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const SAFE_VALUE_RE = /^[a-zA-Z0-9._\-\/]+$/;

function getCommandsFilePath(cwd?: string): string {
  const base = cwd ?? process.cwd();
  return path.join(base, COMMANDS_DIR, COMMANDS_FILE);
}

export function loadCustomCommands(cwd?: string): CustomCommandsFile {
  const filePath = getCommandsFilePath(cwd);
  if (!fs.existsSync(filePath)) {
    return { commands: [] };
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = YAML.parse(content);
  if (!parsed || !Array.isArray(parsed.commands)) {
    return { commands: [] };
  }
  return parsed as CustomCommandsFile;
}

export function saveCustomCommands(
  data: CustomCommandsFile,
  cwd?: string
): void {
  const filePath = getCommandsFilePath(cwd);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, YAML.stringify(data), "utf-8");
}

export function isBuiltInCommand(name: string): boolean {
  return BUILT_IN_COMMANDS.has(name);
}

export function addCustomCommand(
  name: string,
  opts: { run: string; description?: string; alias?: string },
  cwd?: string
): CustomCommandDefinition {
  if (isBuiltInCommand(name)) {
    throw new Error(`Cannot override built-in command: ${name}`);
  }

  const data = loadCustomCommands(cwd);

  if (data.commands.some((c) => c.name === name)) {
    throw new Error(`Custom command already exists: ${name}`);
  }

  if (opts.alias) {
    if (isBuiltInCommand(opts.alias)) {
      throw new Error(`Alias cannot override built-in command: ${opts.alias}`);
    }
    if (
      data.commands.some(
        (c) => c.alias === opts.alias || c.name === opts.alias
      )
    ) {
      throw new Error(`Alias already in use: ${opts.alias}`);
    }
  }

  const variables = extractVariables(opts.run);
  const command: CustomCommandDefinition = {
    name,
    run: opts.run,
    ...(opts.description && { description: opts.description }),
    ...(opts.alias && { alias: opts.alias }),
    ...(variables.length > 0 && { variables }),
  };

  data.commands.push(command);
  saveCustomCommands(data, cwd);
  return command;
}

export function editCustomCommand(
  name: string,
  opts: { run?: string; description?: string; alias?: string },
  cwd?: string
): CustomCommandDefinition {
  const data = loadCustomCommands(cwd);
  const index = data.commands.findIndex((c) => c.name === name);
  if (index === -1) {
    throw new Error(`Custom command not found: ${name}`);
  }

  const command = data.commands[index];

  if (opts.alias) {
    if (isBuiltInCommand(opts.alias)) {
      throw new Error(`Alias cannot override built-in command: ${opts.alias}`);
    }
    const conflict = data.commands.find(
      (c, i) => i !== index && (c.alias === opts.alias || c.name === opts.alias)
    );
    if (conflict) {
      throw new Error(`Alias already in use: ${opts.alias}`);
    }
  }

  if (opts.run !== undefined) {
    command.run = opts.run;
    command.variables = extractVariables(opts.run);
    if (command.variables.length === 0) {
      delete command.variables;
    }
  }
  if (opts.description !== undefined) command.description = opts.description;
  if (opts.alias !== undefined) command.alias = opts.alias;

  data.commands[index] = command;
  saveCustomCommands(data, cwd);
  return command;
}

export function removeCustomCommand(
  name: string,
  cwd?: string
): void {
  const data = loadCustomCommands(cwd);
  const index = data.commands.findIndex((c) => c.name === name);
  if (index === -1) {
    throw new Error(`Custom command not found: ${name}`);
  }
  data.commands.splice(index, 1);
  saveCustomCommands(data, cwd);
}

export function getCustomCommand(
  nameOrAlias: string,
  cwd?: string
): CustomCommandDefinition | undefined {
  const data = loadCustomCommands(cwd);
  return data.commands.find(
    (c) => c.name === nameOrAlias || c.alias === nameOrAlias
  );
}

export function listCustomCommands(
  cwd?: string
): CustomCommandDefinition[] {
  return loadCustomCommands(cwd).commands;
}

export function extractVariables(template: string): CustomCommandVariable[] {
  const seen = new Set<string>();
  const variables: CustomCommandVariable[] = [];
  const re = /\{([a-zA-Z][a-zA-Z0-9_-]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(template)) !== null) {
    const name = match[1];
    if (!seen.has(name)) {
      seen.add(name);
      variables.push({ name });
    }
  }
  return variables;
}

export function substituteVariables(
  template: string,
  positional: string[],
  named: Record<string, string>,
  variables: CustomCommandVariable[]
): string {
  let result = template;

  for (let i = 0; i < variables.length; i++) {
    const v = variables[i];
    const value = named[v.name] ?? positional[i] ?? v.default;
    if (value === undefined) {
      const varNames = variables.map((vr) => `{${vr.name}}`).join(", ");
      throw new Error(
        `Missing required variable: {${v.name}}\n  Usage: specforge <command> ${varNames}`
      );
    }

    if (!VARIABLE_NAME_RE.test(v.name)) {
      throw new Error(`Invalid variable name: ${v.name}`);
    }
    if (!SAFE_VALUE_RE.test(value)) {
      throw new Error(
        `Unsafe variable value for {${v.name}}: "${value}"\n  Values must match: ${SAFE_VALUE_RE}`
      );
    }

    result = result.replaceAll(`{${v.name}}`, value);
  }

  return result;
}
