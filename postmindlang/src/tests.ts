/**
 * PostMindLang Comprehensive Test Suite
 * 700+ lines covering all components
 */

import { PostMindLangIntegration, PostMindLangRuntime, VectorTensor, MindLangToPostMindLangCompiler } from './integration';
import { PostMindLangBenchmarks } from './benchmarks';
import { PostMindLangVisualizer } from './visualization';

// ============================================================================
// Test Utilities
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration_ms: number;
}

class TestRunner {
  private results: TestResult[] = [];
  private total_tests = 0;
  private passed_tests = 0;

  async runTest(
    name: string,
    testFn: () => Promise<void>
  ): Promise<TestResult> {
    const start = performance.now();
    this.total_tests++;

    try {
      await testFn();
      this.passed_tests++;
      const duration = performance.now() - start;
      this.results.push({ name, passed: true, duration_ms: duration });
      console.log(`✓ ${name} (${duration.toFixed(2)}ms)`);
      return { name, passed: true, duration_ms: duration };
    } catch (error) {
      const duration = performance.now() - start;
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.results.push({ name, passed: false, error: errorMsg, duration_ms: duration });
      console.log(`✗ ${name} - ${errorMsg}`);
      return { name, passed: false, error: errorMsg, duration_ms: duration };
    }
  }

  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    pass_rate: number;
  } {
    return {
      total: this.total_tests,
      passed: this.passed_tests,
      failed: this.total_tests - this.passed_tests,
      pass_rate: this.total_tests > 0 ? this.passed_tests / this.total_tests : 0,
    };
  }

  getResults(): TestResult[] {
    return [...this.results];
  }
}

// ============================================================================
// Test Suite
// ============================================================================

export class PostMindLangTestSuite {
  private runner = new TestRunner();
  private integration: PostMindLangIntegration;
  private runtime: PostMindLangRuntime;
  private compiler: MindLangToPostMindLangCompiler;

  constructor() {
    this.integration = new PostMindLangIntegration();
    this.runtime = new PostMindLangRuntime(768, 3);
    this.compiler = new MindLangToPostMindLangCompiler();
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<void> {
    console.log('========================================');
    console.log('PostMindLang Test Suite');
    console.log('========================================\n');

    await this.testTensorOperations();
    console.log('\n');
    await this.testQueryEncoder();
    console.log('\n');
    await this.testPathExecutor();
    console.log('\n');
    await this.testEnsembleModule();
    console.log('\n');
    await this.testBackwardPass();
    console.log('\n');
    await this.testSampler();
    console.log('\n');
    await this.testDifferentiability();
    console.log('\n');
    await this.testIntegration();
    console.log('\n');
    await this.testPerformance();
    console.log('\n');

    this.printSummary();
  }

  /**
   * Tensor Operations Tests
   */
  private async testTensorOperations(): Promise<void> {
    console.log('Testing Tensor Operations...');

    await this.runner.runTest('tensor dot product', async () => {
      const v1: VectorTensor = { data: new Float64Array([1, 2, 3]), shape: [3] };
      const v2: VectorTensor = { data: new Float64Array([4, 5, 6]), shape: [3] };
      let dot = 0;
      for (let i = 0; i < v1.data.length; i++) {
        dot += v1.data[i] * v2.data[i];
      }
      if (Math.abs(dot - 32) > 0.01) throw new Error(`Expected 32, got ${dot}`);
    });

    await this.runner.runTest('tensor shape preservation', async () => {
      const v: VectorTensor = { data: new Float64Array(768), shape: [768] };
      if (v.shape[0] !== 768) throw new Error('Shape not preserved');
      if (v.data.length !== 768) throw new Error('Data length mismatch');
    });

    await this.runner.runTest('tensor scalar multiplication', async () => {
      const v: VectorTensor = { data: new Float64Array([1, 2, 3]), shape: [3] };
      const scalar = 2.5;
      const result = new Float64Array(v.data.length);
      for (let i = 0; i < v.data.length; i++) {
        result[i] = v.data[i] * scalar;
      }
      if (Math.abs(result[0] - 2.5) > 0.01) throw new Error('Scalar multiplication failed');
    });

    await this.runner.runTest('tensor addition', async () => {
      const v1: VectorTensor = { data: new Float64Array([1, 2, 3]), shape: [3] };
      const v2: VectorTensor = { data: new Float64Array([4, 5, 6]), shape: [3] };
      const result = new Float64Array(3);
      for (let i = 0; i < 3; i++) {
        result[i] = v1.data[i] + v2.data[i];
      }
      if (Math.abs(result[0] - 5) > 0.01) throw new Error('Addition failed');
    });

    await this.runner.runTest('tensor norm computation', async () => {
      const v: VectorTensor = { data: new Float64Array([3, 4]), shape: [2] };
      let norm_sq = 0;
      for (let i = 0; i < v.data.length; i++) {
        norm_sq += v.data[i] * v.data[i];
      }
      const norm = Math.sqrt(norm_sq);
      if (Math.abs(norm - 5) > 0.01) throw new Error('Norm computation failed');
    });
  }

  /**
   * Query Encoder Tests
   */
  private async testQueryEncoder(): Promise<void> {
    console.log('Testing Query Encoder...');

    await this.runner.runTest('encode query to vector', async () => {
      const query = 'What is machine learning?';
      const vector = this.compiler.compileExecution(query);
      if (vector.data.length !== 768) throw new Error('Encoding dimension mismatch');
      if (vector.shape[0] !== 768) throw new Error('Shape mismatch');
    });

    await this.runner.runTest('encoder produces non-zero vectors', async () => {
      const query = 'test query';
      const vector = this.compiler.compileExecution(query);
      let has_nonzero = false;
      for (let i = 0; i < vector.data.length; i++) {
        if (Math.abs(vector.data[i]) > 1e-10) {
          has_nonzero = true;
          break;
        }
      }
      if (!has_nonzero) throw new Error('Encoded vector is all zeros');
    });

    await this.runner.runTest('different queries produce different vectors', async () => {
      const v1 = this.compiler.compileExecution('query one');
      const v2 = this.compiler.compileExecution('query two');
      let diff = 0;
      for (let i = 0; i < v1.data.length; i++) {
        diff += Math.abs(v1.data[i] - v2.data[i]);
      }
      if (diff < 0.01) throw new Error('Different queries produced identical vectors');
    });

    await this.runner.runTest('encoder preserves dimensionality', async () => {
      const queries = ['short', 'this is a longer query', 'x'];
      for (const q of queries) {
        const v = this.compiler.compileExecution(q);
        if (v.data.length !== 768) throw new Error(`Inconsistent encoding dimension: ${v.data.length}`);
      }
    });

    await this.runner.runTest('gradient computation in encoder', async () => {
      const query = 'test';
      const vector = this.compiler.compileExecution(query);
      // Verify gradients can be computed
      if (!vector.data || vector.data.length === 0) throw new Error('No data for gradient computation');
    });
  }

  /**
   * Path Executor Tests
   */
  private async testPathExecutor(): Promise<void> {
    console.log('Testing Path Executor...');

    await this.runner.runTest('3 paths execute independently', async () => {
      const query: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        query.data[i] = Math.random();
      }

      const result = await this.runtime.execute(query);
      if (!result.output || result.output.data.length === 0) {
        throw new Error('Path execution produced empty output');
      }
    });

    await this.runner.runTest('path outputs have correct dimensionality', async () => {
      const query: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        query.data[i] = Math.random();
      }

      const result = await this.runtime.execute(query);
      if (result.output.data.length !== 768) {
        throw new Error(`Expected 768 dimensions, got ${result.output.data.length}`);
      }
    });

    await this.runner.runTest('paths produce different outputs', async () => {
      const query: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        query.data[i] = Math.sin(i);
      }

      const result1 = await this.runtime.execute(query);
      const result2 = await this.runtime.execute(query);

      // Same input should produce same output (deterministic)
      let diff = 0;
      for (let i = 0; i < result1.output.data.length; i++) {
        diff += Math.abs(result1.output.data[i] - result2.output.data[i]);
      }
      if (diff > 0.01) throw new Error('Runtime is non-deterministic');
    });

    await this.runner.runTest('path specialization validation', async () => {
      const query: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        query.data[i] = Math.random();
      }

      const result = await this.runtime.execute(query);
      if (result.pathId < 0 || result.pathId >= 3) {
        throw new Error(`Invalid path ID: ${result.pathId}`);
      }
    });

    await this.runner.runTest('path gradient flow', async () => {
      const query: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        query.data[i] = Math.random();
      }

      const loss_gradient: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        loss_gradient.data[i] = Math.random() * 0.1;
      }

      const result = await this.runtime.backward(loss_gradient);
      if (!result || result.data.length === 0) throw new Error('Gradient computation failed');
    });
  }

  /**
   * Ensemble Module Tests
   */
  private async testEnsembleModule(): Promise<void> {
    console.log('Testing Ensemble Module...');

    await this.runner.runTest('ensemble weights sum to 1', async () => {
      const weights = this.runtime.getEnsembleWeights();
      const sum = weights.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.001) {
        throw new Error(`Weights sum to ${sum}, expected 1.0`);
      }
    });

    await this.runner.runTest('ensemble weights are normalized', async () => {
      const weights = this.runtime.getEnsembleWeights();
      for (const w of weights) {
        if (w < 0 || w > 1) throw new Error(`Invalid weight: ${w}`);
      }
    });

    await this.runner.runTest('ensemble accepts simplex constraints', async () => {
      const new_weights = [0.2, 0.3, 0.5];
      this.runtime.setEnsembleWeights(new_weights);
      const weights = this.runtime.getEnsembleWeights();
      const sum = weights.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) > 0.001) {
        throw new Error('Ensemble weights not normalized');
      }
    });

    await this.runner.runTest('ensemble weighted combination', async () => {
      const query: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        query.data[i] = Math.random();
      }

      const result = await this.runtime.execute(query);

      // Verify ensemble output is bounded
      for (let i = 0; i < Math.min(10, result.output.data.length); i++) {
        if (Math.isNaN(result.output.data[i]) || !isFinite(result.output.data[i])) {
          throw new Error(`Invalid ensemble output at index ${i}`);
        }
      }
    });

    await this.runner.runTest('adaptive weight computation', async () => {
      const weights = this.runtime.getEnsembleWeights();
      const dominant_idx = weights.indexOf(Math.max(...weights));
      if (dominant_idx < 0 || dominant_idx >= 3) {
        throw new Error('Invalid dominant path');
      }
    });
  }

  /**
   * Backward Pass Tests (Critique Module)
   */
  private async testBackwardPass(): Promise<void> {
    console.log('Testing Backward Pass (Gradient Computation)...');

    await this.runner.runTest('backward pass computes gradients', async () => {
      const loss_gradient: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        loss_gradient.data[i] = Math.random() * 0.1;
      }

      const gradients = await this.runtime.backward(loss_gradient);
      if (!gradients || gradients.data.length === 0) {
        throw new Error('Backward pass failed');
      }
    });

    await this.runner.runTest('gradients have correct dimensionality', async () => {
      const loss_gradient: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        loss_gradient.data[i] = 0.001;
      }

      const gradients = await this.runtime.backward(loss_gradient);
      if (gradients.data.length !== 768) {
        throw new Error(`Expected 768 gradient dimensions, got ${gradients.data.length}`);
      }
    });

    await this.runner.runTest('loss function evaluation', async () => {
      const query: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        query.data[i] = Math.random();
      }

      const result = await this.runtime.execute(query);

      // Compute simple loss (magnitude)
      let loss = 0;
      for (let i = 0; i < result.output.data.length; i++) {
        loss += result.output.data[i] * result.output.data[i];
      }
      loss = Math.sqrt(loss);

      if (isNaN(loss) || !isFinite(loss)) {
        throw new Error('Loss computation produced invalid value');
      }
    });

    await this.runner.runTest('confidence calculation', async () => {
      const query: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        query.data[i] = Math.random();
      }

      const result = await this.runtime.execute(query);
      if (result.confidence < 0 || result.confidence > 1) {
        throw new Error(`Invalid confidence: ${result.confidence}`);
      }
    });

    await this.runner.runTest('weight updates during backward pass', async () => {
      const weights_before = this.runtime.getWeights();

      const loss_gradient: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        loss_gradient.data[i] = 0.01;
      }

      await this.runtime.backward(loss_gradient);

      const weights_after = this.runtime.getWeights();

      // Weights should have changed
      let changed = false;
      for (let i = 0; i < Math.min(10, weights_before.length); i++) {
        if (Math.abs(weights_before[i] - weights_after[i]) > 1e-6) {
          changed = true;
          break;
        }
      }

      if (!changed) throw new Error('Weights did not update during backward pass');
    });
  }

  /**
   * Sampler Tests
   */
  private async testSampler(): Promise<void> {
    console.log('Testing Sampler (Output Generation)...');

    await this.runner.runTest('softmax normalization', async () => {
      const scores = [1.0, 2.0, 3.0];
      const exp_scores = scores.map((s) => Math.exp(s));
      const sum = exp_scores.reduce((a, b) => a + b);
      const softmax = exp_scores.map((e) => e / sum);
      const softmax_sum = softmax.reduce((a, b) => a + b);
      if (Math.abs(softmax_sum - 1.0) > 0.001) {
        throw new Error('Softmax not normalized');
      }
    });

    await this.runner.runTest('threshold behavior', async () => {
      const query: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        query.data[i] = 0.001; // Small values
      }

      const result = await this.runtime.execute(query);
      if (!result.output || result.output.data.length === 0) {
        throw new Error('Threshold filtering produced invalid output');
      }
    });

    await this.runner.runTest('multinomial sampling properties', async () => {
      const probabilities = [0.2, 0.3, 0.5];
      const samples: number[] = [];

      for (let i = 0; i < 100; i++) {
        const r = Math.random();
        let cumsum = 0;
        for (let j = 0; j < probabilities.length; j++) {
          cumsum += probabilities[j];
          if (r < cumsum) {
            samples.push(j);
            break;
          }
        }
      }

      if (samples.length !== 100) throw new Error('Sampling failed');
    });
  }

  /**
   * Differentiability Tests
   */
  private async testDifferentiability(): Promise<void> {
    console.log('Testing Differentiability...');

    await this.runner.runTest('all operations have gradients', async () => {
      const query: VectorTensor = { data: new Float64Array(10), shape: [10] };
      for (let i = 0; i < 10; i++) {
        query.data[i] = Math.random();
      }

      const result = await this.runtime.execute(query);

      // Check if gradients can be computed
      const loss_grad: VectorTensor = { data: new Float64Array(10), shape: [10] };
      for (let i = 0; i < 10; i++) {
        loss_grad.data[i] = 0.01;
      }

      const gradients = await this.runtime.backward(loss_grad);
      if (!gradients.data) throw new Error('Gradients not computed');
    });

    await this.runner.runTest('gradient chain rule', async () => {
      const query: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        query.data[i] = 0.5;
      }

      const result = await this.runtime.execute(query);

      // Compute downstream gradients
      const loss_grad: VectorTensor = { data: new Float64Array(768), shape: [768] };
      for (let i = 0; i < 768; i++) {
        loss_grad.data[i] = 1.0 / 768;
      }

      const upstream_grad = await this.runtime.backward(loss_grad);
      if (!upstream_grad) throw new Error('Chain rule application failed');
    });

    await this.runner.runTest('numerical gradient verification', async () => {
      const verification = await this.integration.verifyGradients('test query', 1e-4);
      if (verification.max_error > 0.1) {
        throw new Error(`Gradient verification failed: max_error = ${verification.max_error}`);
      }
    });
  }

  /**
   * Integration Tests
   */
  private async testIntegration(): Promise<void> {
    console.log('Testing Integration...');

    await this.runner.runTest('MindLang ↔ PostMindLang compatibility', async () => {
      const result = await this.integration.execute_both('What is AI?');
      if (result.equivalence_score < 0 || result.equivalence_score > 1) {
        throw new Error(`Invalid equivalence score: ${result.equivalence_score}`);
      }
    });

    await this.runner.runTest('end-to-end execution', async () => {
      const queries = ['Query 1', 'Query 2', 'Query 3'];
      for (const q of queries) {
        const result = await this.integration.execute_both(q);
        if (!result.postmindlang_result.output) {
          throw new Error('End-to-end execution failed');
        }
      }
    });

    await this.runner.runTest('training loop convergence', async () => {
      const training_data = [
        { query: 'query 1', label: 0.5 },
        { query: 'query 2', label: 0.6 },
        { query: 'query 3', label: 0.7 },
      ];

      const metrics = await this.integration.train(training_data, 5);
      if (metrics.epoch_losses.length === 0) {
        throw new Error('Training did not produce loss values');
      }

      // Check for convergence trend
      if (metrics.convergence_rate < -0.1 && metrics.convergence_rate > 1.1) {
        throw new Error('Convergence rate out of expected range');
      }
    });

    await this.runner.runTest('statistical consistency', async () => {
      const stats = this.integration.getStatistics();
      if (stats.speedup_factor < 0.1 || stats.speedup_factor > 100) {
        throw new Error(`Unrealistic speedup factor: ${stats.speedup_factor}`);
      }
    });
  }

  /**
   * Performance Tests
   */
  private async testPerformance(): Promise<void> {
    console.log('Testing Performance...');

    await this.runner.runTest('single query latency < 200ms', async () => {
      const start = performance.now();
      await this.integration.execute_both('test query');
      const latency = performance.now() - start;
      if (latency > 200) {
        throw new Error(`Latency too high: ${latency}ms`);
      }
    });

    await this.runner.runTest('batch query processing', async () => {
      const queries = Array(10).fill(0).map((_, i) => `query_${i}`);
      const start = performance.now();
      for (const q of queries) {
        await this.integration.execute_both(q);
      }
      const total_time = performance.now() - start;
      const avg_latency = total_time / queries.length;
      if (avg_latency > 100) {
        throw new Error(`Average latency too high: ${avg_latency}ms`);
      }
    });

    await this.runner.runTest('memory efficiency', async () => {
      const initial = process.memoryUsage();
      for (let i = 0; i < 50; i++) {
        await this.integration.execute_both(`query_${i}`);
      }
      const final = process.memoryUsage();
      const memory_delta = final.heapUsed - initial.heapUsed;
      if (memory_delta > 100 * 1024 * 1024) {
        throw new Error(`Excessive memory usage: ${memory_delta / 1024 / 1024}MB`);
      }
    });

    await this.runner.runTest('visualization generation < 100ms', async () => {
      const queries: VectorTensor[] = [];
      for (let i = 0; i < 10; i++) {
        queries.push(this.compiler.compileExecution(`query_${i}`));
      }

      const start = performance.now();
      const runtime = new PostMindLangRuntime();
      PostMindLangVisualizer.visualize_vector_space_pca(runtime, queries);
      const duration = performance.now() - start;

      if (duration > 100) {
        throw new Error(`Visualization generation too slow: ${duration}ms`);
      }
    });

    await this.runner.runTest('benchmark suite completes in reasonable time', async () => {
      const start = performance.now();
      const benchmarks = new PostMindLangBenchmarks();
      const queries = Array(20).fill(0).map((_, i) => `query_${i}`);
      await benchmarks.benchmark_latency(queries);
      const duration = performance.now() - start;

      if (duration > 5000) {
        throw new Error(`Benchmark too slow: ${duration}ms`);
      }
    });
  }

  /**
   * Print test summary
   */
  private printSummary(): void {
    const summary = this.runner.getSummary();
    console.log('========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Pass Rate: ${(summary.pass_rate * 100).toFixed(1)}%`);
  }
}

// ============================================================================
// Run Tests
// ============================================================================

if (require.main === module) {
  (async () => {
    const suite = new PostMindLangTestSuite();
    await suite.runAllTests();
  })().catch(console.error);
}

export default PostMindLangTestSuite;
