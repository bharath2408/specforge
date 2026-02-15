/** Core TypeScript types for SpecForge */

export type FieldType =
  | "uuid"
  | "string"
  | "text"
  | "integer"
  | "float"
  | "boolean"
  | "datetime"
  | "date"
  | "json"
  | "enum"
  | "relation";

export type RelationKind = "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";

export type AuthLevel = "public" | "authenticated" | "admin" | "owner";

export type CrudAction = "list" | "get" | "create" | "update" | "delete";

export interface FieldSpec {
  type: FieldType;
  primary?: boolean;
  unique?: boolean;
  nullable?: boolean;
  default?: unknown;
  auto?: boolean;
  validate?: string;
  min?: number;
  max?: number;
  /** For enum fields */
  values?: string[];
  /** For relation fields */
  model?: string;
  kind?: RelationKind;
}

export interface ModelSpec {
  fields: Record<string, FieldSpec>;
}

export interface EndpointAuth {
  [action: string]: AuthLevel | AuthLevel[];
}

export interface EndpointSpec {
  path: string;
  model: string;
  actions: CrudAction[];
  auth?: EndpointAuth;
}

export interface ApiSpec {
  basePath: string;
  auth?: {
    strategy: string;
  };
  endpoints: EndpointSpec[];
}

export interface TestExpect {
  status: number;
  body?: Record<string, unknown>;
}

export interface TestCase {
  name: string;
  action: CrudAction;
  input?: Record<string, unknown>;
  expect: TestExpect;
}

export interface ParsedSpec {
  specforge: string;
  name: string;
  version: string;
  models: Record<string, ModelSpec>;
  api: ApiSpec;
  tests: Record<string, TestCase[]>;
}

export interface GenerateOptions {
  outputDir: string;
  overwrite?: boolean;
  plugins?: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  overwrite: boolean;
}

export interface SpecForgePlugin {
  name: string;
  version: string;
  generate(spec: ParsedSpec, options: GenerateOptions): GeneratedFile[];
}

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  spec?: ParsedSpec;
}

// ──────────────────────────────────────────────────────────────
// Configuration
// ──────────────────────────────────────────────────────────────

export interface SpecForgeConfig {
  specDir: string;
  outputDir: string;
  memoryDir: string;
  specsDir: string;
  plugins: string[];
  git: {
    autoCreateBranch: boolean;
    branchPrefix: string;
  };
}

// ──────────────────────────────────────────────────────────────
// Constitution
// ──────────────────────────────────────────────────────────────

export interface Article {
  id: string;
  title: string;
  description: string;
}

export interface Amendment {
  id: string;
  date: string;
  description: string;
  articleId?: string;
}

export interface Constitution {
  articles: Article[];
  amendments: Amendment[];
}

// ──────────────────────────────────────────────────────────────
// Feature Spec
// ──────────────────────────────────────────────────────────────

export type Priority = "P1" | "P2" | "P3";

export interface UserScenario {
  id: string;
  priority: Priority;
  description: string;
  given: string;
  when: string;
  then: string;
}

export interface FunctionalRequirement {
  id: string;
  description: string;
  scenarios: string[];
}

export interface FeatureSpec {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "clarified" | "planned" | "in-progress" | "complete";
  scenarios: UserScenario[];
  requirements: FunctionalRequirement[];
  entities: string[];
  successCriteria: string[];
  edgeCases: string[];
  openQuestions: string[];
}

// ──────────────────────────────────────────────────────────────
// Plan
// ──────────────────────────────────────────────────────────────

export interface FileChange {
  path: string;
  action: "create" | "modify" | "delete";
  description: string;
}

export interface PlanPhase {
  name: string;
  description: string;
  fileChanges: FileChange[];
}

export interface Plan {
  specId: string;
  constitutionCompliance: string[];
  techContext: string[];
  phases: PlanPhase[];
  dataModel: DataModelEntity[];
}

export interface DataModelEntity {
  name: string;
  fields: Array<{ name: string; type: string; constraints: string }>;
  relationships: string[];
}

// ──────────────────────────────────────────────────────────────
// Tasks
// ──────────────────────────────────────────────────────────────

export type TaskPriority = "P1" | "P2" | "P3";

export interface TaskItem {
  id: string;
  priority: TaskPriority;
  scenarioRef: string;
  description: string;
  done: boolean;
  dependencies: string[];
  parallel: boolean;
}

export interface TaskPhase {
  name: string;
  tasks: TaskItem[];
}

// ──────────────────────────────────────────────────────────────
// Analysis
// ──────────────────────────────────────────────────────────────

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface AnalysisFinding {
  severity: Severity;
  category: string;
  message: string;
  location?: string;
}

export interface AnalysisReport {
  specId?: string;
  findings: AnalysisFinding[];
  summary: Record<Severity, number>;
}

// ──────────────────────────────────────────────────────────────
// Git Context
// ──────────────────────────────────────────────────────────────

export interface GitContext {
  isRepo: boolean;
  currentBranch: string;
  remoteUrl: string;
  isDirty: boolean;
}

// ──────────────────────────────────────────────────────────────
// Ambiguity
// ──────────────────────────────────────────────────────────────

export interface AmbiguityFinding {
  category: string;
  description: string;
  location: string;
  suggestion: string;
}

export interface CoverageTable {
  category: string;
  status: "covered" | "partial" | "missing";
  details: string;
}
