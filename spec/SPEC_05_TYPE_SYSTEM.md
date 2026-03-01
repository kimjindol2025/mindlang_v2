# MindLang: Type System

## 1. Core Type Definitions

### 1.1 Primitive Types

```rust
// Numeric types
type f64 = IEEE 754 64-bit floating point;
type i32 = signed 32-bit integer;
type u32 = unsigned 32-bit integer;
type u8  = unsigned 8-bit integer;
type bool = {true, false};

// String type (korean-aware)
type String = sequence of Unicode characters (UTF-8);

// Unit type
type unit = ();
```

### 1.2 Collection Types

```rust
// Vector: homogeneous sequence of fixed dimension
type Vec<T, N> = [T; N];  // N is known at compile time

Examples:
  type Query = Vec<f64, 768>;      // d = 768
  type Latent = Vec<f64, 512>;     // m = 512
  type Weights = Vec<f64, 3>;      // [α, β, γ]

// Matrix: 2D array (row-major)
type Matrix<T, M, N> = [T; M*N];

Examples:
  type ProjectionMatrix = Matrix<f64, 512, 512>;  // W_a ∈ ℝ^(m×m)
  type VocabWeights = Matrix<f64, |V|, 512>;      // W_vocab ∈ ℝ^(|V|×m)

// Dynamic vector (variable length)
type Seq<T> = [T];

Examples:
  type Tokens = Seq<u32>;          // variable length token sequence
  type Output = Seq<String>;       // variable length korean text
```

### 1.3 Fundamental MindLang Types

```rust
// Query embedding space
type Query = Vec<f64, d>;
constraint: ‖Query‖₂ = 1 (optional normalization)

// Latent representation space
type Latent = Vec<f64, m>;
where m < d (compressed)

// Single reasoning path
type Path = struct {
  pathType: PathType,              // 'analytical' | 'creative' | 'empirical'
  trajectory: Seq<Latent>,         // evolution of latent during computation
  score: f64,                      // confidence ∈ [0, 1]
  magnitude: f64,                  // ‖output‖₂
};

// Ensemble weights (probability simplex)
type Weights = struct {
  alpha: f64,     // ∈ [0, 1]
  beta: f64,      // ∈ [0, 1]
  gamma: f64,     // ∈ [0, 1]
};
constraint: alpha + beta + gamma = 1

// Ensemble result (combination of paths)
type Ensemble = struct {
  weights: Weights,
  contributionA: Latent,            // α · z_a
  contributionB: Latent,            // β · z_b
  contributionC: Latent,            // γ · z_c
  result: Latent,                   // z_ens = sum of contributions
  magnitude: f64,
  normalized: Latent,
};

// Critique/confidence assessment
type Critique = struct {
  delta: f64,                       // ∈ [-1, 1] confidence score
  confidence_category: ConfidenceLevel,  // 'very_low' | 'low' | ... | 'very_high'
  should_retry: bool,
  reweight_suggestion: Option<Weights>,
};

// Token representation
type Token = u32;                  // index into vocabulary
type TokenProb = struct {
  token: Token,
  probability: f64,                // p ∈ [0, 1]
  log_probability: f64,            // log(p)
};

// Output (korean text)
type Output = String;              // Korean text
type MorphemeSeq = Seq<Morpheme>;  // intermediate representation
```

## 2. Type Relationships and Conversions

### 2.1 Type Hierarchy

```
Type hierarchy (generalization ← specialization):

Vector
  ├─ Query (d-dimensional, semantic)
  └─ Latent (m-dimensional, conceptual)
      ├─ Path (reasoning-specific)
      └─ Ensemble (combined)

Numeric
  ├─ Probability (f64 ∈ [0, 1])
  ├─ Confidence (f64 ∈ [-1, 1])
  └─ Weight (f64 ∈ [0, 1])

Sequence
  ├─ Tokens (u32 sequence)
  ├─ Output (String)
  └─ Morphemes (Morpheme sequence)
```

### 2.2 Implicit Conversions

```rust
// Query → Latent (encoding)
fn encode(q: Query) → Latent:
  latent = W_enc · q + b_enc
  return latent

// Latent → Path (projection)
fn project_analytical(z: Latent) → Path:
  z_a = W_a · z + b_a
  return Path { pathType: 'analytical', trajectory: [z_a], score: 0.5 }

// Vec<Latent, 3> → Weights (attention)
fn compute_weights(z: Latent) → Weights:
  logits = W_attn · z + b_attn  // Vec<f64, 3>
  [α, β, γ] = softmax(logits)
  return Weights { alpha: α, beta: β, gamma: γ }

// (Weights, Vec<Latent, 3>) → Ensemble
fn ensemble(w: Weights, paths: [Latent; 3]) → Ensemble:
  result = w.alpha·paths[0] + w.beta·paths[1] + w.gamma·paths[2]
  return Ensemble { weights: w, result: result, ... }

// Latent → Critique
fn critique(z: Latent) → Critique:
  delta = tanh(W_c · z + b_c)
  confidence = abs(delta)
  return Critique { delta: delta, confidence_category: ..., ... }

// Latent → Probability
fn latent_to_prob(z: Latent) → Vec<f64, |V|>:
  logits = W_vocab · z + b_vocab
  p = softmax(logits)
  return p

// Vec<f64, |V|> → Token
fn sample(p: Vec<f64, |V|>, threshold: f64) → Token:
  candidates = [i | p[i] > threshold]
  token = sample_from_distribution(candidates, p)
  return token

// Latent → Output (String)
fn detokenize_kr(z: Latent) → Output:
  morphemes = morpheme_decoder(z)
  korean_text = surface_realization(morphemes)
  return korean_text
```

## 3. Type Inference Rules

### 3.1 Inference Algorithm

```
TypingContext Γ contains bindings: x: τ

Rule: Variable
  ────────────────────
  Γ ⊢ x: Γ(x)

Rule: Abstraction
  Γ, x: σ ⊢ e: τ
  ─────────────────────
  Γ ⊢ λx.e: σ → τ

Rule: Application
  Γ ⊢ f: σ → τ    Γ ⊢ e: σ
  ─────────────────────────────
  Γ ⊢ f e: τ

Rule: Vector Construction
  Γ ⊢ v₁: f64  ...  Γ ⊢ vₙ: f64
  ─────────────────────────────────
  Γ ⊢ [v₁, ..., vₙ]: Vec<f64, n>

Rule: Vector Indexing
  Γ ⊢ v: Vec<T, n>    Γ ⊢ i: u32    i < n
  ────────────────────────────────────────
  Γ ⊢ v[i]: T

Rule: Matrix Multiplication
  Γ ⊢ M: Matrix<f64, m, n>    Γ ⊢ v: Vec<f64, n>
  ──────────────────────────────────────────────────
  Γ ⊢ M·v: Vec<f64, m>
```

### 3.2 Type Inference Example

```
Program: z_ens = α·z_a + β·z_b + γ·z_c

Typing:
  1. z_a: Latent, Latent = Vec<f64, m>
  2. α: f64
  3. α·z_a: Vec<f64, m> (scalar-vector product)
  4. β·z_b: Vec<f64, m>
  5. γ·z_c: Vec<f64, m>
  6. α·z_a + β·z_b + γ·z_c: Vec<f64, m> (vector addition)
  ∴ z_ens: Vec<f64, m> = Latent ✓
```

## 4. Subtyping Rules

### 4.1 Subtyping Relation

```
"σ is subtype of τ" written as σ <: τ

Rules:

Reflexivity:    τ <: τ

Transitivity:   σ <: τ    τ <: ρ
                ─────────────────────
                σ <: ρ

Variance for function types:
  σ' <: σ    τ <: τ'
  ───────────────────────
  σ → τ <: σ' → τ'
  (contravariant in input, covariant in output)

Nominal subtyping for struct types:
  struct Subtype extends Supertype { ... }
  ─────────────────────────────────────────
  Subtype <: Supertype
```

### 4.2 Vector Subtyping

```
Vec types are invariant (no subtyping):
  Vec<f64, 768> ≠ Vec<f64, 512>  (different dimensions)
  Query ≠ Latent  (despite both Vec<f64, *>)

This prevents mixing Query and Latent accidentally.
```

## 5. Type Constraints

### 5.1 Constraint Declarations

```rust
// Constraint: vector must be normalized
constraint Normalized<T: Vec<f64, N>> {
  ‖T‖₂ = 1
}

// Usage:
type NormalizedQuery = Query with Normalized;

// Constraint: weights must sum to 1
constraint SimplexWeights {
  alpha + beta + gamma = 1
  alpha, beta, gamma ∈ [0, 1]
}

// Usage:
type ValidWeights = Weights with SimplexWeights;

// Constraint: confidence in range
constraint ValidConfidence {
  delta ∈ [-1, 1]
}

// Constraint: probability distribution
constraint ProbabilityDist {
  ∀i: p[i] ∈ [0, 1]
  Σᵢ p[i] = 1
}
```

### 5.2 Constraint Checking

```
At compile time or runtime:

Compile-time (static checking):
  type Query = Vec<f64, 768> with Normalized;
  // Compiler enforces normalization
  q: Query → ‖q‖₂ = 1 guaranteed

Runtime (dynamic checking):
  type Path = ... with { score ∈ [0, 1] };
  // Check at runtime after score computation
  if !(0 ≤ path.score ≤ 1):
    raise TypeConstraintViolation
```

## 6. Generic Types

### 6.1 Generic Definition

```rust
// Generic vector parametrized by dimension
type GenericVec<T, N: usize> = [T; N];

// Generic matrix
type GenericMatrix<T, M: usize, N: usize> = [T; M*N];

// Generic function
fn apply_activation<F: Activation>(x: Vec<f64, n>) → Vec<f64, n> {
  return F(x);
}

// Generic struct
struct PathGeneric<Dim: usize> {
  trajectory: Seq<Vec<f64, Dim>>,
  score: f64,
}
```

### 6.2 Generic Instantiation

```rust
// Instantiation for different dimensions
type Query = GenericVec<f64, 768>;
type Latent = GenericVec<f64, 512>;

fn process_query(q: Query) → Latent {
  // Compiler generates specialized version for dimensions 768→512
  return encode(q);
}

fn process_latent_768(z: GenericVec<f64, 768>) → Vec<f64, 768> {
  return apply_activation<ReLU>(z);
}
```

## 7. Option and Result Types

### 7.1 Option Type

```rust
type Option<T> = None | Some(T);

// Usage
fn critique_optional(z: Latent) → Option<Critique> {
  delta = compute_delta(z);
  if is_valid(delta):
    return Some(Critique { delta: delta, ... })
  else:
    return None
}

// Pattern matching
match critique {
  Some(crit) → process(crit)
  None → use_default()
}
```

### 7.2 Result Type

```rust
type Result<T, E> = Ok(T) | Err(E);

enum Error {
  StackOverflow,
  HeapOverflow,
  InvalidDimension,
  SamplingError,
}

fn safe_ensemble(
  weights: Weights,
  paths: [Latent; 3]
) → Result<Ensemble, Error> {
  if !valid_simplex(weights):
    return Err(InvalidDimension)

  result = weights.alpha * paths[0] + ...
  return Ok(Ensemble { ... })
}
```

## 8. Function Types

### 8.1 Function Signatures

```rust
// Simple function
fn encode(q: Query) → Latent;

// Function with multiple parameters
fn ensemble(
  weights: Weights,
  z_a: Latent,
  z_b: Latent,
  z_c: Latent
) → Ensemble;

// Function returning Option
fn critique_with_validation(z: Latent) → Option<Critique>;

// Higher-order function
fn apply_to_paths(f: Latent → Latent, paths: [Latent; 3]) → [Latent; 3] {
  return [f(paths[0]), f(paths[1]), f(paths[2])]
}

// Generic function
fn scale<N: usize>(v: Vec<f64, N>, alpha: f64) → Vec<f64, N> {
  return alpha * v
}
```

## 9. Type Annotations in Code

### 9.1 Explicit Type Annotations

```rust
// Declaration with type annotation
let q: Query = embedding_layer(tokens);
let z: Latent = encode(q);
let z_a: Latent = project_a(z);
let weights: Weights = compute_weights(z);

// Function with all annotations
fn process(
  q: Query,
  encoder_params: (Matrix<f64, 512, 768>, Vec<f64, 512>)
) → Latent:
  W_enc: Matrix<f64, 512, 768>, b_enc: Vec<f64, 512> = encoder_params
  z: Latent = W_enc · q + b_enc
  return z

// Complex type
let paths: [Latent; 3] = [z_a, z_b, z_c];
let z_ens: Latent = ensemble(weights, paths);
```

### 9.2 Type Inference (Implicit)

```rust
// Types inferred from context
q = embedding_layer(tokens)     // Query inferred from return type
z = encode(q)                   // Latent inferred from parameter type
z_a = project_a(z)             // Latent inferred
α, β, γ = softmax(logits)       // f64 inferred
```

## 10. Type Checking Algorithm

### 10.1 Algorithm

```pseudo
function type_check(AST_node, Γ):
  match node.type:

    'literal':
      return literal.inferred_type

    'variable':
      return Γ.lookup(node.name)

    'function_call':
      func_type = Γ.lookup(node.func_name)
      arg_types = [type_check(arg, Γ) for arg in node.args]

      // Check argument types match function signature
      for i in 0..len(arg_types):
        if arg_types[i] != func_type.param_types[i]:
          raise TypeError("Argument type mismatch at parameter {i}")

      return func_type.return_type

    'binary_op':
      left_type = type_check(node.left, Γ)
      right_type = type_check(node.right, Γ)

      result = op_type_rule(node.op, left_type, right_type)
      if result is None:
        raise TypeError(f"Invalid operand types: {left_type}, {right_type}")

      return result

    'struct_literal':
      // Check all fields
      for field_name, field_value in node.fields:
        field_type = type_check(field_value, Γ)
        if field_type != node.struct_type.fields[field_name]:
          raise TypeError(f"Field type mismatch: {field_name}")

      return node.struct_type
```

### 10.2 Type Checking Example

```
Program:
  z = encode(q)
  [z_a, z_b, z_c] = [project_a(z), project_b(z), project_c(z)]
  [α, β, γ] = compute_weights(z)
  z_ens = α·z_a + β·z_b + γ·z_c

Checking:
  1. encode: Query → Latent
     q: Query ✓
     z: Latent ✓

  2. project_a: Latent → Latent
     z: Latent ✓
     z_a: Latent ✓

  3. compute_weights: Latent → Weights
     z: Latent ✓
     [α, β, γ]: Weights ✓

  4. α·z_a: f64 × Latent → Latent
     α: f64 ✓, z_a: Latent ✓
     α·z_a: Latent ✓

  5. z_ens: Latent + Latent + Latent → Latent ✓

Result: ✓ Well-typed
```

## 11. Type System Summary

| Type | Size | Domain | Constraint |
|------|------|--------|------------|
| Query | d (768) | ℝ^d | ‖·‖₂ = 1 |
| Latent | m (512) | ℝ^m | - |
| Path | m | ℝ^m | score ∈ [0,1] |
| Weights | 3 | [0,1]³ | Σ = 1 |
| Ensemble | m | ℝ^m | - |
| Critique | 1 | [-1,1] | - |
| Probability | \|V\| | [0,1]^\|V\| | Σ = 1 |
| Token | - | {1...\|V\|} | - |
| Output | - | String | - |

---

**Cross-references**:
- SPEC_01_CONCEPTS.md for operational semantics
- SPEC_02_MATH.md for mathematical definitions
