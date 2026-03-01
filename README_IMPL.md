# MindLang Implementation Guide

## Overview

MindLang is a multi-path intelligent reasoning language designed for parallel reasoning, ensemble learning, and iterative refinement. This guide covers building, running, testing, and executing MindLang programs.

## Project Structure

```
mindlang/
├── src/
│   └── main.ts                  # CLI entry point (150 lines)
├── stdlib/
│   ├── core.ml                  # Core library (300 lines)
│   ├── parallel.ml              # Parallel operations (150 lines)
│   └── ensemble.ml              # Ensemble operations (150 lines)
├── examples/
│   ├── hello.ml                 # Hello world example
│   ├── parallel_reasoning.ml    # Multi-path reasoning
│   ├── ensemble_voting.ml       # Voting consensus
│   ├── self_critique.ml         # Self-critique loops
│   └── ai_agent.ml              # Full AI agent
├── tests/
│   └── integration.test.ts      # 30+ integration tests
├── package.json                 # Project configuration
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest test configuration
└── README_IMPL.md               # This file
```

## Prerequisites

- Node.js 16+
- npm or yarn
- TypeScript 5.0+

## Installation

### 1. Install Dependencies

```bash
cd ~/kim/mindlang
npm install
```

This installs:
- `typescript`: TypeScript compiler
- `ts-node`: TypeScript execution runtime
- `chalk`: Terminal colors for CLI output
- `jest`: Testing framework
- `@types/jest`: Jest type definitions
- All development dependencies

### 2. Verify Installation

```bash
npm --version
node --version
npx tsc --version
```

## Building

### Compile TypeScript

```bash
npm run build
```

This compiles all TypeScript files in `src/` to JavaScript in `dist/` directory.

Output:
```
dist/
└── main.js
```

### Watch Mode (Development)

```bash
npm run build -- --watch
```

Automatically recompiles when files change.

## Running Programs

### Basic Execution

Execute a MindLang program:

```bash
npx ts-node src/main.ts examples/hello.ml
```

### Execution Modes

#### 1. Normal Execution

```bash
npx ts-node src/main.ts examples/hello.ml
```

Output shows:
- Program name and queries
- Execution results
- Statistics (operations, variables, time)

#### 2. Bytecode Dump

View compiled bytecode representation:

```bash
npx ts-node src/main.ts examples/hello.ml --dump-bc
```

Example output:
```
=== Bytecode Dump ===

Program: hello
Operations: 4

[0] ENCODE q
[1] SAMPLE z 0.5
[2] DETOKENIZE output
[3] ASSIGN result
```

#### 3. Execution Trace

Show step-by-step execution:

```bash
npx ts-node src/main.ts examples/parallel_reasoning.ml --trace
```

Example output:
```
[TRACE] Starting execution of program: parallel_reasoning

  [QUERY] "What is 2+2?"
  [1] ENCODE q
    → z = [-45.231, 12.456, ...]
  [2] FORK z
    → Forking into 3 branches
  [3] ENSEMBLE [0.7, 0.2, 0.1]
    → Combining ensemble results
```

#### 4. Performance Profile

Show execution performance metrics:

```bash
npx ts-node src/main.ts examples/ai_agent.ml --profile
```

Example output:
```
=== Performance Profile ===

Total time: 45.23ms
Operations: 8
Time per operation: 5.654ms
Output size: 2048 bytes
```

### Running All Examples

Execute all example programs:

```bash
# Hello world
npx ts-node src/main.ts examples/hello.ml

# Parallel reasoning
npx ts-node src/main.ts examples/parallel_reasoning.ml --trace

# Ensemble voting
npx ts-node src/main.ts examples/ensemble_voting.ml --dump-bc

# Self-critique
npx ts-node src/main.ts examples/self_critique.ml --profile

# AI agent
npx ts-node src/main.ts examples/ai_agent.ml
```

## Testing

### Run All Tests

```bash
npm test
```

Runs all test suites defined in `tests/integration.test.ts`

### Run Tests in Watch Mode

```bash
npm run test:watch
```

Automatically reruns tests when code changes.

### Test Coverage

The test suite includes 30+ test cases:

- **Parser Tests (9 tests)**
  - Query parsing
  - Operation parsing (encode, sample, detokenize, fork, ensemble, critique)
  - Bytecode generation
  - Program name extraction

- **Interpreter Tests (11 tests)**
  - Simple program execution
  - Context tracking
  - Individual operation execution
  - Complete pipeline execution

- **Example File Tests (10 tests)**
  - All example files parse correctly
  - Examples contain expected operations
  - Examples execute successfully

- **Standard Library Tests (8 tests)**
  - Core library functions
  - Parallel operations
  - Ensemble operations

- **Performance Tests (3 tests)**
  - Execution speed
  - Large program handling
  - Bytecode efficiency

- **Edge Case Tests (5 tests)**
  - Empty programs
  - Single operations
  - Complex queries
  - Multiple forks
  - Temperature variations

- **Integration Pipeline Tests (4 tests)**
  - Hello world pipeline
  - Multi-path reasoning
  - Critique and refinement
  - Full agent pipeline

Run specific test suite:

```bash
npx jest --testNamePattern="Parser"
npx jest --testNamePattern="Interpreter"
npx jest --testNamePattern="Example Files"
```

## Language Features

### Core Operations

#### Query
Specify input to the program:
```mindlang
query "What is the capital of France?"
```

#### Encode
Convert query to latent representation:
```mindlang
encode q -> z
```

#### Sample
Sample from latent representation with temperature:
```mindlang
sample z 0.5 -> output  (* temperature = 0.5 *)
```

Temperature interpretation:
- 0.0-0.3: Low temperature (deterministic)
- 0.4-0.7: Medium temperature (balanced)
- 0.8-1.0+: High temperature (exploratory)

#### Detokenize
Convert output to readable form:
```mindlang
detokenize output -> result
```

#### Fork
Split computation into parallel branches:
```mindlang
fork z -> {z_a, z_b, z_c}
```

#### Ensemble
Combine multiple results with weights:
```mindlang
ensemble [0.7, 0.2, 0.1] [result_a, result_b, result_c] -> combined
```

#### Critique
Apply self-critique to result:
```mindlang
critique result -> delta
```

### Function Definition

Define reusable functions:

```mindlang
fn analytical_reasoning(z: LatentVector) -> Output {
  constrained = apply_constraints(z)
  return constrained
}
```

### Control Flow

#### Conditionals
```mindlang
if confidence > 0.9 {
  return result
} else {
  return refined
}
```

#### Loops
```mindlang
loop {
  critique result -> delta
  if confidence(delta) > 0.9 {
    break
  }
  result = refine(result)
}
```

## Standard Library

### core.ml - Core Operations

**Vector Operations:**
- `vector_add(v1, v2)` - Element-wise addition
- `vector_dot(v1, v2)` - Dot product
- `vector_norm(v)` - L2 norm
- `vector_normalize(v)` - Normalize to unit length
- `vector_scale(v, scalar)` - Scalar multiplication

**Activation Functions:**
- `relu(x)` - Rectified linear unit
- `sigmoid(x)` - Sigmoid activation
- `softmax(v)` - Softmax normalization
- `tanh(x)` - Hyperbolic tangent

**Sampling:**
- `sample_from_distribution(dist, seed)` - Sample from probability distribution
- `gumbel_softmax(logits, temperature, seed)` - Differentiable sampling

**Utilities:**
- `entropy(dist)` - Calculate distribution entropy
- `kl_divergence(p, q)` - Kullback-Leibler divergence
- `confidence_score(dist)` - Extract confidence

### parallel.ml - Parallel Operations

**Parallel Primitives:**
- `parallel_map(f, seq, num_threads)` - Map over sequence in parallel
- `parallel_reduce(f, initial, seq, num_threads)` - Parallel reduction
- `fork_join(branches, input, num_threads)` - Fork-join pattern

**Synchronization:**
- `barrier_sync(num_threads, barrier_id)` - Barrier synchronization
- `lock_acquire(lock_id)` - Acquire mutex lock
- `lock_release(lock_id)` - Release mutex lock
- `with_lock(lock_id, f)` - Scoped lock execution

**Work Distribution:**
- `distribute_work(items, num_threads)` - Distribute work evenly
- `load_balance(items, weights, num_threads)` - Weight-based distribution

### ensemble.ml - Ensemble Operations

**Combination:**
- `weighted_ensemble(weights, results, combine_fn)` - Weighted combination
- `simple_ensemble(results)` - Simple average
- `weighted_average(weights, results)` - Weighted average

**Voting:**
- `majority_vote(votes)` - Majority voting
- `weighted_vote(votes, confidences)` - Confidence-weighted voting
- `consensus(results, threshold)` - Consensus with threshold

**Adaptive Weighting:**
- `compute_adaptive_weights(results, method)` - Compute weights dynamically
  - Methods: "entropy", "variance", "confidence"

**Ranking:**
- `rank_results(results)` - Rank by score
- `select_top_k(results, k)` - Select top K results

## Example Programs

### 1. Hello World (hello.ml)

Basic example showing encoding, sampling, and detokenization:

```mindlang
query "Hello world"
encode q -> z
sample z 0.5 -> output
detokenize output -> result
```

Run: `npx ts-node src/main.ts examples/hello.ml`

### 2. Parallel Reasoning (parallel_reasoning.ml)

Multi-path reasoning with three independent branches:

```mindlang
query "What is 2+2?"
encode q -> z
fork z -> {z_analytical, z_creative, z_empirical}
ensemble [0.7, 0.2, 0.1] [path_a, path_b, path_c] -> result
critique result -> delta
sample delta 0.9 -> output
detokenize output -> korean_text
```

Run: `npx ts-node src/main.ts examples/parallel_reasoning.ml --trace`

### 3. Ensemble Voting (ensemble_voting.ml)

Multiple reasoning paths with consensus voting:

```mindlang
query "What is the capital of France?"
encode input -> z
fork z -> {z_path_a, z_path_b, z_path_c}
weighted_vote [path_a, path_b, path_c] -> consensus
detokenize consensus -> output
```

Run: `npx ts-node src/main.ts examples/ensemble_voting.ml --dump-bc`

### 4. Self-Critique (self_critique.ml)

Iterative refinement through self-critique:

```mindlang
query problem
encode q -> z
initial_solve z -> result
loop {
  critique result -> delta
  if confidence(delta) > 0.9 {
    break
  }
  result = retry_with_feedback(result, delta)
}
detokenize result -> output
```

Run: `npx ts-node src/main.ts examples/self_critique.ml --profile`

### 5. AI Agent (ai_agent.ml)

Complete agent with reasoning, ensemble, and feedback:

```mindlang
z = encode(input)
fork z -> {z_a, z_b, z_c}
ensemble_result = combine_weighted(weights, outputs)
critique = critique_result(ensemble_result)
if critique["confidence"] < 0.8 {
  return agent_think_recursive(input, feedback)
}
return detokenize(ensemble_result)
```

Run: `npx ts-node src/main.ts examples/ai_agent.ml`

## Troubleshooting

### Issue: "Cannot find module 'typescript'"

**Solution:**
```bash
npm install
npm install --save-dev typescript
```

### Issue: "Cannot read file"

**Verify file exists:**
```bash
ls -la examples/hello.ml
```

**Use absolute path:**
```bash
npx ts-node src/main.ts /absolute/path/to/file.ml
```

### Issue: "Tests failing"

**Run specific test to debug:**
```bash
npx jest --testNamePattern="hello" --verbose
```

**Check test output:**
```bash
npm test 2>&1 | head -50
```

### Issue: Slow execution

**Check for syntax errors in .ml files:**
- Verify query strings are quoted: `query "text"`
- Check operation syntax: `operation arg1 -> var`

**Profile execution:**
```bash
npx ts-node src/main.ts examples/file.ml --profile
```

### Issue: Unexpected output

**Enable trace mode to see step-by-step execution:**
```bash
npx ts-node src/main.ts examples/file.ml --trace
```

**View bytecode representation:**
```bash
npx ts-node src/main.ts examples/file.ml --dump-bc
```

## Performance Considerations

### Operation Complexity

- Encoding: O(n) where n = query length
- Sampling: O(m) where m = latent dimension
- Fork/Ensemble: O(k) where k = number of branches
- Detokenize: O(p) where p = output size

### Typical Execution Times

- Hello world: ~5-10ms
- Parallel reasoning: ~20-40ms
- Full agent pipeline: ~50-100ms

### Optimization Tips

1. **Reduce fork depth:** Limit nested forks
2. **Use adaptive weights:** Reduce unnecessary branches
3. **Cache results:** Store intermediate computations
4. **Profile regularly:** Monitor performance with `--profile`

## Development

### Adding New Operations

1. Add parser logic in `MindLangParser.parseOperation()`
2. Add interpreter logic in `MindLangInterpreter.executeOperation()`
3. Add tests in `tests/integration.test.ts`
4. Update documentation

### Adding Standard Library Functions

1. Create function in `stdlib/*.ml`
2. Add type signatures and comments
3. Export function from module
4. Add usage examples

### Running Linter

```bash
npm run lint
```

### Cleaning Build Artifacts

```bash
npm run clean
```

## Statistics

### Code Metrics

- Total lines of code: 1,500+
- TypeScript (CLI + tests): ~450 lines
- MindLang stdlib: ~600 lines
- Example programs: ~260 lines
- Test suite: 30+ test cases

### Test Coverage

- Parser: 9 test cases
- Interpreter: 11 test cases
- Examples: 10 test cases
- Standard Library: 8 test cases
- Performance: 3 test cases
- Edge Cases: 5 test cases
- Integration Pipelines: 4 test cases

## Future Enhancements

- [ ] Distributed execution across multiple machines
- [ ] GPU acceleration for matrix operations
- [ ] Interactive REPL mode
- [ ] Visualization of reasoning paths
- [ ] Performance optimization compiler
- [ ] Integration with external LLM APIs
- [ ] Debugging interface
- [ ] Package manager for libraries

## License

MIT

## References

### MindLang Specification

See `/spec` directory for language specification.

### Related Work

- Multi-path reasoning in language models
- Ensemble learning methods
- Parallel computation patterns
- Self-critique mechanisms

## Support

For issues or questions:

1. Check examples for usage patterns
2. Run with `--trace` to debug
3. Review test cases for implementation details
4. Check troubleshooting section above
