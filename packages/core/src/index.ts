export { parseSpecFile, parseSpecString, discoverSpecFiles } from "./parser.js";
export { validateSpec, validateSpecOrThrow } from "./validator.js";
export { specSchema } from "./schema.js";

// Phase 1: Core Infrastructure
export { loadConfig, DEFAULT_CONFIG } from "./config.js";
export {
  getNextSequenceNumber,
  formatSequence,
  formatSpecDirName,
  parseSpecDirName,
  listSpecDirs,
  resolveSpecDir,
} from "./sequence.js";
export {
  getGitContext,
  isGitRepo,
  getCurrentBranch,
  getRemoteUrl,
  isWorkingTreeDirty,
  createBranch,
} from "./git.js";

// Phase 2: Constitution + Specify + Clarify
export {
  getDefaultArticles,
  parseConstitution,
  addAmendment,
  generateConstitutionMarkdown,
} from "./constitution.js";
export {
  listSpecs,
  getNextSpecId,
  slugify,
  parseSpecMarkdown,
  generateSpecMarkdown,
} from "./specfile.js";
export {
  scanForAmbiguities,
  generateCoverageTable,
} from "./ambiguity.js";

// Phase 3: Plan + Tasks + Analyze
export {
  generatePlan,
  generatePlanMarkdown,
  generateDataModelMarkdown,
} from "./planner.js";
export {
  generateTasks,
  parseTasksMarkdown,
  generateTasksMarkdown,
} from "./tasks.js";
export {
  analyzeConsistency,
  generateAnalysisMarkdown,
} from "./analyzer.js";

// Phase 4: Brainstorm
export {
  extractSearchKeywords,
  analyzeFeaturesForGaps,
  generateBrainstormSuggestions,
  buildComparisonTable,
  generateBrainstormMarkdown,
} from "./brainstorm.js";

// Phase 4b: Smart Tool Selection
export {
  analyzeSpecSignals,
  selectTools,
  formatToolSelectionSummary,
} from "./tool-selector.js";

// Phase 6: Review
export { reviewSpec, generateReviewMarkdown } from "./reviewer.js";

// Phase 5: Custom Commands
export {
  loadCustomCommands,
  saveCustomCommands,
  isBuiltInCommand,
  addCustomCommand,
  editCustomCommand,
  removeCustomCommand,
  getCustomCommand,
  listCustomCommands,
  extractVariables,
  substituteVariables,
} from "./custom-commands.js";

// Types
export type {
  FieldType,
  RelationKind,
  AuthLevel,
  CrudAction,
  FieldSpec,
  ModelSpec,
  EndpointAuth,
  EndpointSpec,
  ApiSpec,
  TestExpect,
  TestCase,
  ParsedSpec,
  GenerateOptions,
  GeneratedFile,
  SpecForgePlugin,
  ValidationError,
  ValidationResult,
  // New types
  SpecForgeConfig,
  Article,
  Amendment,
  Constitution,
  Priority,
  UserScenario,
  FunctionalRequirement,
  FeatureSpec,
  FileChange,
  PlanPhase,
  Plan,
  DataModelEntity,
  TaskPriority,
  TaskItem,
  TaskPhase,
  Severity,
  AnalysisFinding,
  AnalysisReport,
  GitContext,
  AmbiguityFinding,
  CoverageTable,
  CompetitorInfo,
  FeatureGap,
  ValueAddSuggestion,
  BrainstormReport,
  CompetitorComparisonRow,
  CustomCommandVariable,
  CustomCommandDefinition,
  CustomCommandsFile,
  FileChangeEntry,
  UpdateResult,
  DomainCategory,
  SpecSignals,
  ToolSelection,
  ToolOverride,
  ReviewDimension,
  ReviewFinding,
  DimensionScore,
  ReviewVerdict,
  ReviewReport,
  ReviewOptions,
} from "./types.js";
