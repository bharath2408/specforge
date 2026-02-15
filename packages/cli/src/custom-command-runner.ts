import { execSync } from "node:child_process";
import {
  getCustomCommand,
  substituteVariables,
} from "@specforge-dev/core";

export function parseCustomArgs(rawArgs: string[]): {
  positional: string[];
  named: Record<string, string>;
} {
  const positional: string[] = [];
  const named: Record<string, string> = {};

  for (let i = 0; i < rawArgs.length; i++) {
    const arg = rawArgs[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = rawArgs[i + 1];
      if (value !== undefined && !value.startsWith("--")) {
        named[key] = value;
        i++;
      }
    } else {
      positional.push(arg);
    }
  }

  return { positional, named };
}

export function executeCustomCommand(
  name: string,
  rawArgs: string[]
): number {
  const command = getCustomCommand(name);
  if (!command) {
    console.error(`\n  Custom command not found: ${name}\n`);
    return 1;
  }

  const { positional, named } = parseCustomArgs(rawArgs);

  let resolved: string;
  try {
    resolved = substituteVariables(
      command.run,
      positional,
      named,
      command.variables ?? []
    );
  } catch (err) {
    console.error(`\n  Error: ${(err as Error).message}\n`);
    return 1;
  }

  console.log(`\n  Running: ${resolved}\n`);

  try {
    execSync(resolved, { stdio: "inherit", shell: "/bin/sh" });
    return 0;
  } catch (err) {
    const exitCode =
      (err as { status?: number }).status ?? 1;
    return exitCode;
  }
}
