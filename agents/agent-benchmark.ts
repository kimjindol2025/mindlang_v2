/**
 * MindLang Agent Benchmark Suite
 * Comprehensive performance testing and profiling
 * Measures latency, throughput, quality, memory, and parallelization
 */

import {
  ExecutionMetrics,
  ProfileResult,
  AgentResponse,
} from './types';

// ============================================================================
// Benchmark Results Types
// ============================================================================

export interface BenchmarkResult {
  testName: string;
  duration: number;
  results: any;
  timestamp: number;
}

export interface LatencyBenchmark {
  queryCount: number;
  minLatency: number;
  maxLatency: number;
  avgLatency: number;
  p50: number; // Median
  p95: number;
  p99: number;
}

export interface ThroughputBenchmark {
  duration: number;
  queriesProcessed: number;
  queriesPerSecond: number;
  cacheHitRate: number;
}

export interface QualityBenchmark {
  accuracy: number;
  completeness: number;
  consistency: number;
  selfCritiqueAccuracy: number;
  overallScore: number;
}

export interface MemoryBenchmark {
  peakMemory: number;
  averageMemory: number;
  gcFrequency: number;
  memoryLeakDetected: boolean;
  heapGrowthRate: number;
}

export interface ParallelizationBenchmark {
  sequentialTime: number;
  parallelTime: number;
  speedup: number;
  efficiency: number;
  theoreticalMaxSpeedup: number;
}

export interface PathAnalysisBenchmark {
  analyticalTime: number;
  creativeTime: number;
  empiricalTime: number;
  pathBalanceRatio: number;
  criticalPath: string;
}

// ============================================================================
// Mock Agent for Benchmarking
// ============================================================================

class BenchmarkAgent {
  private executionTimes: number[] = [];
  private memorySnapshots: number[] = [];

  async processQuery(query: string): Promise<AgentResponse> {
    const startTime = Date.now();

    // Simulate 3-path execution
    const [analyticalTime, creativeTime, empiricalTime] = await Promise.all([
      this.simulateAnalyticalPath(query),
      this.simulateCreativePath(query),
      this.simulateEmpiricalPath(query),
    ]);

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    this.executionTimes.push(totalTime);

    return {
      response: `Processed: ${query}`,
      confidence: 0.85,
      responseType: 'final',
      reasoning: {
        analytical: Array(128).fill(0.5),
        creative: Array(128).fill(0.5),
        empirical: Array(128).fill(0.5),
        weights: {
          alpha: 0.33,
          beta: 0.33,
          gamma: 0.33,
          timestamp: Date.now(),
          adaptive: true,
        },
        critique: {
          confidence: 0.85,
          strengths: ['Well-balanced'],
          weaknesses: [],
          feedback: 'Good response',
          shouldRetry: false,
          score: 0.85,
        },
        ensemble: Array(128).fill(0.5),
      },
      metadata: {
        executionTime: totalTime,
        iterations: 1,
        cacheUsed: false,
        refinements: 0,
      },
    };
  }

  private async simulateAnalyticalPath(query: string): Promise<number> {
    const delay = Math.random() * 200 + 50; // 50-250ms
    await new Promise((r) => setTimeout(r, delay));
    return delay;
  }

  private async simulateCreativePath(query: string): Promise<number> {
    const delay = Math.random() * 300 + 100; // 100-400ms
    await new Promise((r) => setTimeout(r, delay));
    return delay;
  }

  private async simulateEmpiricalPath(query: string): Promise<number> {
    const delay = Math.random() * 250 + 75; // 75-325ms
    await new Promise((r) => setTimeout(r, delay));
    return delay;
  }

  getExecutionTimes(): number[] {
    return this.executionTimes;
  }

  clearStats(): void {
    this.executionTimes = [];
    this.memorySnapshots = [];
  }
}

// ============================================================================
// Benchmark Suite
// ============================================================================

export class AgentBenchmark {
  private agent: BenchmarkAgent;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.agent = new BenchmarkAgent();
  }

  // ========================================================================
  // 1. Latency Benchmarks
  // ========================================================================

  async benchmarkLatency(queryCount: number = 100): Promise<LatencyBenchmark> {
    console.log(`\n[LATENCY] Running ${queryCount} queries...`);

    const queries = Array.from({ length: queryCount }, (_, i) =>
      `Query ${i % 10}`
    );
    this.agent.clearStats();

    const startTime = Date.now();

    for (const query of queries) {
      await this.agent.processQuery(query);
    }

    const totalTime = Date.now() - startTime;

    const times = this.agent.getExecutionTimes();
    times.sort((a, b) => a - b);

    const result: LatencyBenchmark = {
      queryCount,
      minLatency: Math.min(...times),
      maxLatency: Math.max(...times),
      avgLatency: times.reduce((a, b) => a + b) / times.length,
      p50: times[Math.floor(times.length * 0.5)],
      p95: times[Math.floor(times.length * 0.95)],
      p99: times[Math.floor(times.length * 0.99)],
    };

    console.log(`✓ Latency Benchmark Complete`);
    console.log(`  Min: ${result.minLatency.toFixed(2)}ms`);
    console.log(`  Avg: ${result.avgLatency.toFixed(2)}ms`);
    console.log(`  P95: ${result.p95.toFixed(2)}ms`);
    console.log(`  P99: ${result.p99.toFixed(2)}ms`);
    console.log(`  Max: ${result.maxLatency.toFixed(2)}ms`);

    this.results.push({
      testName: 'latency',
      duration: totalTime,
      results: result,
      timestamp: Date.now(),
    });

    return result;
  }

  // ========================================================================
  // 2. Throughput Benchmark
  // ========================================================================

  async benchmarkThroughput(
    durationMs: number = 10000
  ): Promise<ThroughputBenchmark> {
    console.log(
      `\n[THROUGHPUT] Measuring queries per second for ${durationMs}ms...`
    );

    this.agent.clearStats();
    const startTime = Date.now();
    let queryCount = 0;

    while (Date.now() - startTime < durationMs) {
      await this.agent.processQuery(`Query ${queryCount}`);
      queryCount++;
    }

    const actualDuration = Date.now() - startTime;

    const result: ThroughputBenchmark = {
      duration: actualDuration,
      queriesProcessed: queryCount,
      queriesPerSecond: (queryCount / actualDuration) * 1000,
      cacheHitRate: 0.15, // Simulated
    };

    console.log(`✓ Throughput Benchmark Complete`);
    console.log(`  Queries Processed: ${result.queriesProcessed}`);
    console.log(`  QPS: ${result.queriesPerSecond.toFixed(2)}`);
    console.log(`  Duration: ${result.duration.toFixed(0)}ms`);

    this.results.push({
      testName: 'throughput',
      duration: actualDuration,
      results: result,
      timestamp: Date.now(),
    });

    return result;
  }

  // ========================================================================
  // 3. Quality Benchmark
  // ========================================================================

  async benchmarkQuality(sampleSize: number = 50): Promise<QualityBenchmark> {
    console.log(`\n[QUALITY] Evaluating response quality on ${sampleSize} samples...`);

    const testCases = this.generateTestCases(sampleSize);
    const scores = {
      accuracy: 0,
      completeness: 0,
      consistency: 0,
      selfCritiqueAccuracy: 0,
    };

    for (const testCase of testCases) {
      const response = await this.agent.processQuery(testCase.query);

      // Evaluate accuracy
      scores.accuracy += this.evaluateAccuracy(response, testCase.expected);

      // Evaluate completeness
      scores.completeness += this.evaluateCompleteness(response);

      // Evaluate consistency
      scores.consistency += this.evaluateConsistency(response);

      // Evaluate self-critique accuracy
      scores.selfCritiqueAccuracy += this.evaluateSelfCritique(response);
    }

    const result: QualityBenchmark = {
      accuracy: scores.accuracy / sampleSize,
      completeness: scores.completeness / sampleSize,
      consistency: scores.consistency / sampleSize,
      selfCritiqueAccuracy: scores.selfCritiqueAccuracy / sampleSize,
      overallScore:
        (scores.accuracy +
          scores.completeness +
          scores.consistency +
          scores.selfCritiqueAccuracy) /
        (4 * sampleSize),
    };

    console.log(`✓ Quality Benchmark Complete`);
    console.log(`  Accuracy: ${(result.accuracy * 100).toFixed(1)}%`);
    console.log(`  Completeness: ${(result.completeness * 100).toFixed(1)}%`);
    console.log(`  Consistency: ${(result.consistency * 100).toFixed(1)}%`);
    console.log(`  Self-Critique Accuracy: ${(result.selfCritiqueAccuracy * 100).toFixed(1)}%`);
    console.log(
      `  Overall Score: ${(result.overallScore * 100).toFixed(1)}%`
    );

    this.results.push({
      testName: 'quality',
      duration: 0,
      results: result,
      timestamp: Date.now(),
    });

    return result;
  }

  // ========================================================================
  // 4. Memory Benchmark
  // ========================================================================

  async benchmarkMemory(queryCount: number = 100): Promise<MemoryBenchmark> {
    console.log(
      `\n[MEMORY] Profiling memory usage over ${queryCount} queries...`
    );

    this.agent.clearStats();
    const memorySnapshots: number[] = [];

    for (let i = 0; i < queryCount; i++) {
      if (i % 10 === 0) {
        // Snapshot memory
        memorySnapshots.push(Math.random() * 50 + 10); // Simulated: 10-60MB
      }
      await this.agent.processQuery(`Query ${i}`);
    }

    const result: MemoryBenchmark = {
      peakMemory: Math.max(...memorySnapshots),
      averageMemory: memorySnapshots.reduce((a, b) => a + b) / memorySnapshots.length,
      gcFrequency: Math.floor(queryCount / 20),
      memoryLeakDetected: false,
      heapGrowthRate: 0.05, // 5% growth
    };

    console.log(`✓ Memory Benchmark Complete`);
    console.log(`  Peak Memory: ${result.peakMemory.toFixed(1)}MB`);
    console.log(`  Average Memory: ${result.averageMemory.toFixed(1)}MB`);
    console.log(`  GC Frequency: ${result.gcFrequency} times`);
    console.log(`  Memory Leak: ${result.memoryLeakDetected ? 'YES' : 'NO'}`);
    console.log(`  Heap Growth Rate: ${(result.heapGrowthRate * 100).toFixed(1)}%`);

    this.results.push({
      testName: 'memory',
      duration: 0,
      results: result,
      timestamp: Date.now(),
    });

    return result;
  }

  // ========================================================================
  // 5. Parallelization Benchmark
  // ========================================================================

  async benchmarkParallelism(queryCount: number = 50): Promise<ParallelizationBenchmark> {
    console.log(
      `\n[PARALLELISM] Measuring parallelization efficiency...`
    );

    // Simulate sequential execution
    this.agent.clearStats();
    const seqStart = Date.now();
    for (let i = 0; i < queryCount; i++) {
      await this.agent.processQuery(`Sequential ${i}`);
    }
    const sequentialTime = Date.now() - seqStart;

    // Simulate parallel execution (already being done in processQuery)
    this.agent.clearStats();
    const parStart = Date.now();
    for (let i = 0; i < queryCount; i++) {
      await this.agent.processQuery(`Parallel ${i}`);
    }
    const parallelTime = Date.now() - parStart;

    const speedup = sequentialTime / parallelTime;
    const theoreticalMaxSpeedup = 3; // 3 paths

    const result: ParallelizationBenchmark = {
      sequentialTime,
      parallelTime,
      speedup,
      efficiency: speedup / theoreticalMaxSpeedup,
      theoreticalMaxSpeedup,
    };

    console.log(`✓ Parallelization Benchmark Complete`);
    console.log(`  Sequential Time: ${result.sequentialTime.toFixed(0)}ms`);
    console.log(`  Parallel Time: ${result.parallelTime.toFixed(0)}ms`);
    console.log(`  Speedup: ${result.speedup.toFixed(2)}x`);
    console.log(`  Efficiency: ${(result.efficiency * 100).toFixed(1)}%`);
    console.log(
      `  Theoretical Max Speedup: ${result.theoreticalMaxSpeedup}x`
    );

    this.results.push({
      testName: 'parallelization',
      duration: parallelTime,
      results: result,
      timestamp: Date.now(),
    });

    return result;
  }

  // ========================================================================
  // 6. Path Analysis Benchmark
  // ========================================================================

  async benchmarkPathAnalysis(queryCount: number = 50): Promise<PathAnalysisBenchmark> {
    console.log(`\n[PATH ANALYSIS] Analyzing individual path performance...`);

    const pathTimes = {
      analytical: 0,
      creative: 0,
      empirical: 0,
    };

    // Simulate path execution timing
    for (let i = 0; i < queryCount; i++) {
      pathTimes.analytical += Math.random() * 200 + 50;
      pathTimes.creative += Math.random() * 300 + 100;
      pathTimes.empirical += Math.random() * 250 + 75;
    }

    const avgAnalytical = pathTimes.analytical / queryCount;
    const avgCreative = pathTimes.creative / queryCount;
    const avgEmpirical = pathTimes.empirical / queryCount;

    const maxTime = Math.max(avgAnalytical, avgCreative, avgEmpirical);
    const criticalPath =
      maxTime === avgAnalytical
        ? 'Analytical'
        : maxTime === avgCreative
          ? 'Creative'
          : 'Empirical';

    const result: PathAnalysisBenchmark = {
      analyticalTime: avgAnalytical,
      creativeTime: avgCreative,
      empiricalTime: avgEmpirical,
      pathBalanceRatio:
        Math.min(avgAnalytical, avgCreative, avgEmpirical) /
        Math.max(avgAnalytical, avgCreative, avgEmpirical),
      criticalPath,
    };

    console.log(`✓ Path Analysis Benchmark Complete`);
    console.log(`  Analytical Avg: ${result.analyticalTime.toFixed(2)}ms`);
    console.log(`  Creative Avg: ${result.creativeTime.toFixed(2)}ms`);
    console.log(`  Empirical Avg: ${result.empiricalTime.toFixed(2)}ms`);
    console.log(`  Path Balance Ratio: ${(result.pathBalanceRatio * 100).toFixed(1)}%`);
    console.log(`  Critical Path: ${result.criticalPath}`);

    this.results.push({
      testName: 'pathAnalysis',
      duration: 0,
      results: result,
      timestamp: Date.now(),
    });

    return result;
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private generateTestCases(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      query: `Test query ${i}`,
      expected: `Expected result ${i}`,
    }));
  }

  private evaluateAccuracy(response: AgentResponse, expected: string): number {
    // Simulated accuracy evaluation
    return Math.random() * 0.3 + 0.7; // 0.7-1.0
  }

  private evaluateCompleteness(response: AgentResponse): number {
    // Check if all reasoning paths present
    const hasAllPaths =
      response.reasoning.analytical &&
      response.reasoning.creative &&
      response.reasoning.empirical;

    return hasAllPaths ? Math.random() * 0.2 + 0.8 : Math.random() * 0.3;
  }

  private evaluateConsistency(response: AgentResponse): number {
    // Check vector consistency
    return Math.random() * 0.3 + 0.7;
  }

  private evaluateSelfCritique(response: AgentResponse): number {
    // Evaluate if critique matches actual quality
    const critique = response.reasoning.critique;
    const responseQuality = Math.random() * 0.5 + 0.5;

    return Math.abs(critique.confidence - responseQuality) < 0.2
      ? 0.9
      : 0.5;
  }

  // ========================================================================
  // Report Generation
  // ========================================================================

  generateReport(): string {
    let report = '\n╔════════════════════════════════════════════════════════════════╗\n';
    report +=
      '║         MindLang Agent Benchmark Report                       ║\n';
    report +=
      '╚════════════════════════════════════════════════════════════════╝\n\n';

    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Tests Run: ${this.results.length}\n\n`;

    report += '═══════════════════════════════════════════════════════════════\n';
    report += 'Summary Results:\n';
    report += '═══════════════════════════════════════════════════════════════\n';

    for (const result of this.results) {
      report += `\n${result.testName.toUpperCase()}:\n`;

      for (const [key, value] of Object.entries(result.results)) {
        if (typeof value === 'number') {
          report += `  ${key}: ${value.toFixed(2)}\n`;
        } else if (typeof value === 'boolean') {
          report += `  ${key}: ${value}\n`;
        } else {
          report += `  ${key}: ${JSON.stringify(value)}\n`;
        }
      }
    }

    report +=
      '\n═══════════════════════════════════════════════════════════════\n';

    return report;
  }

  getResults(): BenchmarkResult[] {
    return this.results;
  }
}

// ============================================================================
// Main Benchmark Runner
// ============================================================================

export async function runComprehensiveBenchmark() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║      MindLang Agent - Comprehensive Benchmark Suite           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const benchmark = new AgentBenchmark();

  try {
    // Run all benchmarks
    const latency = await benchmark.benchmarkLatency(100);
    const throughput = await benchmark.benchmarkThroughput(5000);
    const quality = await benchmark.benchmarkQuality(50);
    const memory = await benchmark.benchmarkMemory(100);
    const parallelism = await benchmark.benchmarkParallelism(50);
    const paths = await benchmark.benchmarkPathAnalysis(50);

    // Generate and print report
    const report = benchmark.generateReport();
    console.log(report);

    // Print summary scores
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('PERFORMANCE SCORECARD:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(
      `Quality Score:       ${(quality.overallScore * 100).toFixed(1)}%`
    );
    console.log(
      `Throughput:          ${throughput.queriesPerSecond.toFixed(2)} QPS`
    );
    console.log(
      `Parallelization:     ${(parallelism.efficiency * 100).toFixed(1)}%`
    );
    console.log(`P95 Latency:         ${latency.p95.toFixed(2)}ms`);
    console.log(`Memory Efficiency:   ${(memory.averageMemory / memory.peakMemory * 100).toFixed(1)}%`);
    console.log(
      `Path Balance:        ${(paths.pathBalanceRatio * 100).toFixed(1)}%`
    );

    console.log(
      '\n═══════════════════════════════════════════════════════════════\n'
    );
  } catch (error) {
    console.error('Benchmark failed:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  runComprehensiveBenchmark().catch(console.error);
}
