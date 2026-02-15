import * as fs from "node:fs";
import * as path from "node:path";
import Handlebars from "handlebars";

const handlebars = Handlebars.create();

// Register helpers
handlebars.registerHelper("lowercase", (str: string) =>
  str ? str.toLowerCase() : ""
);

handlebars.registerHelper("uppercase", (str: string) =>
  str ? str.toUpperCase() : ""
);

handlebars.registerHelper("camelCase", (str: string) => {
  if (!str) return "";
  return str.charAt(0).toLowerCase() + str.slice(1);
});

handlebars.registerHelper("pascalCase", (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
});

handlebars.registerHelper("pluralize", (str: string) => {
  if (!str) return "";
  if (str.endsWith("s")) return str + "es";
  if (str.endsWith("y")) return str.slice(0, -1) + "ies";
  return str + "s";
});

handlebars.registerHelper("snakeCase", (str: string) => {
  if (!str) return "";
  return str.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "");
});

handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);

handlebars.registerHelper("includes", (arr: unknown[], item: unknown) => {
  if (!Array.isArray(arr)) return false;
  return arr.includes(item);
});

handlebars.registerHelper("json", (obj: unknown) => JSON.stringify(obj, null, 2));

handlebars.registerHelper("ifCond", function (this: unknown, v1: unknown, operator: string, v2: unknown, options: Handlebars.HelperOptions) {
  switch (operator) {
    case "===": return v1 === v2 ? options.fn(this) : options.inverse(this);
    case "!==": return v1 !== v2 ? options.fn(this) : options.inverse(this);
    default: return options.inverse(this);
  }
});

/**
 * Load and compile a Handlebars template from the templates directory.
 */
export function loadTemplate(templatePath: string): HandlebarsTemplateDelegate {
  const templatesDir = path.join(__dirname, "templates");
  const fullPath = path.join(templatesDir, templatePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`Template not found: ${fullPath}`);
  }

  const source = fs.readFileSync(fullPath, "utf-8");
  return handlebars.compile(source, { noEscape: true });
}

/**
 * Render a template with the given context.
 */
export function renderTemplate(templatePath: string, context: Record<string, unknown>): string {
  const template = loadTemplate(templatePath);
  return template(context);
}

export { handlebars };
