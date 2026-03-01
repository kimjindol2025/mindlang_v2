/**
 * MindLang Agent Framework - Type Definitions
 * Comprehensive type system for the agent runtime
 */

// ============================================================================
// Vector and Encoding Types
// ============================================================================

export type Vector = number[];
export type Matrix = number[][];

export interface EncodingConfig {
  dimension: number;
  method: 'dense' | 'sparse' | 'hybrid';
  normalization: 'l2' | 'l1' | 'none';
}

// ============================================================================
// Agent State and Execution
// ============================================================================

export interface AgentState {
  id: string;
  status: 'idle' | 'thinking' | 'executing' | 'error' | 'completed';
  currentQuery: string;
  iteration: number;
  timestamp: number;
  metadata: Map<string, any>;
}

export interface ExecutionTrace {
  timestamp: number;
  stage: string;
  duration: number;
  data?: any;
  stack?: Vector[];
  registers?: Map<number, Vector>;
}

export interface ExecutionMetrics {
  totalTime: number;
  analyticalTime: number;
  creativeTime: number;
  empiricalTime: number;
  parallelizationRatio: number;
  instructionCount: number;
  cacheHitRate: number;
}

// ============================================================================
// Path Results
// ============================================================================

export interface PathResult {
  pathType: 'analytical' | 'creative' | 'empirical';
  output: Vector;
  confidence: number;
  reasoning: string;
  metadata?: Map<string, any>;
}

export interface ParallelResults {
  analytical: {
    result: Vector;
    confidence: number;
    time: number;
  };
  creative: {
    result: Vector;
    confidence: number;
    time: number;
  };
  empirical: {
    result: Vector;
    confidence: number;
    time: number;
  };
  totalTime: number;
}

// ============================================================================
// Weights and Ensemble
// ============================================================================

export interface Weights {
  alpha: number; // Analytical weight
  beta: number;  // Creative weight
  gamma: number; // Empirical weight
  timestamp: number;
  adaptive: boolean;
}

export interface WeightAssessment {
  queryType: string;
  confidences: {
    analytical: number;
    creative: number;
    empirical: number;
  };
  suggestions: string[];
}

// ============================================================================
// Critique System
// ============================================================================

export interface Critique {
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  shouldRetry: boolean;
  retryStrategy?: string;
  score: number;
}

export interface CritiqueResult {
  isValid: boolean;
  critique: Critique;
  requiresRefinement: boolean;
}

// ============================================================================
// Agent Response
// ============================================================================

export interface AgentResponse {
  response: string;
  confidence: number;
  responseType: 'final' | 'intermediate' | 'refined';
  reasoning: {
    analytical: Vector;
    creative: Vector;
    empirical: Vector;
    weights: Weights;
    critique: Critique;
    ensemble: Vector;
  };
  metadata: {
    executionTime: number;
    iterations: number;
    cacheUsed: boolean;
    refinements: number;
  };
}

// ============================================================================
// Compiled Agent
// ============================================================================

export interface CompiledAgent {
  analytical: BytecodeProgram;
  creative: BytecodeProgram;
  empirical: BytecodeProgram;
  weights: WeightConfig;
  critique: CritiqueConfig;
  metadata: AgentMetadata;
}

export interface BytecodeProgram {
  instructions: Instruction[];
  constants: Map<number, any>;
  entryPoint: number;
  exitPoint: number;
}

export interface Instruction {
  opcode: number;
  operands: any[];
  line?: number;
  column?: number;
}

export interface WeightConfig {
  adaptiveMode: boolean;
  initialWeights: [number, number, number];
  updateStrategy: 'softmax' | 'temperature' | 'dynamic';
  learningRate: number;
}

export interface CritiqueConfig {
  confidenceThreshold: number;
  retryLimit: number;
  refinementStrategies: string[];
  selfCheckEnabled: boolean;
}

export interface AgentMetadata {
  name: string;
  version: string;
  author: string;
  createdAt: number;
  modifiedAt: number;
  description: string;
}

// ============================================================================
// Database and Caching
// ============================================================================

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  hits: number;
  expiresAt: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
}

// ============================================================================
// Integration Interfaces
// ============================================================================

export interface ExternalAPIOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface DatabaseQuery {
  sql: string;
  params?: any[];
  timeout?: number;
  cache?: boolean;
}

export interface DatabaseResult {
  rows: any[];
  columns: string[];
  rowCount: number;
  executionTime: number;
}

// ============================================================================
// Debug and Profiling
// ============================================================================

export interface ProfileResult {
  analyticalTime: number;
  creativeTime: number;
  empiricalTime: number;
  parallelizationEfficiency: number;
  memoryUsage: {
    peak: number;
    average: number;
  };
  bottlenecks: string[];
}

export interface DebugSession {
  agentId: string;
  query: string;
  traces: ExecutionTrace[];
  breakpoints: Map<string, boolean>;
  watchedVariables: Map<string, Vector>;
}

// ============================================================================
// Configuration
// ============================================================================

export interface AgentFrameworkConfig {
  vmConfig: {
    stackSizeMB: number;
    heapSizeMB: number;
    maxInstructions: number;
    maxThreads: number;
    enableDebug: boolean;
    enableProfiling: boolean;
  };
  cachingConfig: {
    enabled: boolean;
    maxSize: number;
    defaultTTL: number;
  };
  parallelConfig: {
    enabled: boolean;
    maxWorkers: number;
    timeout: number;
  };
  integrationConfig: {
    claudeAPIKey?: string;
    databaseURL?: string;
    externalAPIs?: Record<string, string>;
  };
}

// ============================================================================
// Error Types
// ============================================================================

export class AgentError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: any
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export class CompilationError extends AgentError {
  constructor(message: string, context?: any) {
    super('COMPILATION_ERROR', message, context);
    this.name = 'CompilationError';
  }
}

export class ExecutionError extends AgentError {
  constructor(message: string, context?: any) {
    super('EXECUTION_ERROR', message, context);
    this.name = 'ExecutionError';
  }
}

export class IntegrationError extends AgentError {
  constructor(message: string, context?: any) {
    super('INTEGRATION_ERROR', message, context);
    this.name = 'IntegrationError';
  }
}

export class CacheError extends AgentError {
  constructor(message: string, context?: any) {
    super('CACHE_ERROR', message, context);
    this.name = 'CacheError';
  }
}

// ============================================================================
// Query Analysis
// ============================================================================

export interface QueryAnalysis {
  queryType: 'logical' | 'creative' | 'empirical' | 'mixed';
  complexity: number; // 0-1
  keywords: string[];
  suggestedWeights: Weights;
  confidence: number;
}

export interface QueryClassifier {
  classify(query: string): QueryAnalysis;
}

// ============================================================================
// Utility Types
// ============================================================================

export type AsyncResult<T> = Promise<T>;
export type Result<T, E = Error> = T | E;
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
