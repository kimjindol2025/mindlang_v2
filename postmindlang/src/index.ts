/**
 * PostMindLang Main Export Module
 * Aggregates all PostMindLang components
 */

// Core Integration
export {
  PostMindLangIntegration,
  PostMindLangRuntime,
  MindLangToPostMindLangCompiler,
  VectorTensor,
  ExecutionResult,
  PostMindLangResult,
  DualExecutionResult,
  ExecutionMetrics,
  TrainingMetrics,
  ComparisonResult,
} from './integration';

// Benchmarking
export {
  PostMindLangBenchmarks,
  BenchmarkResult,
  LatencyBenchmark,
  ThroughputBenchmark,
  AccuracyBenchmark,
  MemoryBenchmark,
  GradientBenchmark,
} from './benchmarks';

// Visualization
export {
  PostMindLangVisualizer,
  Point2D,
  Point3D,
  GradientFlowData,
  WeightEvolution,
  TrajectoryPoint,
} from './visualization';

// Testing
export { PostMindLangTestSuite } from './tests';

// Examples
export * from './examples';

// Core Runtime Modules
export {
  Tensor,
  Matrix,
  Tensor3D,
  TensorShape,
  TensorOps,
  MultilinearOps,
} from './tensor';

export { QueryEncoder, DeepQueryEncoder } from './encoding';

export { PathExecutor } from './paths';

export { EnsembleModule, AdaptiveEnsembleModule } from './ensemble';

export {
  CritiqueModule,
  AdvancedCritiqueModule,
  StandardLosses,
  LossFn,
  GradientFn,
} from './critique';

export { Sampler, SampleResult } from './sampler';

export {
  DifferentiableOps,
  ComputationGraph,
  ReverseMode,
  GradientChecker,
  BackwardFn,
  ComputeNode,
} from './diff_ops';

export {
  PostMindLangRuntimeCore,
  RuntimeConfig,
  ExecutionResult,
  TrainingState,
} from './runtime';

/**
 * Quick start helper
 */
export async function quickStart(): Promise<void> {
  const { runAllExamples } = await import('./examples');
  await runAllExamples();
}

/**
 * Run complete test and benchmark suite
 */
export async function runFullValidation(): Promise<void> {
  const { PostMindLangTestSuite } = await import('./tests');
  const { PostMindLangBenchmarks } = await import('./benchmarks');

  console.log('Running full validation suite...\n');

  // Tests
  const suite = new PostMindLangTestSuite();
  await suite.runAllTests();

  console.log('\n' + '='.repeat(60) + '\n');

  // Benchmarks
  const benchmarks = new PostMindLangBenchmarks();
  await benchmarks.runAllBenchmarks();
}

/**
 * Initialize PostMindLang system
 */
export function initializePostMindLang(config?: {
  stackSizeMB?: number;
  heapSizeMB?: number;
  maxInstructions?: number;
}): PostMindLangIntegration {
  return new PostMindLangIntegration(config);
}

/**
 * Version information
 */
export const VERSION = '1.0.0';
export const BUILD_DATE = '2026-02-20';

/**
 * Module status
 */
export const MODULE_STATUS = {
  integration: 'stable',
  benchmarks: 'stable',
  visualization: 'stable',
  tests: 'stable',
  version: VERSION,
  build_date: BUILD_DATE,
};

export default {
  PostMindLangIntegration,
  PostMindLangRuntime,
  PostMindLangBenchmarks,
  PostMindLangVisualizer,
  PostMindLangTestSuite,
  initializePostMindLang,
  runFullValidation,
  quickStart,
  VERSION,
  BUILD_DATE,
  MODULE_STATUS,
};
