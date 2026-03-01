/**
 * PostMindLang Usage Examples
 * Comprehensive examples demonstrating all features
 * ~400 lines
 */

import { PostMindLangIntegration, PostMindLangRuntime, MindLangToPostMindLangCompiler } from './integration';
import { PostMindLangBenchmarks } from './benchmarks';
import { PostMindLangVisualizer } from './visualization';
import { PostMindLangTestSuite } from './tests';

// ============================================================================
// Example 1: Basic Query Execution
// ============================================================================

export async function example_basic_query(): Promise<void> {
  console.log('\n--- Example 1: Basic Query Execution ---\n');

  const compiler = new MindLangToPostMindLangCompiler();
  const runtime = new PostMindLangRuntime();

  // Compile query to vector
  const query = 'What is artificial intelligence?';
  const query_vector = compiler.compileExecution(query);

  console.log(`Query: "${query}"`);
  console.log(`Vector dimension: ${query_vector.shape[0]}`);
  console.log(`Vector norm: ${Math.sqrt(
    Array.from(query_vector.data).reduce((a, b) => a + b * b, 0)
  ).toFixed(4)}`);

  // Execute through PostMindLang
  const result = await runtime.execute(query_vector);

  console.log(`\nExecution Result:`);
  console.log(`  Dominant path: ${result.pathId}`);
  console.log(`  Path weight: ${result.weight.toFixed(4)}`);
  console.log(`  Confidence: ${result.confidence.toFixed(4)}`);
  console.log(`  Output magnitude: ${Math.sqrt(
    Array.from(result.output.data).reduce((a, b) => a + b * b, 0)
  ).toFixed(4)}`);
}

// ============================================================================
// Example 2: Dual Execution and Comparison
// ============================================================================

export async function example_dual_execution(): Promise<void> {
  console.log('\n--- Example 2: Dual Execution (MindLang vs PostMindLang) ---\n');

  const integration = new PostMindLangIntegration();

  const queries = [
    'How do neural networks work?',
    'Explain deep learning',
    'What is tensor operations?',
  ];

  for (const query of queries) {
    const result = await integration.execute_both(query);

    console.log(`Query: "${query}"`);
    console.log(`  MindLang latency: ${result.latency_mindlang.toFixed(2)}ms`);
    console.log(`  PostMindLang latency: ${result.latency_postmindlang.toFixed(2)}ms`);
    console.log(`  Speedup: ${(result.latency_mindlang / result.latency_postmindlang).toFixed(2)}x`);
    console.log(`  Equivalence score: ${result.equivalence_score.toFixed(4)}`);

    if (result.mismatch_details) {
      console.log(`  Issues: ${result.mismatch_details}`);
    }
    console.log();
  }

  // Print statistics
  const stats = integration.getStatistics();
  console.log('Statistics:');
  console.log(`  Total executions: ${stats.total_executions}`);
  console.log(`  Average equivalence: ${(stats.avg_equivalence * 100).toFixed(1)}%`);
  console.log(`  Speedup factor: ${stats.speedup_factor.toFixed(2)}x`);
}

// ============================================================================
// Example 3: Training and Convergence
// ============================================================================

export async function example_training(): Promise<void> {
  console.log('\n--- Example 3: Training Loop ---\n');

  const integration = new PostMindLangIntegration();

  // Create training data
  const training_data = [
    { query: 'machine learning basics', label: 0.3 },
    { query: 'deep neural networks', label: 0.6 },
    { query: 'transformer architecture', label: 0.8 },
    { query: 'natural language processing', label: 0.7 },
    { query: 'computer vision tasks', label: 0.5 },
  ];

  console.log(`Training on ${training_data.length} examples for 10 epochs...\n`);

  const metrics = await integration.train(training_data, 10, 0.001);

  console.log('Training Metrics:');
  console.log(`  Initial loss: ${metrics.epoch_losses[0].toFixed(6)}`);
  console.log(`  Final loss: ${metrics.epoch_losses[metrics.epoch_losses.length - 1].toFixed(6)}`);
  console.log(`  Convergence rate: ${(metrics.convergence_rate * 100).toFixed(1)}%`);
  console.log(`  Final gradient norm: ${metrics.gradients_norm.toFixed(6)}`);
  console.log(`  Training time: ${metrics.training_time_ms.toFixed(0)}ms`);
  console.log(`  Final weights (first 5): [${metrics.final_weights.slice(0, 5).map((w) => w.toFixed(4)).join(', ')}]`);

  // Plot loss curve
  console.log('\nLoss curve:');
  const max_loss = Math.max(...metrics.epoch_losses);
  for (let i = 0; i < metrics.epoch_losses.length; i++) {
    const normalized = metrics.epoch_losses[i] / max_loss;
    const bars = '█'.repeat(Math.floor(normalized * 40));
    console.log(`  Epoch ${i.toString().padStart(2)}: ${bars} ${metrics.epoch_losses[i].toFixed(6)}`);
  }
}

// ============================================================================
// Example 4: Gradient Verification
// ============================================================================

export async function example_gradient_verification(): Promise<void> {
  console.log('\n--- Example 4: Gradient Verification ---\n');

  const integration = new PostMindLangIntegration();

  const test_queries = [
    'gradient descent optimization',
    'backpropagation algorithm',
    'numerical differentiation',
  ];

  for (const query of test_queries) {
    console.log(`Testing gradients for: "${query}"`);

    const verification = await integration.verifyGradients(query, 1e-4);

    console.log(`  Components tested: ${verification.components_tested}`);
    console.log(`  Max error: ${verification.max_error.toExponential(2)}`);
    console.log(`  All correct: ${verification.all_correct ? 'YES' : 'NO'}`);

    // Show a few comparisons
    console.log(`  Gradient samples:`);
    for (let i = 0; i < Math.min(3, verification.numerical_gradient.length); i++) {
      const num = verification.numerical_gradient[i];
      const ana = verification.analytical_gradient[i];
      const error = Math.abs(num - ana);
      console.log(
        `    [${i}] Numerical: ${num.toFixed(6)}, Analytical: ${ana.toFixed(6)}, Error: ${error.toExponential(2)}`
      );
    }
    console.log();
  }
}

// ============================================================================
// Example 5: Vector Space Visualization
// ============================================================================

export async function example_visualization(): Promise<void> {
  console.log('\n--- Example 5: Vector Space Visualization ---\n');

  const compiler = new MindLangToPostMindLangCompiler();
  const runtime = new PostMindLangRuntime();

  // Compile multiple queries
  const queries = [
    'machine learning',
    'deep learning',
    'neural networks',
    'transformers',
    'nlp models',
    'computer vision',
    'vector embeddings',
    'tensor operations',
  ];

  const vectors = queries.map((q) => compiler.compileExecution(q));

  console.log(`Visualizing ${vectors.length} queries in vector space...\n`);

  // PCA Visualization
  const pca_points = PostMindLangVisualizer.visualize_vector_space_pca(runtime, vectors);
  console.log('PCA Projection (2D):');
  console.log(PostMindLangVisualizer.ascii_visualization_vector_space(pca_points));

  // Export as SVG
  const svg_output = PostMindLangVisualizer.export_as_svg(pca_points);
  console.log('\nSVG Export (first 500 chars):');
  console.log(svg_output.substring(0, 500) + '...');

  // Ensemble decision visualization
  console.log('\nEnsemble Decision Visualization:');
  const z_a = compiler.compileExecution('path A');
  const z_b = compiler.compileExecution('path B');
  const z_c = compiler.compileExecution('path C');
  const weights = runtime.getEnsembleWeights();

  const ensemble_viz = PostMindLangVisualizer.visualize_ensemble_decision(
    z_a,
    z_b,
    z_c,
    weights
  );

  console.log(`  Path 1: (${ensemble_viz.path_vectors[0].x.toFixed(2)}, ${ensemble_viz.path_vectors[0].y.toFixed(2)}) - weight: ${weights[0].toFixed(3)}`);
  console.log(`  Path 2: (${ensemble_viz.path_vectors[1].x.toFixed(2)}, ${ensemble_viz.path_vectors[1].y.toFixed(2)}) - weight: ${weights[1].toFixed(3)}`);
  console.log(`  Path 3: (${ensemble_viz.path_vectors[2].x.toFixed(2)}, ${ensemble_viz.path_vectors[2].y.toFixed(2)}) - weight: ${weights[2].toFixed(3)}`);
  console.log(`  Ensemble: (${ensemble_viz.ensemble_point.x.toFixed(2)}, ${ensemble_viz.ensemble_point.y.toFixed(2)})`);
}

// ============================================================================
// Example 6: Ensemble Analysis
// ============================================================================

export async function example_ensemble_analysis(): Promise<void> {
  console.log('\n--- Example 6: Ensemble Analysis ---\n');

  const compiler = new MindLangToPostMindLangCompiler();
  const runtime = new PostMindLangRuntime();

  const queries = ['query 1', 'query 2', 'query 3'];
  let path1_wins = 0,
    path2_wins = 0,
    path3_wins = 0;
  const all_weights: number[][] = [];

  for (const q of queries) {
    const vector = compiler.compileExecution(q);
    const result = await runtime.execute(vector);

    if (result.pathId === 0) path1_wins++;
    else if (result.pathId === 1) path2_wins++;
    else path3_wins++;

    all_weights.push(runtime.getEnsembleWeights());
  }

  console.log('Ensemble Decision Statistics:');
  console.log(`  Path 1 wins: ${path1_wins}`);
  console.log(`  Path 2 wins: ${path2_wins}`);
  console.log(`  Path 3 wins: ${path3_wins}`);

  const avg_weights = [
    all_weights.reduce((a, b) => a + b[0], 0) / all_weights.length,
    all_weights.reduce((a, b) => a + b[1], 0) / all_weights.length,
    all_weights.reduce((a, b) => a + b[2], 0) / all_weights.length,
  ];

  console.log('\nAverage Ensemble Weights:');
  console.log(`  Path 1: ${avg_weights[0].toFixed(4)}`);
  console.log(`  Path 2: ${avg_weights[1].toFixed(4)}`);
  console.log(`  Path 3: ${avg_weights[2].toFixed(4)}`);
}

// ============================================================================
// Example 7: Performance Benchmarking
// ============================================================================

export async function example_benchmarking(): Promise<void> {
  console.log('\n--- Example 7: Performance Benchmarking ---\n');

  const benchmarks = new PostMindLangBenchmarks();

  console.log('Running latency benchmark (10 queries)...');
  const latency_results = await benchmarks.benchmark_latency(
    Array(10).fill(0).map((_, i) => `query_${i}`)
  );

  console.log('\nLatency Results:');
  console.log(`  Min: ${latency_results.min_ms.toFixed(2)}ms`);
  console.log(`  Mean: ${latency_results.mean_ms.toFixed(2)}ms`);
  console.log(`  Median: ${latency_results.median_ms.toFixed(2)}ms`);
  console.log(`  P95: ${latency_results.p95_ms.toFixed(2)}ms`);
  console.log(`  Speedup: ${latency_results.speedup_factor.toFixed(2)}x`);

  console.log('\nBenchmark results stored:');
  const results = benchmarks.getResults();
  for (const result of results) {
    console.log(`  ${result.name}: ${result.value.toFixed(4)} ${result.unit}`);
  }

  console.log('\nBenchmark Report:');
  console.log(benchmarks.generateReport());
}

// ============================================================================
// Example 8: Comprehensive Test Suite
// ============================================================================

export async function example_test_suite(): Promise<void> {
  console.log('\n--- Example 8: Running Comprehensive Test Suite ---\n');

  const suite = new PostMindLangTestSuite();
  await suite.runAllTests();
}

// ============================================================================
// Example 9: Advanced Gradient Analysis
// ============================================================================

export async function example_gradient_analysis(): Promise<void> {
  console.log('\n--- Example 9: Advanced Gradient Analysis ---\n');

  const compiler = new MindLangToPostMindLangCompiler();
  const runtime = new PostMindLangRuntime();

  const query = 'advanced gradient analysis';
  const query_vector = compiler.compileExecution(query);

  console.log('Computing gradients...\n');

  // Forward pass
  const result = await runtime.execute(query_vector);
  console.log('Forward pass results:');
  console.log(`  Output magnitude: ${Math.sqrt(
    Array.from(result.output.data).reduce((a, b) => a + b * b, 0)
  ).toFixed(4)}`);

  // Backward pass
  const loss_gradient = {
    data: new Float64Array(768),
    shape: [768],
  };
  for (let i = 0; i < 768; i++) {
    loss_gradient.data[i] = 0.001;
  }

  const gradients = await runtime.backward(loss_gradient);
  const grad_norm = Math.sqrt(
    Array.from(gradients.data).reduce((a, b) => a + b * b, 0)
  );

  console.log('\nBackward pass results:');
  console.log(`  Gradient norm: ${grad_norm.toFixed(6)}`);
  console.log(`  Max gradient: ${Math.max(...Array.from(gradients.data)).toFixed(6)}`);
  console.log(`  Min gradient: ${Math.min(...Array.from(gradients.data)).toFixed(6)}`);
}

// ============================================================================
// Example 10: Full Integration Example
// ============================================================================

export async function example_full_integration(): Promise<void> {
  console.log('\n--- Example 10: Full Integration Example ---\n');

  const integration = new PostMindLangIntegration();

  // Step 1: Basic execution
  console.log('Step 1: Executing query through both systems...');
  const exec_result = await integration.execute_both('What is PostMindLang?');
  console.log(`  Equivalence: ${(exec_result.equivalence_score * 100).toFixed(1)}%\n`);

  // Step 2: Training
  console.log('Step 2: Training the system...');
  const training_data = [
    { query: 'training example 1', label: 0.2 },
    { query: 'training example 2', label: 0.5 },
    { query: 'training example 3', label: 0.8 },
  ];
  const train_metrics = await integration.train(training_data, 5);
  console.log(
    `  Final loss: ${train_metrics.epoch_losses[train_metrics.epoch_losses.length - 1].toFixed(6)}\n`
  );

  // Step 3: Benchmarking
  console.log('Step 3: Running benchmarks...');
  const benchmarks = new PostMindLangBenchmarks();
  const bench_results = await benchmarks.benchmark_accuracy(
    Array(20).fill(0).map((_, i) => `bench_query_${i}`)
  );
  console.log(`  Success rate: ${(bench_results.success_rate * 100).toFixed(1)}%\n`);

  // Step 4: Visualization
  console.log('Step 4: Generating visualization...');
  const compiler = new MindLangToPostMindLangCompiler();
  const runtime = new PostMindLangRuntime();
  const viz_queries = Array(5).fill(0).map((_, i) => compiler.compileExecution(`viz_query_${i}`));
  const viz_points = PostMindLangVisualizer.visualize_vector_space_pca(runtime, viz_queries);
  console.log(`  Generated ${viz_points.length} 2D projection points\n`);

  // Final statistics
  console.log('Final Statistics:');
  const final_stats = integration.getStatistics();
  console.log(`  Total executions: ${final_stats.total_executions}`);
  console.log(`  Average equivalence: ${(final_stats.avg_equivalence * 100).toFixed(1)}%`);
  console.log(`  Overall speedup: ${final_stats.speedup_factor.toFixed(2)}x`);
}

// ============================================================================
// Main: Run all examples
// ============================================================================

export async function runAllExamples(): Promise<void> {
  console.log('='.repeat(60));
  console.log('PostMindLang Usage Examples');
  console.log('='.repeat(60));

  try {
    await example_basic_query();
    await example_dual_execution();
    await example_training();
    await example_gradient_verification();
    await example_visualization();
    await example_ensemble_analysis();
    await example_benchmarking();
    await example_gradient_analysis();
    await example_full_integration();

    console.log('\n' + '='.repeat(60));
    console.log('All examples completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllExamples().catch(console.error);
}

export default {
  example_basic_query,
  example_dual_execution,
  example_training,
  example_gradient_verification,
  example_visualization,
  example_ensemble_analysis,
  example_benchmarking,
  example_test_suite,
  example_gradient_analysis,
  example_full_integration,
  runAllExamples,
};
