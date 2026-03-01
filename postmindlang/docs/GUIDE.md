# PostMindLang User Guide and Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Vector Space Understanding](#vector-space-understanding)
4. [Training Guide](#training-guide)
5. [Optimization Tips](#optimization-tips)
6. [Visualization Interpretation](#visualization-interpretation)
7. [API Reference](#api-reference)
8. [Examples](#examples)
9. [Troubleshooting](#troubleshooting)

---

## Overview

PostMindLang is a high-performance vector-space reasoning system built on the MindLang foundation. It executes queries through three specialized paths with adaptive ensemble weighting, enabling efficient multi-path reasoning with full differentiability.

### Key Features

- **Multi-Path Reasoning**: Parallel execution through 3 specialized paths
- **Adaptive Ensemble**: Dynamically weighted combination of path outputs
- **Full Differentiability**: End-to-end gradient computation for training
- **Vector-Space Operations**: Efficient tensor operations on 768-dimensional embeddings
- **Performance Optimized**: 2-5x speedup over baseline MindLang
- **Comprehensive Validation**: Integrated equivalence checking and gradient verification

### System Architecture

```
Input Query (string)
    ↓
[Query Encoder] → 768-dim Vector
    ↓
    ├─→ [Path 1: Direct] → Output₁
    ├─→ [Path 2: Attention] → Output₂
    └─→ [Path 3: Specialized] → Output₃
    ↓
[Ensemble Module] → Weighted Combination
    ↓
[Output] → Result Vector + Confidence
```

---

## Architecture

### Components

#### 1. Query Encoder
- Converts text queries to 768-dimensional vectors
- Uses hash-based initialization for deterministic encoding
- Preserves semantic information through projection

#### 2. Path Executors

**Path 1: Direct Processing**
- Simple element-wise multiplication by learned weights
- Low latency, interpretable operations
- Best for straightforward reasoning tasks

**Path 2: Attention-Based**
- Applies softmax-normalized attention weights
- Enables selective focus on important dimensions
- Better for complex queries requiring feature selection

**Path 3: Specialized Reasoning**
- Uses tanh-based normalization and nonlinearity
- Performs L2 normalization for scale-invariance
- Optimal for highly specialized reasoning patterns

#### 3. Ensemble Module
- Combines outputs from all three paths using adaptive weights
- Weights maintain simplex constraint (sum to 1)
- Automatically selects dominant path for current query

#### 4. Gradient Module (Backward Pass)
- Computes gradients through all layers
- Enables training via backpropagation
- Supports numerical gradient verification

---

## Vector Space Understanding

### Vector Space Properties

**Dimensionality**: 768 dimensions

The 768-dimensional space captures semantic meaning of queries:
- Each dimension represents different semantic features
- Related queries cluster near each other
- Paths specialize in different regions of the space

**Norm and Distance**

```
||v|| = √(Σ vᵢ²)  - Vector magnitude
d(v₁, v₂) = ||v₁ - v₂||  - Euclidean distance between vectors
```

Lower distances → More similar queries

### Path Specialization

Each path specializes in different regions:

- **Path 1**: Well-suited for straightforward, direct reasoning
- **Path 2**: Excels at queries requiring attention-based filtering
- **Path 3**: Optimized for complex, nonlinear reasoning patterns

Monitor ensemble weights to understand path utilization:

```javascript
const weights = runtime.getEnsembleWeights();
// weights = [0.33, 0.33, 0.34] - balanced usage
// weights = [0.7, 0.2, 0.1] - Path 1 dominates
```

### Visualizing Vector Space

Use PCA or t-SNE projections to understand clustering:

```javascript
const points = PostMindLangVisualizer.visualize_vector_space_pca(runtime, queries);
// Points represent 768-dim vectors projected to 2D
// Color indicates different query types
// Distance represents semantic similarity
```

---

## Training Guide

### Preparing Training Data

```typescript
const training_data = [
  { query: "machine learning basics", label: 0.3 },
  { query: "deep neural networks", label: 0.6 },
  { query: "transformer architecture", label: 0.8 }
];
```

**Guidelines**:
- Labels should be in [0, 1] range (normalized)
- Diverse queries improve generalization
- Use at least 5-10 training examples
- More examples = better convergence

### Running Training

```typescript
const integration = new PostMindLangIntegration();
const metrics = await integration.train(training_data, epochs=10, learning_rate=0.001);
```

**Parameters**:
- `epochs`: Number of training iterations (default: 10)
- `learning_rate`: Step size for weight updates (default: 0.001)
  - Smaller (0.0001): Slower, more stable
  - Larger (0.01): Faster, risking instability

### Monitoring Convergence

```typescript
console.log(`Epoch losses: ${metrics.epoch_losses}`);
console.log(`Convergence rate: ${metrics.convergence_rate}`);
```

**Healthy convergence**:
- Losses decrease monotonically
- Convergence rate between -0.1 and 0.5
- Gradients decrease over time

**Warning signs**:
- Increasing losses → Learning rate too high
- Flat losses → Learning rate too low
- NaN values → Numerical instability

### Hyperparameter Tuning

| Parameter | Recommended Range | Tuning Strategy |
|-----------|-------------------|-----------------|
| learning_rate | 0.0001 - 0.01 | Start high, decrease if diverging |
| epochs | 5 - 50 | More epochs for complex patterns |
| batch_size | 1 - 32 | Larger batches for stability |
| gradient_clip | 1.0 - 10.0 | Prevent exploding gradients |

---

## Optimization Tips

### 1. Throughput Optimization

**For batch processing**:
```typescript
// Create batch of queries
const queries = [...] // Array of 100+ queries
for (const query of queries) {
  await integration.execute_both(query);
}
// Achieves 50+ QPS
```

**Tips**:
- Batch similar queries together for cache efficiency
- Use async/await for non-blocking execution
- Profile with benchmarks to identify bottlenecks

### 2. Memory Optimization

**Reduce memory footprint**:
```typescript
// Keep only necessary history
if (execution_history.length > 10000) {
  execution_history = execution_history.slice(-5000);
}
```

**Guidelines**:
- Typical memory per query: 0.1-0.2 MB
- GC collections occur naturally with large batches
- Monitor peak memory during training

### 3. Gradient Computation Optimization

**Efficient gradient verification**:
```typescript
// Verify selectively, not every query
if (Math.random() < 0.1) { // 10% sampling
  await integration.verifyGradients(query);
}
```

**Numerical differentiation tuning**:
- `epsilon = 1e-4`: Good balance for most cases
- `epsilon = 1e-5`: More accurate, slower
- `epsilon = 1e-3`: Faster, less accurate

### 4. Path Specialization

**Encourage path diversity**:
```typescript
const weights = runtime.getEnsembleWeights();
// If imbalanced (e.g., [0.8, 0.1, 0.1])
// consider regularization or data augmentation
```

**Tips**:
- More diverse training data → More balanced weights
- Different query types → Different path activation
- Regularize weights to prevent one path dominating

---

## Visualization Interpretation

### Vector Space Projection

**PCA Visualization**:
- Preserves global structure
- Large variance in first 2 components
- Good for understanding overall clustering
- Fast computation

**t-SNE Visualization**:
- Preserves local structure
- Reveals fine-grained clusters
- Slower but more detailed
- Better for exploration

### Reading Projections

```
┌─────────────────────────────────────┐
│          Vector Space (2D)           │
│                                      │
│  G  G    G          B   B  B         │
│   G    G               B    B        │
│     G             R        B         │
│                  RRR                 │
│              R        R   R          │
└─────────────────────────────────────┘
Legend: G=Green(Path1), B=Blue(Path2), R=Red(Path3)
```

**Interpretation**:
- Clusters indicate semantic grouping
- Isolated points are unique queries
- Density shows query type distribution
- Color indicates dominant path

### Gradient Flow Visualization

```
Layer 0: ████████████████████ (magnitude: 0.0524)
Layer 1: ████████░░░░░░░░░░░░ (magnitude: 0.0312)
Layer 2: ████░░░░░░░░░░░░░░░░ (magnitude: 0.0089)
```

**Interpretation**:
- Longer bars = Stronger gradients
- Decreasing bars = Normal gradient flow
- Bottlenecks = Layers with weak gradients

### Weight Evolution

```
Epoch  Path1   Path2   Path3
  0    0.33    0.33    0.34
  5    0.40    0.35    0.25
 10    0.50    0.30    0.20
```

**Interpretation**:
- Changing weights = Adaptation during training
- Convergence = Stable weights across epochs
- Dominance = One path better for data

---

## API Reference

### PostMindLangRuntime

```typescript
class PostMindLangRuntime {
  // Execute query
  async execute(query: VectorTensor): Promise<PostMindLangResult>

  // Backward pass for training
  async backward(loss_gradient: VectorTensor): Promise<VectorTensor>

  // Get/set weights
  getWeights(): Float64Array
  getEnsembleWeights(): number[]
  setEnsembleWeights(weights: number[]): void
}
```

### PostMindLangIntegration

```typescript
class PostMindLangIntegration {
  // Dual execution with comparison
  async execute_both(query: string): Promise<DualExecutionResult>

  // Training loop
  async train(training_data, epochs, learning_rate): Promise<TrainingMetrics>

  // Gradient verification
  async verifyGradients(query, epsilon): Promise<GradientVerification>

  // Get statistics
  getStatistics(): Statistics
}
```

### PostMindLangVisualizer

```typescript
class PostMindLangVisualizer {
  static visualize_vector_space_pca(runtime, queries): Point2D[]
  static visualize_vector_space_tsne(runtime, queries): Point2D[]
  static visualize_gradient_flow(backward_data): GradientFlowData[]
  static visualize_ensemble_decision(z_a, z_b, z_c, weights): EnsembleVisualization
  static export_as_svg(points, width, height): string
}
```

---

## Examples

### Basic Usage

```typescript
import { PostMindLangRuntime } from './integration';

const runtime = new PostMindLangRuntime();
const query = { data: new Float64Array(768), shape: [768] };
const result = await runtime.execute(query);
console.log(`Result confidence: ${result.confidence}`);
```

### Training

```typescript
import { PostMindLangIntegration } from './integration';

const integration = new PostMindLangIntegration();
const data = [
  { query: "example 1", label: 0.5 },
  { query: "example 2", label: 0.7 }
];
const metrics = await integration.train(data, 10);
console.log(`Final loss: ${metrics.total_loss}`);
```

### Benchmarking

```typescript
import { PostMindLangBenchmarks } from './benchmarks';

const benchmarks = new PostMindLangBenchmarks();
const results = await benchmarks.runAllBenchmarks();
console.log(benchmarks.generateReport());
```

### Visualization

```typescript
import { PostMindLangVisualizer } from './visualization';

const points = PostMindLangVisualizer.visualize_vector_space_pca(runtime, queries);
const svg = PostMindLangVisualizer.export_as_svg(points);
console.log(svg);
```

---

## Troubleshooting

### Common Issues

**Issue**: NaN values in gradients
- **Cause**: Learning rate too high or exploding gradients
- **Solution**: Reduce learning rate, add gradient clipping

**Issue**: Training loss not decreasing
- **Cause**: Learning rate too low or poor data quality
- **Solution**: Increase learning rate, diversify training data

**Issue**: Slow execution
- **Cause**: Large batch sizes or inefficient queries
- **Solution**: Reduce batch size, profile with benchmarks

**Issue**: Low equivalence score
- **Cause**: PostMindLang and MindLang diverging
- **Solution**: Retrain, verify gradient correctness

### Performance Debugging

```typescript
// Profile execution
const start = performance.now();
await integration.execute_both(query);
const latency = performance.now() - start;
console.log(`Latency: ${latency}ms`);

// Check memory
console.log(`Memory: ${process.memoryUsage().heapUsed / 1024 / 1024}MB`);

// Verify gradients
const verification = await integration.verifyGradients(query);
console.log(`Gradient check: ${verification.all_correct ? 'PASS' : 'FAIL'}`);
```

### Advanced Debugging

```typescript
// Monitor path usage
const stats = integration.getStatistics();
console.log(`Speedup: ${stats.speedup_factor}x`);

// Get execution history
const history = integration.getExecutionHistory();
console.log(`Executions: ${history.length}`);

// Analyze bottlenecks
for (const result of history.slice(0, 5)) {
  console.log(`Latency: ${result.latency_postmindlang}ms`);
}
```

---

## Performance Benchmarks

Typical results on modern hardware:

| Metric | Value | Notes |
|--------|-------|-------|
| Single Query Latency | 20-50ms | PostMindLang |
| Throughput | 50-100 QPS | Batch processing |
| Memory per Query | 0.1-0.2 MB | Peak usage |
| Training Time (10 epochs) | 100-500ms | 5 examples |
| Gradient Verification | Pass rate > 95% | 1e-4 epsilon |

---

## Best Practices

1. **Always verify gradients** during training setup
2. **Start with small learning rates** and increase gradually
3. **Monitor equivalence scores** to catch divergence early
4. **Use benchmarks** to identify optimization opportunities
5. **Visualize periodically** to understand model behavior
6. **Keep diverse training data** for better generalization
7. **Profile memory usage** during batch processing

---

## Getting Help

- Check examples in `src/examples.ts`
- Run tests with `npm test`
- Review benchmarks with `benchmark.generateReport()`
- Analyze visualizations with ASCII or SVG exports

---

**Last Updated**: 2026-02-20
**Version**: 1.0
