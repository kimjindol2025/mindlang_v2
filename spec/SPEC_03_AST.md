# MindLang: Abstract Syntax Tree (AST)

## 1. Core Node Types

### 1.1 QueryNode: Input Representation

```typescript
interface QueryNode extends Node {
  type: 'QueryNode',
  id: NodeId,

  // Query embedding from input tokens
  embedding: Vec<f64>,              // q ∈ ℝ^d
  semanticContent: string,          // original text for debugging
  confidence: f64,                  // input confidence in [0, 1]

  // Metadata
  sourceLength: number,             // |tokens| in original input
  encodeTime: number,               // ms to encode

  // Child
  next: LatentNode,
}
```

**Semantics**: Represents the initial query q from raw input. Acts as source of computation.

### 1.2 LatentNode: Encoded Representation

```typescript
interface LatentNode extends Node {
  type: 'LatentNode',
  id: NodeId,

  // Latent vector from encoder
  latent: Vec<f64>,                 // z ∈ ℝ^m
  latentDim: number,                // m

  // Encoder parameters
  encoderWeights: Matrix,           // W_enc ∈ ℝ^(m×d)
  encoderBias: Vec<f64>,            // b_enc ∈ ℝ^m
  activationFunc: 'relu' | 'tanh' | 'linear',

  // Reconstruction (optional)
  reconstructed?: Vec<f64>,         // q_recon = D(z)
  reconstructionError?: f64,        // ‖q - q_recon‖₂

  // Children
  paths: [PathNode_A, PathNode_B, PathNode_C],
}
```

**Semantics**: Represents z, the latent essence of the query.

### 1.3 PathNode: Individual Reasoning Path

```typescript
interface PathNode extends Node {
  type: 'PathNode',
  id: NodeId,
  pathType: 'analytical' | 'creative' | 'empirical',

  // Path-specific latent
  output: Vec<f64>,                 // z_a or z_b or z_c

  // Projection parameters
  projectionMatrix: Matrix,         // W_p ∈ ℝ^(m×m)
  projectionBias: Vec<f64>,         // b_p ∈ ℝ^m
  activation: 'relu' | 'tanh' | 'sigmoid' | 'linear',

  // For creative path: noise
  noise?: Vec<f64>,                 // ε ~ N(0, σ²I)
  noiseScale?: f64,

  // Confidence in this path
  internalScore: f64,               // ‖output‖² or similar
  estimatedAccuracy?: f64,          // [0, 1]

  // Parent and next
  parent: LatentNode,
  next: EnsembleNode,
}
```

**Semantics**: Represents each of z_a, z_b, z_c as independent reasoning branches.

**Parallelism**: Three PathNodes can be computed in parallel.

### 1.4 WeightNode: Dynamic Attention

```typescript
interface WeightNode extends Node {
  type: 'WeightNode',
  id: NodeId,

  // Attention mechanism
  attentionMatrix: Matrix,          // W_attn ∈ ℝ^(3×m)
  attentionBias: Vec<f64>,          // b_attn ∈ ℝ³

  // Input and output
  input: Vec<f64>,                  // z (latent from parent)
  logits: Vec<f64>,                 // 3-dim vector

  // Final weights (simplex constrained)
  weights: {
    alpha: f64,                     // α ∈ [0, 1]
    beta: f64,                      // β ∈ [0, 1]
    gamma: f64,                     // γ ∈ [0, 1]
  },

  // Interpretation
  dominantPath: 'analytical' | 'creative' | 'empirical',
  entropy: f64,                     // entropy of [α, β, γ]

  // Parent
  parent: LatentNode,
}
```

**Semantics**: Computes dynamic weights for ensemble combination.

### 1.5 EnsembleNode: Path Combination

```typescript
interface EnsembleNode extends Node {
  type: 'EnsembleNode',
  id: NodeId,

  // Inputs
  paths: [Vec<f64>, Vec<f64>, Vec<f64>],  // [z_a, z_b, z_c]
  weights: {alpha: f64, beta: f64, gamma: f64},

  // Output
  result: Vec<f64>,                 // z_ens = α·z_a + β·z_b + γ·z_c

  // Contribution analysis
  contributionA: Vec<f64>,          // α · z_a
  contributionB: Vec<f64>,          // β · z_b
  contributionC: Vec<f64>,          // γ · z_c

  // Magnitude
  magnitude: f64,                   // ‖z_ens‖₂
  normalized: Vec<f64>,             // z_ens / ‖z_ens‖₂

  // Next stages
  nextCritique: CritiqueNode,
}
```

**Semantics**: Linearly combines the three paths with learned weights.

### 1.6 CritiqueNode: Self-Evaluation

```typescript
interface CritiqueNode extends Node {
  type: 'CritiqueNode',
  id: NodeId,

  // Critique network
  network: {
    hidden1?: Vec<f64>,
    hidden2?: Vec<f64>,
  },
  weights: {
    w1: Matrix,                     // W₁ ∈ ℝ^(m'×m)
    w2?: Matrix,                    // W₂ ∈ ℝ^(m'×m')
    wFinal: Vec<f64>,               // W₃ ∈ ℝ^(1×m')
  },
  biases: {
    b1: Vec<f64>,
    b2?: Vec<f64>,
    bFinal: f64,
  },

  // Input and output
  input: Vec<f64>,                  // z_ens
  confidence: f64,                  // δ ∈ [-1, 1]

  // Interpretation
  confidenceCategory: 'veryLow' | 'low' | 'medium' | 'high' | 'veryHigh',
  shouldRetry: boolean,             // if |δ| < threshold_low
  reweightSuggestion?: {            // if retry
    alphaNew: f64,
    betaNew: f64,
    gammaPrev: f64,
  },

  // Next
  nextSample: SampleNode,
}
```

**Semantics**: Evaluates confidence in the current ensemble result. Triggers retry if needed.

### 1.7 SampleNode: Probabilistic Selection

```typescript
interface SampleNode extends Node {
  type: 'SampleNode',
  id: NodeId,

  // Input
  latent: Vec<f64>,                 // z_ens

  // Distribution computation
  vocabWeights: Matrix,             // W_vocab ∈ ℝ^(|V|×m)
  vocabBias: Vec<f64>,              // b_vocab ∈ ℝ^|V|
  logits: Vec<f64>,                 // logits_tokens

  // Probability
  distribution: Vec<f64>,           // p ∈ [0,1]^|V|
  temperature: f64,                 // T for softmax sharpness

  // Threshold-based filtering
  threshold: f64,                   // θ
  candidates: number[],             // indices where p_i > θ
  candidateProbabilities: Vec<f64>, // renormalized

  // Sampled token
  sampledTokenIndex: number,        // token id
  sampledTokenProb: f64,            // p[token_id]

  // Next
  nextDetokenize: DetokenizeNode,
}
```

**Semantics**: Samples next token from confidence-weighted distribution.

### 1.8 DetokenizeNode: Output Generation

```typescript
interface DetokenizeNode extends Node {
  type: 'DetokenizeNode',
  id: NodeId,

  // Input
  latent: Vec<f64>,                 // z_ens
  previousTokens: string[],         // context for korean generation

  // Korean morphology
  morphemes: {
    stem: string,
    pos: PartOfSpeech,
    affixes: string[],
    particles: string[],
  },

  // Linguistic processing
  dependency: DependencyStructure,
  clauses: Clause[],

  // Output
  koreanText: string,               // detokenized korean
  confidence: f64,                  // in surface realization

  // For iteration
  tokenCount: number,
  isComplete: boolean,              // end of sequence?
}
```

**Semantics**: Converts latent z_ens into coherent Korean text.

## 2. Recursive Tree Structure

### 2.1 Complete Program Tree

```
Program:
  └─ QueryNode
      └─ LatentNode
          ├─ PathNode_A ─┐
          ├─ PathNode_B  ├─ WeightNode ─┐
          ├─ PathNode_C ─┘              │
          └─────────────────────────────┴─ EnsembleNode
                                              └─ CritiqueNode
                                                  └─ SampleNode
                                                      └─ DetokenizeNode
                                                          [Iteration loop]
```

### 2.2 Iteration for Multi-Token Generation

```
Program (for sequence length L):
  └─ QueryNode (input)
      └─ LatentNode (encode once)
          └─ [Loop i = 1 to L]
              ├─ Iteration_i
              │   ├─ PathNode_A ─┐
              │   ├─ PathNode_B  ├─ WeightNode ─┐
              │   ├─ PathNode_C ─┘              │
              │   └─────────────────────────────┴─ EnsembleNode
              │                                     └─ CritiqueNode
              │                                         └─ SampleNode
              │                                             └─ DetokenizeNode_i
              │
              └─ [Update context for next iteration]
```

### 2.3 Recursive Sub-Programs (PostMindLang)

For future extensions, allow recursive calls:

```typescript
interface RecursiveCallNode extends Node {
  type: 'RecursiveCallNode',
  id: NodeId,

  // Sub-program reference
  subProgramId: string,             // name of sub-program
  subProgram: Program,              // AST of sub-program

  // Arguments
  arguments: Vec<f64>[],            // latent vectors passed

  // Return value
  result: Vec<f64>,                 // latent from sub-program

  // Recursion depth
  depth: number,
  maxDepth: number,
}
```

## 3. Type Annotations

### 3.1 Basic Types

```typescript
// Primitive types
type f64 = number;                  // 64-bit float
type i32 = number;                  // 32-bit int
type bool = boolean;

// Vector types
type Vec<T> = T[];
type Vec<f64> = number[];
type Matrix = number[][];

// Probability types
type Probability = f64;             // ∈ [0, 1]
type LogProbability = f64;          // log(p)
type Simplex<N> = f64[];            // N-dim, sums to 1

// Node types
type NodeId = string | number;
type Node = QueryNode
          | LatentNode
          | PathNode
          | WeightNode
          | EnsembleNode
          | CritiqueNode
          | SampleNode
          | DetokenizeNode;

// Special types
type PartOfSpeech = 'N' | 'V' | 'Adj' | 'Adv' | 'Punct' | ...;
type DependencyStructure = {
  head: NodeId,
  dependent: NodeId[],
  relation: string,
}[];
```

### 3.2 Type Constraints

```typescript
// Path outputs must be latent space
constraint PathNode.output: Vec<f64> with ‖output‖ ∈ [0, ∞)

// Weights must form valid simplex
constraint WeightNode.weights: Simplex<3> with
  α + β + γ = 1
  α, β, γ ≥ 0

// Confidence must be in valid range
constraint CritiqueNode.confidence: f64 with
  confidence ∈ [-1, 1]

// Probabilities must sum to 1
constraint SampleNode.distribution: Vec<f64> with
  Σ distribution_i = 1
  ∀i: distribution_i ∈ [0, 1]
```

## 4. Example AST Trees

### Example 1: Simple Question Answering

```
Query: "한국의 수도는?"

Program:
  └─ QueryNode (embedding: "what-is-capital-korea")
      └─ LatentNode (z: compressed semantic vector)
          ├─ PathNode_A: analytical search through knowledge
          ├─ PathNode_B: creative associations
          ├─ PathNode_C: pattern matching from training
          └─ WeightNode: α=0.8, β=0.1, γ=0.1 (analytical dominant)
              └─ EnsembleNode: z_ens = 0.8·z_a + 0.1·z_b + 0.1·z_c
                  └─ CritiqueNode: δ=0.95 (very confident)
                      └─ SampleNode:
                          token_1 = "서울" (p=0.87)
                          └─ DetokenizeNode: "서울"
                              └─ [Output complete]
```

### Example 2: Creative Generation with Self-Critique

```
Query: "새로운 시 한 편을 지어줘"

Program:
  └─ QueryNode (embedding: "write-new-poem")
      └─ LatentNode (z: creative task representation)
          ├─ PathNode_A: rule-based poetry structure
          ├─ PathNode_B: novel word combinations (noise added)
          ├─ PathNode_C: learned poetic patterns
          └─ WeightNode: α=0.2, β=0.6, γ=0.2 (creative dominant)
              └─ EnsembleNode: z_ens = 0.2·z_a + 0.6·z_b + 0.2·z_c
                  └─ CritiqueNode: δ=0.15 (uncertain)
                      ├─ [Low confidence: retry]
                      ├─ WeightNode: α'=0.1, β'=0.7, γ'=0.2 (more creative)
                      └─ EnsembleNode: z_ens' (recomputed)
                          └─ CritiqueNode: δ'=0.45 (better)
                              └─ SampleNode: token ~ broad distribution
                                  └─ DetokenizeNode: [Generate poem line]
                                      └─ [Continue for L lines]
```

### Example 3: Multi-Path Divergence and Convergence

```
Query: "AI 윤리에 대해 설명해"

Program:
  └─ QueryNode
      └─ LatentNode (z: AI ethics)
          ├─ PathNode_A: philosophical arguments (logical)
          ├─ PathNode_B: societal implications (creative/speculative)
          ├─ PathNode_C: empirical case studies (statistical)
          └─ WeightNode: α=0.4, β=0.2, γ=0.4 (balanced)
              └─ EnsembleNode
                  ├─ contrib_A = 0.4 · [logical framework]
                  ├─ contrib_B = 0.2 · [speculative thoughts]
                  ├─ contrib_C = 0.4 · [empirical data]
                  └─ z_ens = [integrated multi-perspective view]
                      └─ CritiqueNode: δ=0.68 (reasonably confident)
                          └─ SampleNode
                              ├─ Token 1: "AI 윤리는"
                              ├─ Token 2: "다각도로"
                              ├─ Token 3: "접근해야"
                              └─ ... (multi-token generation)
```

## 5. Traversal Algorithms

### 5.1 Depth-First Traversal

```pseudo
function traverse_dfs(node: Node, depth: i32) {
  print(indent(depth) + node.type)

  match node {
    QueryNode: traverse_dfs(node.next, depth+1)
    LatentNode:
      for path in node.paths:
        traverse_dfs(path, depth+1)
    PathNode: traverse_dfs(node.next, depth+1)
    WeightNode: traverse_dfs(node.parent, depth+1)
    EnsembleNode: traverse_dfs(node.nextCritique, depth+1)
    CritiqueNode: traverse_dfs(node.nextSample, depth+1)
    SampleNode: traverse_dfs(node.nextDetokenize, depth+1)
    DetokenizeNode: (leaf)
  }
}
```

### 5.2 Parallel Traversal

```pseudo
function traverse_parallel(node: Node) {
  match node {
    LatentNode:
      // Fork 3 threads
      parallel {
        compute(node.paths[0])
        compute(node.paths[1])
        compute(node.paths[2])
      }
      // Join before ensemble
      barrier()

    // Rest sequential
  }
}
```

## 6. Type System Summary

| Node Type | Input | Output | Type |
|-----------|-------|--------|------|
| QueryNode | tokens | q ∈ ℝ^d | Q |
| LatentNode | q | z ∈ ℝ^m | Z |
| PathNode_A | z | z_a ∈ ℝ^m | Z |
| PathNode_B | z | z_b ∈ ℝ^m | Z |
| PathNode_C | z | z_c ∈ ℝ^m | Z |
| WeightNode | z | [α,β,γ] | Δ³ |
| EnsembleNode | [z_a,z_b,z_c],[α,β,γ] | z_ens ∈ ℝ^m | Z |
| CritiqueNode | z_ens | δ ∈ [-1,1] | [-1,1] |
| SampleNode | z_ens | token ∈ T | T |
| DetokenizeNode | z_ens | text ∈ O | O |

---

**Cross-references**:
- SPEC_01_CONCEPTS.md for semantics
- SPEC_04_BYTECODE.md for execution model
