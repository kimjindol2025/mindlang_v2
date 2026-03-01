/**
 * MindLang Agent Framework - Main Runtime
 * Orchestrates agent execution with 3-path ensemble and adaptive refinement
 * Approximately 600 lines
 */

import { VirtualMachine, VMConfig } from '../src/vm';
import {
  AgentState,
  AgentResponse,
  Weights,
  Critique,
  ParallelResults,
  Vector,
  ExecutionMetrics,
  ExecutionTrace,
  CompiledAgent,
  AgentFrameworkConfig,
  QueryAnalysis,
} from './types';

// ============================================================================
// MindLang Agent Core Runtime
// ============================================================================

export class MindLangAgent {
  private state: AgentState;
  private vm: VirtualMachine;
  private mindlangProgram: string;
  private executionTraces: ExecutionTrace[] = [];
  private config: AgentFrameworkConfig;
  private cache: Map<string, AgentResponse> = new Map();
  private metrics: ExecutionMetrics | null = null;

  /**
   * Initialize MindLang Agent
   */
  constructor(
    mindlangPath: string,
    config: AgentFrameworkConfig
  ) {
    this.config = config;
    this.vm = new VirtualMachine(config.vmConfig);
    this.mindlangProgram = this.loadMindLangFile(mindlangPath);
    this.state = {
      id: `agent-${Date.now()}`,
      status: 'idle',
      currentQuery: '',
      iteration: 0,
      timestamp: Date.now(),
      metadata: new Map(),
    };
  }

  /**
   * Load MindLang program from file
   */
  private loadMindLangFile(path: string): string {
    // In real implementation, read from filesystem
    // For now, return placeholder
    return `
      agent MindLangv1 {
        encode(q) -> z
        analytical(z) -> z_a
        creative(z) -> z_b
        empirical(z) -> z_c
        weights(z) -> [α, β, γ]
        ensemble(z_a, z_b, z_c, weights) -> z_ens
        critique(z_ens) -> δ
        sample(z_ens) -> output
      }
    `;
  }

  /**
   * Main agent execution: think about a query
   * Orchestrates the complete 3-path pipeline with adaptive refinement
   */
  async think(query: string): Promise<AgentResponse> {
    const startTime = Date.now();
    this.state.currentQuery = query;
    this.state.status = 'thinking';
    this.state.iteration = 0;

    try {
      // Check cache first
      const cacheKey = this.getCacheKey(query);
      const cached = this.cache.get(cacheKey);
      if (cached && this.config.cachingConfig.enabled) {
        return { ...cached, metadata: { ...cached.metadata, cacheUsed: true } };
      }

      // Step 1: Compile MindLang program to bytecode
      const bytecode = await this.compileToMindLang(this.mindlangProgram);

      // Step 2: Encode query to vector
      const encodedQuery = this.encodeQuery(query);
      this.recordTrace('query_encoding', encodedQuery);

      // Step 3: VM base execution
      const z = await this.executeVMBase(bytecode, encodedQuery);
      this.recordTrace('vm_base_execution', z);

      // Step 4: Execute 3 paths in parallel
      const parallelResults = await this.executeParallelPaths(z);
      this.recordTrace('parallel_paths', parallelResults);

      // Step 5: Compute adaptive weights
      const queryAnalysis = this.analyzeQuery(query);
      const weights = this.computeAdaptiveWeights(parallelResults, queryAnalysis);
      this.recordTrace('adaptive_weights', weights);

      // Step 6: Ensemble the results
      const ensemble = this.weightedEnsemble(weights, parallelResults);
      this.recordTrace('ensemble', ensemble);

      // Step 7: Self-critique the response
      const critique = await this.selfCritique(ensemble, query);
      this.recordTrace('self_critique', critique);

      // Step 8: Determine if response is sufficient or needs refinement
      if (critique.confidence > this.config.vmConfig.maxInstructions && !critique.shouldRetry) {
        // Response is good, proceed to sampling
        const finalResponse = await this.sampleOutput(ensemble, weights);
        const response: AgentResponse = {
          response: finalResponse,
          confidence: critique.confidence,
          responseType: 'final',
          reasoning: {
            analytical: parallelResults.analytical.result,
            creative: parallelResults.creative.result,
            empirical: parallelResults.empirical.result,
            weights: weights,
            critique: critique,
            ensemble: ensemble,
          },
          metadata: {
            executionTime: Date.now() - startTime,
            iterations: this.state.iteration,
            cacheUsed: false,
            refinements: 0,
          },
        };

        // Cache the response
        this.cache.set(cacheKey, response);
        this.state.status = 'completed';
        return response;
      } else {
        // Response needs refinement or low confidence
        return await this.retryWithFeedback(query, critique, startTime);
      }
    } catch (error) {
      this.state.status = 'error';
      throw error;
    }
  }

  /**
   * Retry with feedback from critique
   */
  private async retryWithFeedback(
    originalQuery: string,
    critique: Critique,
    startTime: number
  ): Promise<AgentResponse> {
    this.state.iteration++;

    if (this.state.iteration >= 3) {
      // Max retries reached, return best effort response
      return {
        response: `[Refined] ${originalQuery}`,
        confidence: critique.confidence,
        responseType: 'intermediate',
        reasoning: {
          analytical: [],
          creative: [],
          empirical: [],
          weights: { alpha: 0.33, beta: 0.33, gamma: 0.34, timestamp: Date.now(), adaptive: false },
          critique: critique,
          ensemble: [],
        },
        metadata: {
          executionTime: Date.now() - startTime,
          iterations: this.state.iteration,
          cacheUsed: false,
          refinements: this.state.iteration,
        },
      };
    }

    // Construct improved query with feedback
    const feedbackPrompt = `${originalQuery}\n[Feedback: ${critique.feedback}]\n[Strategy: ${critique.retryStrategy}]`;

    // Recursively call think with improved query
    const response = await this.think(feedbackPrompt);
    return {
      ...response,
      responseType: 'refined',
      metadata: {
        ...response.metadata,
        refinements: this.state.iteration,
      },
    };
  }

  /**
   * Compile MindLang to bytecode
   */
  private async compileToMindLang(program: string): Promise<CompiledAgent> {
    // Placeholder: In real implementation, use the compiler
    return {
      analytical: {
        instructions: [],
        constants: new Map(),
        entryPoint: 0,
        exitPoint: 0,
      },
      creative: {
        instructions: [],
        constants: new Map(),
        entryPoint: 0,
        exitPoint: 0,
      },
      empirical: {
        instructions: [],
        constants: new Map(),
        entryPoint: 0,
        exitPoint: 0,
      },
      weights: {
        adaptiveMode: true,
        initialWeights: [0.33, 0.33, 0.34],
        updateStrategy: 'softmax',
        learningRate: 0.1,
      },
      critique: {
        confidenceThreshold: 0.8,
        retryLimit: 3,
        refinementStrategies: ['expand', 'clarify', 'verify'],
        selfCheckEnabled: true,
      },
      metadata: {
        name: 'MindLangv1',
        version: '1.0.0',
        author: 'MindLang Team',
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        description: 'Multi-path reasoning agent',
      },
    };
  }

  /**
   * Encode query string to vector representation
   */
  private encodeQuery(query: string): Vector {
    // Simple encoding: convert each character to numeric value
    const encoded = query
      .split('')
      .map((c) => c.charCodeAt(0) / 256)
      .slice(0, 768); // Fixed dimension (768 for compatibility)

    // Pad to 768 dimensions
    while (encoded.length < 768) {
      encoded.push(0);
    }

    return encoded;
  }

  /**
   * Execute VM base layer
   */
  private async executeVMBase(bytecode: CompiledAgent, query: Vector): Promise<Vector> {
    // Simulate VM execution
    // z = ENCODE(q) = W_enc · q + b_enc
    const dimension = 768;
    const z = new Array(dimension).fill(0);

    for (let i = 0; i < dimension; i++) {
      let sum = Math.random() * 0.1; // Random bias
      for (let j = 0; j < Math.min(query.length, 100); j++) {
        sum += query[j] * Math.sin(i + j) * 0.01;
      }
      z[i] = Math.tanh(sum);
    }

    return z;
  }

  /**
   * Execute 3 paths in parallel
   */
  private async executeParallelPaths(z: Vector): Promise<ParallelResults> {
    const startTime = Date.now();

    // Parallel execution of 3 paths
    const [analytical, creative, empirical] = await Promise.all([
      this.executeAnalyticalPath(z),
      this.executeCreativePath(z),
      this.executeEmpiricalPath(z),
    ]);

    const totalTime = Date.now() - startTime;

    return {
      analytical: {
        result: analytical,
        confidence: this.assessConfidence(analytical, 'analytical'),
        time: totalTime / 3,
      },
      creative: {
        result: creative,
        confidence: this.assessConfidence(creative, 'creative'),
        time: totalTime / 3,
      },
      empirical: {
        result: empirical,
        confidence: this.assessConfidence(empirical, 'empirical'),
        time: totalTime / 3,
      },
      totalTime: totalTime,
    };
  }

  /**
   * Analytical path: logical reasoning
   */
  private async executeAnalyticalPath(z: Vector): Promise<Vector> {
    const result = new Array(z.length);
    for (let i = 0; i < z.length; i++) {
      result[i] = Math.max(0, z[i]); // ReLU: focus on positive aspects
    }
    return result;
  }

  /**
   * Creative path: lateral thinking with noise
   */
  private async executeCreativePath(z: Vector): Promise<Vector> {
    const result = new Array(z.length);
    for (let i = 0; i < z.length; i++) {
      const noise = (Math.random() - 0.5) * 0.2;
      result[i] = Math.tanh(z[i] + noise); // Add controlled randomness
    }
    return result;
  }

  /**
   * Empirical path: evidence-based reasoning
   */
  private async executeEmpiricalPath(z: Vector): Promise<Vector> {
    const result = new Array(z.length);
    for (let i = 0; i < z.length; i++) {
      result[i] = z[i] > 0 ? 1 / (1 + Math.exp(-z[i])) : 0; // Sigmoid + threshold
    }
    return result;
  }

  /**
   * Assess confidence for each path
   */
  private assessConfidence(result: Vector, pathType: string): number {
    const norm = Math.sqrt(result.reduce((sum, x) => sum + x * x, 0));
    const sparsity = result.filter((x) => Math.abs(x) < 0.1).length / result.length;

    // Different paths value different properties
    switch (pathType) {
      case 'analytical':
        return Math.min(1, norm / result.length); // Prefers magnitude
      case 'creative':
        return Math.min(1, (1 - sparsity) * 0.9); // Prefers density
      case 'empirical':
        return Math.min(1, norm / result.length * 1.1); // Balanced
      default:
        return 0.5;
    }
  }

  /**
   * Analyze query to determine characteristics
   */
  private analyzeQuery(query: string): QueryAnalysis {
    const logicalKeywords = ['if', 'then', 'prove', 'logic', 'reason', 'because'];
    const creativeKeywords = ['imagine', 'create', 'design', 'novel', 'unique', 'original'];
    const empiricalKeywords = ['data', 'evidence', 'fact', 'research', 'study', 'observe'];

    let logicalScore = 0,
      creativeScore = 0,
      empiricalScore = 0;
    const lowerQuery = query.toLowerCase();

    for (const kw of logicalKeywords) {
      if (lowerQuery.includes(kw)) logicalScore += 1;
    }
    for (const kw of creativeKeywords) {
      if (lowerQuery.includes(kw)) creativeScore += 1;
    }
    for (const kw of empiricalKeywords) {
      if (lowerQuery.includes(kw)) empiricalScore += 1;
    }

    const total = logicalScore + creativeScore + empiricalScore;
    const max = Math.max(logicalScore, creativeScore, empiricalScore);

    let queryType: 'logical' | 'creative' | 'empirical' | 'mixed' = 'mixed';
    if (max === logicalScore && logicalScore > 0) queryType = 'logical';
    else if (max === creativeScore && creativeScore > 0) queryType = 'creative';
    else if (max === empiricalScore && empiricalScore > 0) queryType = 'empirical';

    return {
      queryType,
      complexity: Math.min(1, query.length / 500),
      keywords: [
        ...logicalKeywords.filter((kw) => lowerQuery.includes(kw)),
        ...creativeKeywords.filter((kw) => lowerQuery.includes(kw)),
        ...empiricalKeywords.filter((kw) => lowerQuery.includes(kw)),
      ],
      suggestedWeights: {
        alpha: logicalScore / (total || 1),
        beta: creativeScore / (total || 1),
        gamma: empiricalScore / (total || 1),
        timestamp: Date.now(),
        adaptive: true,
      },
      confidence: Math.min(1, total * 0.25),
    };
  }

  /**
   * Compute adaptive weights based on query and path results
   */
  private computeAdaptiveWeights(
    results: ParallelResults,
    analysis: QueryAnalysis
  ): Weights {
    // Combine suggested weights with confidence scores
    const analyticalWeight =
      analysis.suggestedWeights.alpha * 0.5 + results.analytical.confidence * 0.5;
    const creativeWeight =
      analysis.suggestedWeights.beta * 0.5 + results.creative.confidence * 0.5;
    const empiricalWeight =
      analysis.suggestedWeights.gamma * 0.5 + results.empirical.confidence * 0.5;

    // Softmax normalization
    const exp = [
      Math.exp(analyticalWeight),
      Math.exp(creativeWeight),
      Math.exp(empiricalWeight),
    ];
    const sum = exp.reduce((a, b) => a + b, 0);

    return {
      alpha: exp[0] / sum,
      beta: exp[1] / sum,
      gamma: exp[2] / sum,
      timestamp: Date.now(),
      adaptive: true,
    };
  }

  /**
   * Weighted ensemble combining all paths
   */
  private weightedEnsemble(weights: Weights, results: ParallelResults): Vector {
    const { alpha, beta, gamma } = weights;
    const dimension = results.analytical.result.length;
    const ensemble = new Array(dimension);

    for (let i = 0; i < dimension; i++) {
      ensemble[i] =
        alpha * results.analytical.result[i] +
        beta * results.creative.result[i] +
        gamma * results.empirical.result[i];
    }

    // Normalize
    const norm = Math.sqrt(ensemble.reduce((sum, x) => sum + x * x, 0));
    return norm > 0 ? ensemble.map((x) => x / norm) : ensemble;
  }

  /**
   * Self-critique: evaluate response quality
   */
  private async selfCritique(ensemble: Vector, query: string): Promise<Critique> {
    // Assess confidence
    const norm = Math.sqrt(ensemble.reduce((sum, x) => sum + x * x, 0));
    const confidence = Math.tanh(norm / ensemble.length);

    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (confidence > 0.7) {
      strengths.push('High output coherence');
    } else {
      weaknesses.push('Low output confidence');
    }

    const sparsity = ensemble.filter((x) => Math.abs(x) < 0.1).length / ensemble.length;
    if (sparsity < 0.3) {
      strengths.push('Dense representation');
    } else {
      weaknesses.push('Sparse representation suggests incomplete reasoning');
    }

    const feedback = weaknesses.length > 0 ? weaknesses[0] : 'Response is well-reasoned';
    const shouldRetry = confidence < 0.8 && weaknesses.length > 1;

    return {
      confidence,
      strengths,
      weaknesses,
      feedback,
      shouldRetry,
      retryStrategy: shouldRetry ? 'expand_reasoning' : undefined,
      score: (confidence * 0.6 + (1 - sparsity) * 0.4) * 100,
    };
  }

  /**
   * Sample output from ensemble
   */
  private async sampleOutput(ensemble: Vector, weights: Weights): Promise<string> {
    // Convert ensemble vector back to text
    return this.detokenizeVector(ensemble);
  }

  /**
   * Convert vector to text representation
   */
  private detokenizeVector(vector: Vector): string {
    // Map vector values to character indices
    const chars = vector
      .slice(0, 100)
      .map((v) => {
        const charCode = Math.round(Math.abs(v) * 255) % 128;
        return String.fromCharCode(charCode);
      })
      .filter((c) => c !== '\0')
      .join('');

    return chars || 'Output generated by ensemble';
  }

  /**
   * Record execution trace
   */
  private recordTrace(stage: string, data: any): void {
    this.executionTraces.push({
      timestamp: Date.now(),
      stage,
      duration: 0,
      data,
    });
  }

  /**
   * Cache key generation
   */
  private getCacheKey(query: string): string {
    return `query:${query.slice(0, 50)}:${query.length}`;
  }

  /**
   * Get current state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Get execution traces
   */
  getTraces(): ExecutionTrace[] {
    return [...this.executionTraces];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get metrics
   */
  getMetrics(): ExecutionMetrics | null {
    return this.metrics ? { ...this.metrics } : null;
  }
}

export default MindLangAgent;
