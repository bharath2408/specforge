import * as fs from "node:fs";
import * as path from "node:path";
import { loadConfig } from "@specforge/core/config";
import { resolveSpecDir } from "@specforge/core/sequence";
import {
  generatePlan,
  generatePlanMarkdown,
  generateDataModelMarkdown,
} from "@specforge/core/planner";

export async function planCommand(specId: string): Promise<void> {
  if (!specId) {
    console.error(
      "\n  Please provide a spec ID.\n  Usage: specforge plan <spec-id>\n"
    );
    process.exit(1);
  }

  const config = loadConfig();
  const specsDir = path.resolve(config.specsDir);
  const specDir = resolveSpecDir(specsDir, specId);

  if (!specDir) {
    console.error(`\n  Spec not found: ${specId}`);
    console.error(`  Run 'specforge specify <name>' to create a spec first.\n`);
    process.exit(1);
  }

  const specPath = path.join(specDir, "spec.md");
  if (!fs.existsSync(specPath)) {
    console.error(`\n  No spec.md found in: ${specDir}\n`);
    process.exit(1);
  }

  const constitutionPath = path.join(
    path.resolve(config.memoryDir),
    "constitution.md"
  );

  console.log(`\n  Generating implementation plan for: ${specId}\n`);

  const plan = generatePlan(
    specDir,
    fs.existsSync(constitutionPath) ? constitutionPath : undefined
  );

  // Write plan.md
  const planMarkdown = generatePlanMarkdown(plan);
  const planPath = path.join(specDir, "plan.md");
  fs.writeFileSync(planPath, planMarkdown, "utf-8");
  console.log(`  Plan generated: ${planPath}`);

  // Write data-model.md
  const dataModelMarkdown = generateDataModelMarkdown(plan.dataModel);
  const dataModelPath = path.join(specDir, "data-model.md");
  fs.writeFileSync(dataModelPath, dataModelMarkdown, "utf-8");
  console.log(`  Data model generated: ${dataModelPath}`);

  // Summary
  console.log(`\n  Plan summary:`);
  console.log(`    Phases: ${plan.phases.length}`);
  console.log(
    `    File changes: ${plan.phases.reduce((sum, p) => sum + p.fileChanges.length, 0)}`
  );
  console.log(`    Data entities: ${plan.dataModel.length}`);
  console.log(
    `    Constitutional checks: ${plan.constitutionCompliance.length}`
  );

  console.log(`\n  Next steps:`);
  console.log(`    1. Review plan at: ${planPath}`);
  console.log(`    2. Run 'specforge tasks ${path.basename(specDir)}' to generate tasks`);
  console.log(
    `    3. Run 'specforge analyze ${path.basename(specDir)}' to check consistency\n`
  );
}
