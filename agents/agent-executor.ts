/**
 * MindLang Agent Executor
 * Execution engine for parallel path processing and ensemble combination
 * Approximately 300 lines
 */

import {
  Vector,
  ParallelResults,
  Weights,
  Critique,
  BytecodeProgram,
  CompiledAgent,
  ExecutionError,
  QueryAnalysis,
} from './types';
import { VirtualMachine } from '../src/vm';

// ============================================================================
// Execution Configuration
// ============================================================================

export interface ExecutionConfig {
  timeout: number;
  maxParallelTasks: number;
  enableProfiling: boolean;
  enableOptimization: boolean;
}

// ============================================================================
// Agent Executor
// ============================================================================

export class AgentExecutor {
  private vm: VirtualMachine;
  private config: ExecutionConfig;
  private executionCache: Map<string, any> = new Map();
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor(vm: VirtualMachine, config: Partial<ExecutionConfig> = {}) {
    this.vm = vm;
    this.config = {
      timeout: config.timeout || 30000,
      maxParallelTasks: config.maxParallelTasks || 4,
      enableProfiling: config.enableProfiling || false,
      enableOptimization: config.enableOptimization || true,
    };

    // Initialize metrics tracking
    this.performanceMetrics.set('analytical', []);
    this.performanceMetrics.set('creative', []);
    this.performanceMetrics.set('empirical', []);
  }

  /**
   * Execute three paths in parallel
   */
  async executeParallel(
    q: Vector,
    compiled: CompiledAgent
  ): Promise<ParallelResults> {
    const startTime = Date.now();

    try {
      // Execute all three paths concurrently
      const [analyticalResult, creativeResult, empiricalResult] = await Promise.all([
        this.executePathWithTimeout('analytical', q, compiled.analytical),
        this.executePathWithTimeout('creative', q, compiled.creative),
        this.executePathWithTimeout('empirical', q, compiled.empirical),
      ]);

      const totalTime = Date.now() - startTime;

      // Record metrics
      this.recordMetrics('analytical', analyticalResult.time);
      this.recordMetrics('creative', creativeResult.time);
      this.recordMetrics('empirical', empiricalResult.time);

      return {
        analytical: {
          result: analyticalResult.output,
          confidence: analyticalResult.confidence,
          time: analyticalResult.time,
        },
        creative: {
          result: creativeResult.output,
          confidence: creativeResult.confidence,
          time: creativeResult.time,
        },
        empirical: {
          result: empiricalResult.output,
          confidence: empiricalResult.confidence,
          time: empiricalResult.time,
        },
        totalTime,
      };
    } catch (error) {
      throw new ExecutionError(`Parallel execution failed: ${error}`, { error });
    }
  }

  /**
   * Execute single path with timeout
   */
  private async executePathWithTimeout(
    pathName: string,
    input: Vector,
    program: BytecodeProgram
  ): Promise<{
    output: Vector;
    confidence: number;
    time: number;
  }> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new ExecutionError(`Path ${pathName} execution timeout`, { pathName }));
      }, this.config.timeout);

      try {
        // Load program into VM
        this.vm.loadProgram(program);

        // Execute program
        const result = this.vm.execute();

        clearTimeout(timer);
        const executionTime = Date.now() - startTime;

        // Calculate confidence from result
        const confidence = this.calculatePathConfidence(result || [], pathName);

        resolve({
          output: result || [],
          confidence,
          time: executionTime,
        });
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Calculate confidence for each path
   */
  private calculatePathConfidence(result: Vector, pathType: string): number {
    if (result.length === 0) return 0;

    // Calculate norm
    const norm = Math.sqrt(result.reduce((sum, x) => sum + x * x, 0));
    const normalizedNorm = Math.min(1, norm / result.length);

    // Calculate sparsity
    const nonZeroCount = result.filter((x) => Math.abs(x) > 0.01).length;
    const density = nonZeroCount / result.length;

    // Path-specific confidence calculations
    switch (pathType) {
      case 'analytical':
        // Analytical prefers high magnitude and coherence
        return normalizedNorm * 0.7 + (1 - Math.abs(density - 0.5)) * 0.3;

      case 'creative':
        // Creative prefers diversity and coverage
        return Math.min(1, density * 1.2) * 0.6 + normalizedNorm * 0.4;

      case 'empirical':
        // Empirical prefers balanced coverage
        return (normalizedNorm + density) / 2;

      default:
        return normalizedNorm * 0.5 + density * 0.5;
    }
  }

  /**
   * Assess result quality from each path
   */
  async assessPathResults(
    results: ParallelResults
  ): Promise<{
    analytical: number;
    creative: number;
    empirical: number;
  }> {
    return {
      analytical: this.assessAnalytical(results.analytical.result),
      creative: this.assessCreative(results.creative.result),
      empirical: this.assessEmpirical(results.empirical.result),
    };
  }

  /**
   * Assess analytical path quality
   */
  private assessAnalytical(result: Vector): number {
    const norm = Math.sqrt(result.reduce((sum, x) => sum + x * x, 0));
    const stability = 1 - this.calculateVariance(result);
    const magnitude = Math.min(1, norm / result.length);

    return magnitude * 0.5 + stability * 0.5;
  }

  /**
   * Assess creative path quality
   */
  private assessCreative(result: Vector): number {
    const variance = this.calculateVariance(result);
    const entropy = this.calculateEntropy(result);
    const diversity = Math.min(1, variance + entropy) / 2;

    return diversity;
  }

  /**
   * Assess empirical path quality
   */
  private assessEmpirical(result: Vector): number {
    const norm = Math.sqrt(result.reduce((sum, x) => sum + x * x, 0));
    const consistency = 1 - this.calculateVariance(result);
    const magnitude = Math.min(1, norm / result.length);

    return (magnitude + consistency) / 2;
  }

  /**
   * Calculate variance of vector
   */
  private calculateVariance(vector: Vector): number {
    if (vector.length === 0) return 0;

    const mean = vector.reduce((a, b) => a + b, 0) / vector.length;
    const variance =
      vector.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / vector.length;

    return Math.min(1, variance);
  }

  /**
   * Calculate entropy of vector (as probability distribution)
   */
  private calculateEntropy(vector: Vector): number {
    if (vector.length === 0) return 0;

    // Normalize to probability distribution
    const max = Math.max(...vector, 0.1);
    const probs = vector.map((x) => Math.abs(x) / Math.abs(max));
    const sum = probs.reduce((a, b) => a + b, 0);
    const normalized = probs.map((p) => p / sum);

    // Calculate entropy: -sum(p * log(p))
    let entropy = 0;
    for (const p of normalized) {
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    return Math.min(1, entropy / Math.log2(vector.length));
  }

  /**
   * Compute adaptive weights based on query type and results
   */
  computeAdaptiveWeights(
    queryType: string,
    results: ParallelResults,
    confidences: {
      analytical: number;
      creative: number;
      empirical: number;
    }
  ): Weights {
    // Start with confidence scores
    const baseWeights = [
      confidences.analytical,
      confidences.creative,
      confidences.empirical,
    ];

    // Adjust based on query type
    let adjustments = [1, 1, 1];

    switch (queryType) {
      case 'logical':
        adjustments = [1.4, 0.8, 1.0]; // Emphasize analytical
        break;
      case 'creative':
        adjustments = [0.8, 1.4, 1.0]; // Emphasize creative
        break;
      case 'empirical':
        adjustments = [1.0, 0.8, 1.4]; // Emphasize empirical
        break;
      case 'mixed':
      default:
        adjustments = [1.0, 1.0, 1.0]; // Equal emphasis
        break;
    }

    // Apply adjustments
    const adjusted = baseWeights.map((w, i) => w * adjustments[i]);

    // Softmax normalization
    const exp = adjusted.map((x) => Math.exp(x));
    const sum = exp.reduce((a, b) => a + b, 0);
    const weights = exp.map((x) => x / sum);

    return {
      alpha: weights[0],
      beta: weights[1],
      gamma: weights[2],
      timestamp: Date.now(),
      adaptive: true,
    };
  }

  /**
   * Perform weighted ensemble combination
   */
  ensembleResults(
    weights: Weights,
    results: ParallelResults
  ): Vector {
    const { alpha, beta, gamma } = weights;
    const { analytical, creative, empirical } = results;

    const dim = Math.max(
      analytical.result.length,
      creative.result.length,
      empirical.result.length
    );

    const ensemble = new Array(dim).fill(0);

    for (let i = 0; i < dim; i++) {
      ensemble[i] =
        alpha * (analytical.result[i] || 0) +
        beta * (creative.result[i] || 0) +
        gamma * (empirical.result[i] || 0);
    }

    // Normalize
    const norm = Math.sqrt(ensemble.reduce((sum, x) => sum + x * x, 0));
    return norm > 0 ? ensemble.map((x) => x / norm) : ensemble;
  }

  /**
   * Self-critique ensemble result
   */
  async selfCritique(
    ensemble: Vector,
    originalQuery: string
  ): Promise<Critique> {
    // Assess confidence
    const norm = Math.sqrt(ensemble.reduce((sum, x) => sum + x * x, 0));
    const confidence = Math.min(1, Math.tanh(norm / ensemble.length));

    // Identify strengths
    const strengths: string[] = [];
    if (confidence > 0.75) {
      strengths.push('High confidence ensemble');
    }
    if (norm > 0.8) {
      strengths.push('Strong signal coherence');
    }

    // Identify weaknesses
    const weaknesses: string[] = [];
    const sparsity = ensemble.filter((x) => Math.abs(x) < 0.1).length / ensemble.length;

    if (sparsity > 0.7) {
      weaknesses.push('Sparse representation may indicate incomplete reasoning');
    }
    if (confidence < 0.6) {
      weaknesses.push('Low confidence - may need refinement');
    }

    // Generate feedback
    const feedback =
      weaknesses.length > 0
        ? weaknesses.map((w) => w.toLowerCase()).join('; ')
        : 'Response is well-reasoned and coherent';

    // Determine if retry is needed
    const shouldRetry = confidence < 0.7 || sparsity > 0.65;

    // Determine retry strategy
    let retryStrategy = undefined;
    if (shouldRetry) {
      if (confidence < 0.5) {
        retryStrategy = 'expand_depth';
      } else if (sparsity > 0.65) {
        retryStrategy = 'increase_coverage';
      } else {
        retryStrategy = 'refine_weights';
      }
    }

    const score = (confidence * 60 + (1 - sparsity) * 40);

    return {
      confidence,
      strengths,
      weaknesses,
      feedback,
      shouldRetry,
      retryStrategy,
      score,
    };
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(pathName: string, time: number): void {
    const metrics = this.performanceMetrics.get(pathName) || [];
    metrics.push(time);

    // Keep last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }

    this.performanceMetrics.set(pathName, metrics);
  }

  /**
   * Get average execution time for a path
   */
  getAveragePathTime(pathName: string): number {
    const metrics = this.performanceMetrics.get(pathName) || [];
    if (metrics.length === 0) return 0;

    return metrics.reduce((a, b) => a + b, 0) / metrics.length;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): Record<string, {
    average: number;
    min: number;
    max: number;
    count: number;
  }> {
    const stats: any = {};

    for (const [pathName, metrics] of this.performanceMetrics) {
      if (metrics.length > 0) {
        stats[pathName] = {
          average: metrics.reduce((a, b) => a + b, 0) / metrics.length,
          min: Math.min(...metrics),
          max: Math.max(...metrics),
          count: metrics.length,
        };
      }
    }

    return stats;
  }

  /**
   * Clear performance cache
   */
  clearCache(): void {
    this.executionCache.clear();
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.performanceMetrics.forEach((m) => m.length = 0);
  }
}

export default AgentExecutor;
