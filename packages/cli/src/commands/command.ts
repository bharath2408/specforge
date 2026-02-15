import {
  addCustomCommand,
  editCustomCommand,
  removeCustomCommand,
  getCustomCommand,
  listCustomCommands,
} from "@specforge-dev/core/custom-commands";

export async function commandAddHandler(
  name: string,
  opts: { run: string; description?: string; alias?: string }
): Promise<void> {
  try {
    const command = addCustomCommand(name, opts);
    console.log(`\n  Custom command added: ${command.name}`);
    if (command.description) {
      console.log(`  Description: ${command.description}`);
    }
    console.log(`  Run: ${command.run}`);
    if (command.alias) {
      console.log(`  Alias: ${command.alias}`);
    }
    if (command.variables && command.variables.length > 0) {
      console.log(
        `  Variables: ${command.variables.map((v) => `{${v.name}}`).join(", ")}`
      );
    }
    console.log();
  } catch (err) {
    console.error(`\n  Error: ${(err as Error).message}\n`);
    process.exit(1);
  }
}

export async function commandListHandler(): Promise<void> {
  const commands = listCustomCommands();
  if (commands.length === 0) {
    console.log(
      '\n  No custom commands defined.\n  Use "specforge command add <name> --run <command>" to create one.\n'
    );
    return;
  }

  console.log(`\n  Custom Commands (${commands.length}):\n`);
  for (const cmd of commands) {
    const alias = cmd.alias ? ` (alias: ${cmd.alias})` : "";
    console.log(`    ${cmd.name}${alias}`);
    if (cmd.description) {
      console.log(`      ${cmd.description}`);
    }
    console.log(`      run: ${cmd.run}`);
  }
  console.log();
}

export async function commandEditHandler(
  name: string,
  opts: { run?: string; description?: string; alias?: string }
): Promise<void> {
  try {
    const command = editCustomCommand(name, opts);
    console.log(`\n  Custom command updated: ${command.name}`);
    if (command.description) {
      console.log(`  Description: ${command.description}`);
    }
    console.log(`  Run: ${command.run}`);
    if (command.alias) {
      console.log(`  Alias: ${command.alias}`);
    }
    console.log();
  } catch (err) {
    console.error(`\n  Error: ${(err as Error).message}\n`);
    process.exit(1);
  }
}

export async function commandRemoveHandler(name: string): Promise<void> {
  try {
    removeCustomCommand(name);
    console.log(`\n  Custom command removed: ${name}\n`);
  } catch (err) {
    console.error(`\n  Error: ${(err as Error).message}\n`);
    process.exit(1);
  }
}

export async function commandShowHandler(name: string): Promise<void> {
  const command = getCustomCommand(name);
  if (!command) {
    console.error(`\n  Custom command not found: ${name}\n`);
    process.exit(1);
  }

  console.log(`\n  Command: ${command.name}`);
  if (command.description) {
    console.log(`  Description: ${command.description}`);
  }
  console.log(`  Run: ${command.run}`);
  if (command.alias) {
    console.log(`  Alias: ${command.alias}`);
  }
  if (command.variables && command.variables.length > 0) {
    console.log("  Variables:");
    for (const v of command.variables) {
      const def = v.default ? ` (default: ${v.default})` : "";
      console.log(`    {${v.name}}${def}`);
    }
  }
  console.log();
}
