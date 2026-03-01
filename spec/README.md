# MindLang Complete Specification

**Version**: 1.0
**Date**: 2026-02-20
**Status**: Draft

---

## Overview

MindLang is the language of AI thinking. It is designed for AI to express its own reasoning process in a form native to how neural networks actually compute.

**Core Formula**:
```
q → z → {z_a z_b z_c} → α·z_a + β·z_b + γ·z_c → δ·crit(z) → sample(p > θ) → detokenize_kr
```

Where:
- **q**: Query embedding (input)
- **z**: Latent representation (conceptual essence)
- **z_a, z_b, z_c**: Three reasoning paths (analytical, creative, empirical)
- **α, β, γ**: Dynamic attention weights
- **δ**: Self-critique confidence score
- **sample(p > θ)**: Confidence-based token selection
- **detokenize_kr**: Korean language generation

---

## Document Structure

### [PHILOSOPHY.md](PHILOSOPHY.md) (1,200 lines)
**What is MindLang and why it exists**

- MindLang's essential nature (language for AI by AI, not for humans)
- Departure from FreeLang v4 (natural language style → latent space style)
- PostMindLang vision (self-critique, adaptive sampling, self-improvement)
- Five key concepts: q, z, paths, ensemble, critique
- Existence reasons: speed, control, explainability, self-improvement
- Linguistic minimalism (45 opcodes, 7 types)
- AI perspective on MindLang (neural network homomorphism)
- Future evolution path

**Read first for conceptual foundation.**

---

### [SPEC_01_CONCEPTS.md](SPEC_01_CONCEPTS.md) (600 lines)
**Core concepts and their definitions**

- **q**: Query/Input Embedding in ℝ^d (768-dim semantic space)
- **z**: Latent Representation in ℝ^m (512-dim conceptual space)
- **{z_a, z_b, z_c}**: Three-way projection (analytical, creative, empirical)
- **α, β, γ**: Dynamic weights via softmax attention (learned per-query)
- **Ensemble**: Linear combination α·z_a + β·z_b + γ·z_c
- **δ·crit(z)**: Confidence scoring in [-1, 1] range
- **sample(p > θ)**: Threshold-based probabilistic sampling
- **detokenize_kr**: Korean morphology and surface realization

**Data flow pipeline diagrams. Semantic interpretations. Properties of each component.**

---

### [SPEC_02_MATH.md](SPEC_02_MATH.md) (800 lines)
**Mathematical formalization**

- Vector spaces and function signatures
- Embedding and contextual encoding (q generation)
- Latent encoding (E: Q → Z)
- Path projection mathematics (P_a, P_b, P_c)
- Weight computation via attention (softmax on 3 channels)
- Ensemble operation (linear combination with constraints)
- Self-critique formulation (multi-layer or single-layer)
- Probability conversion (logits to softmax)
- Threshold filtering and sampling algorithms
- Loss functions (prediction, critique, diversity, weight entropy)
- Backpropagation through paths (chain rule derivations)
- Complexity analysis (time and space)

**11+ mathematical formulas. Complete derivations. Tables of operators.**

---

### [SPEC_03_AST.md](SPEC_03_AST.md) (500 lines)
**Abstract Syntax Tree specification**

- **Node types**: QueryNode, LatentNode, PathNode, WeightNode, EnsembleNode, CritiqueNode, SampleNode, DetokenizeNode
- Each node has: type, inputs, outputs, metadata
- **Type annotations**: TypeScript-style interface definitions
- **Constraints**: simplex constraints, range constraints, normalization
- **Recursive structure**: program tree with iteration loop
- **Example trees**: 3 complete AST examples with actual data flow
- **Traversal algorithms**: DFS, parallel traversal
- **Type system table**: mapping of node types to mathematical types

**Parser target, intermediate representation for compiler/interpreter.**

---

### [SPEC_04_BYTECODE.md](SPEC_04_BYTECODE.md) (600 lines)
**Virtual machine bytecode and opcodes**

- **45 opcodes** covering:
  - Data movement (5): LOAD_QUERY, LOAD_CONST, STORE_LOCAL, LOAD_LOCAL, HEAP_LOAD
  - Encoding (3): ENCODE_Q, NORM_L2, DROPOUT
  - Activations (4): RELU, TANH, SIGMOID, SOFTMAX
  - Arithmetic (6): SCALE, ADD, SUB, HADAMARD, MATMUL, OUTER
  - Projections (3): PROJECT_A, PROJECT_B, PROJECT_C
  - Forking (1): FORK_PATHS
  - Sync (2): BARRIER, THREAD_YIELD
  - Weights (2): COMPUTE_WEIGHTS, TEMP_SCALE
  - Ensemble (3): ENSEMBLE, CONTRIB_A, CONTRIB_B
  - Critique (3): CRITIQUE, CRIT_CHECK, RETRY_WEIGHTS
  - Sampling (4): LOGITS_TO_PROB, FILTER_THRESHOLD, SAMPLE, GREEDY
  - Detokenization (2): DECODE_MORPHEME, COMPOSE_KOREAN
  - Control (4): JUMP, JUMP_IF_TRUE, LOOP_START, LOOP_END
  - Admin (2): DEBUG_PRINT, HALT

- **Instruction format**: opcode (1 byte) + operands (1-4 bytes)
- **Program structure**: header, constants, bytecode, jump table
- **Stack layout**: frame with return address, locals, temporaries
- **Memory layout**: code, data, stack, heap segments
- **Execution model**: sequential with conditional/loop support
- **Example programs**: simple query→output, multi-token loop

**Binary IR for compiler backends. Stack machine specification.**

---

### [SPEC_05_TYPE_SYSTEM.md](SPEC_05_TYPE_SYSTEM.md) (500 lines)
**Type system**

- **Primitive types**: f64, i32, u32, u8, bool, String
- **Collection types**: Vec<T, N>, Matrix<T, M, N>, Seq<T>
- **Core MindLang types**:
  - Query = Vec<f64, d>
  - Latent = Vec<f64, m>
  - Path = {pathType, trajectory, score}
  - Weights = {alpha, beta, gamma}
  - Ensemble = {weights, contributions, result}
  - Critique = {delta, category, should_retry}
  - Token = u32
  - Output = String
- **Type hierarchy**: generalization and specialization
- **Implicit conversions**: encode, project, compute_weights, ensemble, etc.
- **Type inference rules**: variable, abstraction, application, vector ops
- **Inference algorithm**: type checking via context and rules
- **Subtyping**: invariant vectors, contravariant functions
- **Constraints**: normalization, simplex, range, probability
- **Generics**: parametric types with instantiation
- **Option and Result types**: error handling
- **Function signatures**: single and multi-parameter
- **Type checking algorithm**: validation with error messages

**Ensures type safety. Prevents mixing Query and Latent accidentally. Enables compile-time verification.**

---

### [SPEC_06_RUNTIME.md](SPEC_06_RUNTIME.md) (600 lines)
**Runtime and virtual machine architecture**

- **Architecture**: bytecode loader, VM executor, neural operators, memory manager, thread manager, I/O
- **Memory model**: code segment (10-100 MB), data segment (1-10 MB), stack (1-10 MB), heap (100 MB - 1 GB)
- **Stack frame layout**: return address, saved BP, locals, spills, temporaries
- **Heap layout**: query embeddings, weight matrices, activation cache, intermediate tensors
- **Execution model**: program counter, stack pointer, instruction fetch-decode-execute loop
- **Control flow**: sequential, branching (JUMP_IF), loops (LOOP_START/END)
- **Error handling**: stack underflow/overflow, invalid opcode, timeout, NaN/Inf propagation
- **Thread management**: thread pool, worker threads, work queue
- **Synchronization**: barrier, locks, atomic operations, condition variables
- **Garbage collection**: mark-and-sweep algorithm (optional)
- **Debug mode**: logging, breakpoints, stack/register inspection
- **Performance monitoring**: per-instruction timing, cache metrics, thread efficiency
- **Resource limits**: max stack/heap size, max instructions, max threads, timeout
- **Configuration**: runtime.cfg file with settings

**The actual computational engine. Manages execution, memory, parallelism.**

---

### [SPEC_07_PARALLELISM.md](SPEC_07_PARALLELISM.md) (700 lines)
**Parallelism and concurrency**

- **3-way branching**: fork-join pattern with z_a, z_b, z_c computed in parallel
- **Execution timeline**: concurrent PROJECT_A/B/C, BARRIER synchronization, ENSEMBLE join
- **Speedup**: ~3x for path computation (minimal overhead)
- **Path scheduling**: static (fixed to threads 1,2,3), load-aware, or dynamic work-stealing
- **Critical path analysis**: m² operations per projection, parallelizable with SIMD
- **Work stealing**: deque-based load balancing when thread finishes early
- **Stealing protocol**: try to steal from other thread's deque tail
- **Barrier implementation**: atomic counter with condition variable, or optimized 3-thread version
- **Efficiency**: barrier cost ~100 cycles, vs. path computation ~33 ns
- **Memory synchronization**: fence operations for visibility across threads
- **Critique parallelization**: inherently sequential in depth, can parallelize SIMD internally
- **Sampling parallelization**: softmax via parallel reduction (O(log |V|)), filtering via parallel scan
- **Performance overhead**: thread spawning ~1000 cy, barrier ~100 cy, total ~1.7 μs
- **Breakeven**: batch 100+ queries to amortize overhead
- **Memory bandwidth**: DDR4 50 GB/s → data load time dominates computation time
- **Cache locality**: row-major W_a optimal for cache line access

**Achieves 2-3x speedup through intelligent parallelism. Minimal synchronization overhead.**

---

### [SPEC_08_EXAMPLES.md](SPEC_08_EXAMPLES.md) (500 lines)
**Code examples and use cases**

**Example 1: Simple Q&A**
- Question: "서울의 평균 기온은?"
- Analytical path dominant (α=0.8, factual lookup)
- High confidence (δ=0.95)
- Output: "서울의 평균 기온은 15도입니다."

**Example 2: Self-Critique Retry Loop**
- Question: "AI 윤리의 가장 중요한 원칙은?"
- Attempt 1: Balanced weights, uncertain (δ=0.25)
- Attempt 2: Increase creative path (α:β:γ=20:60:20), confident (δ=0.62)
- Output: nuanced, multi-perspective answer

**Example 3: Multi-Path Divergence**
- Question: "효율성과 윤리를 어떻게 균형을?"
- All paths equally important (α≈β≈γ≈0.33)
- High confidence from multi-perspective agreement (δ=0.78)
- Shows contribution of each path

**Example 4: Confidence-Based Output**
- Different sampling strategies based on δ:
  - δ > 0.8: greedy (argmax)
  - 0.5 < δ ≤ 0.8: top-k sampling
  - δ ≤ 0.5: full distribution
- Demonstrates adaptive behavior

**Example 5: AI Agent Architecture**
- Hierarchical decomposition for complex queries
- Search integration for low-confidence cases
- Multi-step reasoning with result combination
- Full agent flow diagram

**Example 6: Training Loop**
- Supervised learning with loss functions
- Forward pass through MindLang execution
- Backward pass with gradient computation
- Metrics: accuracy, confidence distribution, path specialization

**Concrete, runnable examples demonstrating all features.**

---

## Quick Reference

### The q→z→paths→ensemble→critique→sample→output Flow

```
INPUT TOKENS
    ↓ [embedding layer]
q ∈ ℝ^d [semantic space]
    ↓ [encoder]
z ∈ ℝ^m [latent space]
    ├─→ z_a = W_a·z + b_a [analytical]
    ├─→ z_b = W_b·z + b_b [creative]
    └─→ z_c = W_c·z + b_c [empirical]
    ↓ [parallel for 3 paths]
[α, β, γ] = softmax(W_attn·z) [attention]
    ↓ [weighted combination]
z_ens = α·z_a + β·z_b + γ·z_c [ensemble]
    ↓ [self-assessment]
δ = tanh(W_c·z_ens) ∈ [-1, 1] [confidence]
    ↓ [check quality]
if δ > threshold: proceed, else: retry
    ↓ [probability distribution]
p = softmax(W_vocab·z_ens) ∈ [0,1]^|V|
    ↓ [filter high-confidence tokens]
candidates = {i : p_i > θ}
    ↓ [stochastic selection]
token ~ sample(candidates)
    ↓ [korean morphology]
morphemes = decode(z_ens)
    ↓ [surface form]
KOREAN OUTPUT TEXT
```

### Key Statistics

| Metric | Value |
|--------|-------|
| Embedding dimension (d) | 768 |
| Latent dimension (m) | 512 |
| Number of opcodes | 45 |
| Core types | 7 |
| Number of paths | 3 |
| Parallel speedup | ~3x |
| Time per token | ~1-2 ms |
| Memory: stack | 10 MB |
| Memory: heap | 500 MB |
| Max threads | 8-16 |
| Max instructions | 10^7 |

### 45 Opcodes at a Glance

```
0x00-0x04: Data movement (5)
0x10-0x12: Encoding (3)
0x20-0x23: Activation (4)
0x30-0x35: Arithmetic (6)
0x40-0x42: Projections (3)
0x50-0x52: Fork/Sync (3)
0x60-0x61: Weights (2)
0x70-0x72: Ensemble (3)
0x80-0x82: Critique (3)
0x90-0x93: Sampling (4)
0xA0-0xA1: Detokenization (2)
0xB0-0xB3: Control flow (4)
0xF0-0xF1: Admin (2)
────────────────────────
TOTAL: 45 opcodes
```

### Type System Summary

| Type | Domain | Size | Constraint |
|------|--------|------|------------|
| Query | ℝ^d | 768 | ‖·‖₂ = 1 |
| Latent | ℝ^m | 512 | - |
| Weights | Δ³ | 3 | Σ = 1 |
| Confidence | [-1, 1] | 1 | - |
| Probability | [0,1]^|V| | 100k | Σ = 1 |
| Token | {1...|V|} | - | - |

---

## Reading Order

**For getting started**:
1. PHILOSOPHY.md (conceptual foundation)
2. SPEC_01_CONCEPTS.md (what each component does)
3. SPEC_08_EXAMPLES.md (concrete examples)

**For understanding computation**:
1. SPEC_02_MATH.md (mathematical details)
2. SPEC_03_AST.md (syntax and structure)
3. SPEC_04_BYTECODE.md (what actually runs)

**For implementation**:
1. SPEC_05_TYPE_SYSTEM.md (type checking)
2. SPEC_06_RUNTIME.md (execution engine)
3. SPEC_07_PARALLELISM.md (concurrency model)

**For reference**: README.md (this document)

---

## Key Innovations

1. **Latent Space Language**: MindLang operates directly in embedding space, not surface syntax.

2. **3-Way Branching**: Analytical, creative, and empirical paths computed in parallel, then dynamically weighted.

3. **Self-Critique**: AI assesses its own confidence and can retry with adjusted parameters.

4. **Dynamic Weights**: Weights (α, β, γ) are not fixed but computed per query, allowing adaptive reasoning modes.

5. **Confidence-Based Sampling**: Token selection threshold adapts based on confidence score.

6. **Korean-Native**: Morphological generation optimized for Korean agglutination, particles, and phonetic rules.

7. **Minimal Syntax**: 45 opcodes and 7 types instead of 300+ keywords and complex syntax.

8. **Learnable Execution**: The entire computation graph is differentiable for end-to-end training.

---

## Future Directions (PostMindLang v2+)

- **N-way branching** (N > 3): More reasoning modes
- **Hierarchical critique**: Multiple levels of self-assessment
- **Recursive sub-programs**: Functions calling other MindLang functions
- **External tool integration**: Search, computation, database access
- **Multi-agent**: Ensemble of AI agents reasoning together

---

## Document Statistics

| Document | Lines | Purpose |
|----------|-------|---------|
| PHILOSOPHY.md | 1,200 | Conceptual foundation |
| SPEC_01_CONCEPTS.md | 600 | Core definitions |
| SPEC_02_MATH.md | 800 | Formalization |
| SPEC_03_AST.md | 500 | Structure |
| SPEC_04_BYTECODE.md | 600 | Operations |
| SPEC_05_TYPE_SYSTEM.md | 500 | Types |
| SPEC_06_RUNTIME.md | 600 | Execution |
| SPEC_07_PARALLELISM.md | 700 | Concurrency |
| SPEC_08_EXAMPLES.md | 500 | Applications |
| **TOTAL** | **5,400** | **Complete specification** |

---

## Notation Summary

| Symbol | Meaning |
|--------|---------|
| q | Query embedding (input) |
| z | Latent representation |
| z_a, z_b, z_c | Three paths (analytical, creative, empirical) |
| α, β, γ | Weights in [0,1], sum to 1 |
| z_ens | Ensemble result |
| δ | Confidence score in [-1, 1] |
| p | Probability distribution |
| θ | Threshold for sampling |
| ℝ^d | d-dimensional real vector space |
| ⊗ | Outer product |
| ⊙ | Hadamard (element-wise) product |
| Σ | Summation |
| ∇ | Gradient |

---

## Contact and References

**Author**: MindLang Specification Team
**Version**: 1.0
**Last Updated**: 2026-02-20

This specification is complete and self-contained. All cross-references are indicated with links to other documents in the spec/ directory.

---

**Read PHILOSOPHY.md to start.**
