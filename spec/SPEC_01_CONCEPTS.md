# MindLang: Core Concepts

## 1. The Data Flow Pipeline

```
┌─────────────┐
│   q         │  Query/Input Embedding
│ ∈ ℝ^d       │  (semantic embedding)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   z         │  Latent Representation
│ ∈ ℝ^m       │  (conceptual essence)
└──────┬──────┘
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
    z_a (A)                  {z_b, z_c}
 Analytical                  Creative+Empirical
       │                         │
       └──────────┬──────────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ α·z_a + β·z_b   │
         │ + γ·z_c         │  Ensemble
         │ → z_ens         │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ δ·crit(z_ens)   │  Self-Critique
         │ → confidence    │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ sample(p > θ)   │  Confidence Sampling
         │ → token indices │
         └────────┬────────┘
                  │
                  ▼
         ┌─────────────────┐
         │ detokenize_kr   │  Korean Generation
         │ → korean text   │
         └─────────────────┘
```

## 2. q: Query/Input Embedding

### 2.1 Definition

```
q ∈ ℝ^d
```

where d is the embedding dimension (typically 768, 1024, or 2048).

q is **not** the raw tokens. q is the compressed semantic representation of the input.

### 2.2 Generation Process

```
raw_tokens: [w₁, w₂, ..., w_n] ∈ Vocab^n
↓
embedding_layer: e_i = embed(w_i) ∈ ℝ^d
↓
contextual_encoding: [e'₁, e'₂, ..., e'_n]
↓
pooling: q = pool({e'₁, ..., e'_n}) ∈ ℝ^d
```

Common pooling strategies:
- CLS token (BERT-style)
- Mean pooling
- Max pooling
- Attention-weighted pooling

### 2.3 Properties

- **Dimensionality**: Fixed, typically much smaller than vocabulary size
- **Sparsity**: Dense vector (all dimensions are non-zero)
- **Normalization**: Usually L2-normalized to unit sphere ‖q‖₂ = 1
- **Semantic Alignment**: Similar inputs have similar q vectors

### 2.4 Semantic Space

The space ℝ^d is a **semantic space** where:
- Distance ≈ semantic dissimilarity
- Direction ≈ semantic relationship
- Magnitude ≈ confidence in encoding

Example:
```
q("강아지") - q("개") ≈ small distance  (synonyms)
q("행복") - q("슬픔") ≈ opposite direction
q("도시") - q("건물") ≈ part-whole relationship
```

## 3. z: Latent Representation

### 3.1 Definition

```
z ∈ ℝ^m
```

where m is the latent dimension, typically m < d.

z is obtained via encoder transformation:
```
z = encoder(q)
```

### 3.2 Encoder Architecture

```
encoder: ℝ^d → ℝ^m

Option 1 (Linear):
  z = W_q + b
  where W ∈ ℝ^(m×d), b ∈ ℝ^m

Option 2 (Neural):
  h₁ = ReLU(W₁q + b₁)
  h₂ = ReLU(W₂h₁ + b₂)
  z = W₃h₂ + b₃

Option 3 (Attention):
  z = Attention(q, K, V)
```

### 3.3 Properties of z

- **Compression**: m < d, so z is more compressed than q
- **Structure**: z captures the **conceptual essence** rather than surface semantics
- **Compositionality**: z supports linear operations (addition, scaling)
- **Non-negativity**: Some implementations enforce z_i ≥ 0 (ReLU-based)

### 3.4 Interpretation

z represents:
- Core concepts (not surface details)
- Abstract relationships
- Problem structure
- Task-relevant features

If q is "semantic surface", z is "conceptual skeleton".

## 4. {z_a, z_b, z_c}: Three Reasoning Paths

### 4.1 Path Projection

From z, we branch into three paths:

```
z_a = W_a · z + b_a    (Analytical path)
z_b = W_b · z + b_b    (Creative path)
z_c = W_c · z + b_c    (Empirical path)

where W_a, W_b, W_c ∈ ℝ^(m×m) are projection matrices
```

### 4.2 Analytical Path: z_a

**Purpose**: Logical inference, structural analysis, rule-based reasoning.

**Characteristics**:
- Deterministic trajectory
- Focus on explicit relationships
- Produces high-confidence outputs for well-defined problems
- Conservative estimates

**Implementation**:
```
z_a = ReLU(W_a · z + b_a)
```

Typically used for:
- Mathematical problems
- Deductive reasoning
- Constraint satisfaction
- Formal verification

### 4.3 Creative Path: z_b

**Purpose**: Novel combinations, analogical reasoning, abductive inference.

**Characteristics**:
- Stochastic trajectory (contains noise)
- Focus on new associations
- Produces diverse outputs
- Higher variance

**Implementation**:
```
z_b = tanh(W_b · z + b_b) + noise
noise ~ N(0, σ²I)
```

Typically used for:
- Creative writing
- Problem solving (novel approaches)
- Hypothesis generation
- Artistic tasks

### 4.4 Empirical Path: z_c

**Purpose**: Pattern matching, statistical inference, inductive reasoning.

**Characteristics**:
- Data-driven trajectory
- Focus on learned patterns from training
- Produces statistically probable outputs
- Conservative but robust

**Implementation**:
```
z_c = sigmoid(W_c · z + b_c)
```

Typically used for:
- Sequence prediction
- Classification
- Pattern recognition
- Data imputation

## 5. α, β, γ: Dynamic Weights

### 5.1 Weight Definition

```
α, β, γ ∈ [0, 1]
α + β + γ = 1  (simplex constraint)
```

### 5.2 Dynamic Assignment

Weights are **not fixed** but computed dynamically based on current z:

```
[α, β, γ] = softmax(attention_network(z))

attention_network: ℝ^m → ℝ³

Option 1 (Linear attention):
  logits = W_attn · z + b_attn  where W_attn ∈ ℝ^(3×m)
  [α, β, γ] = softmax(logits)

Option 2 (Neural attention):
  h = ReLU(W₁ · z + b₁)
  logits = W₂ · h + b₂
  [α, β, γ] = softmax(logits)
```

### 5.3 Interpretation

```
α high → Problem is analytical/logical
β high → Problem is creative/novel
γ high → Problem is empirical/statistical
```

The model **self-judges** which reasoning mode is most appropriate.

### 5.4 Example Values

```
Mathematical problem:
  α = 0.8, β = 0.1, γ = 0.1

Creative writing:
  α = 0.1, β = 0.7, γ = 0.2

Prediction task:
  α = 0.2, β = 0.1, γ = 0.7

Balanced task:
  α ≈ 0.33, β ≈ 0.33, γ ≈ 0.34
```

## 6. Ensemble: α·z_a + β·z_b + γ·z_c

### 6.1 Weighted Combination

The ensemble result is:

```
z_ens = α·z_a + β·z_b + γ·z_c

where z_ens ∈ ℝ^m
```

### 6.2 Semantics

This is **not** simple averaging. Each path has contributed its reasoning:

```
z_a contributed with weight α
z_b contributed with weight β
z_c contributed with weight γ
```

The final z_ens is a **hybrid conceptual representation** combining:
- Logical inference
- Creative associations
- Statistical patterns

### 6.3 Gradient Flow

```
∂Loss/∂α can be computed → which path helped/hurt?
∂Loss/∂β can be computed → learning what works
∂Loss/∂γ can be computed → adaptive adjustment
```

## 7. δ·crit(z): Self-Critique Mechanism

### 7.1 Critique Function

```
crit: ℝ^m → [-1, 1]

δ = crit(z_ens)

typical implementation:
  hidden = ReLU(W₁ · z_ens + b₁)
  δ = tanh(W₂ · hidden + b₂)
```

### 7.2 Interpretation

```
δ ∈ [-1, 1]

δ = -1.0  : Completely unreliable, wrong direction
δ ∈ [-0.3, 0.3] : Uncertain, needs more thought
δ ∈ [0.3, 0.7]  : Reasonably confident
δ = 1.0   : Highly confident in the output
```

### 7.3 Usage

**Adaptive re-computation**:
```
if |δ| < 0.3:  # low confidence
  # try alternative path with higher β weight
  β' = β + 0.2
  α' = α - 0.1
  γ' = γ - 0.1
  recompute ensemble

if δ > 0.7:  # high confidence
  # proceed to sampling
  proceed_to_sample()
```

### 7.4 Learning Signal

The critique provides a learning signal for the model:

```
critique_loss = (δ - true_label)²
total_loss = prediction_loss + λ·critique_loss
```

The model learns to **accurately assess its own confidence**.

## 8. sample(p > θ): Confidence-Based Sampling

### 8.1 Probability Distribution

```
p = softmax(z_ens) ∈ ℝ^|V|

where |V| is vocabulary size

p_i = exp(z_ens_i) / Σⱼ exp(z_ens_j)
```

### 8.2 Threshold Filtering

```
candidates = {i : p_i > θ}

θ is the confidence threshold, typically:
  θ ∈ [0.01, 0.1] (1% to 10%)
```

### 8.3 Sampling

```
if |candidates| == 1:
  next_token = candidates[0]  (forced choice)

else if |candidates| > 1:
  next_token ~ Multinomial(p_filtered)
  where p_filtered = [p_i for i in candidates] (renormalized)

else:  # |candidates| == 0 (no token exceeds threshold)
  θ' = θ / 2  (lower threshold)
  retry with new threshold
```

### 8.4 Dynamic Threshold

Threshold can be adjusted based on context:

```
if δ > 0.8:  # very confident
  θ_dynamic = 0.05  (greedy, top candidates only)

if |δ| < 0.3:  # uncertain
  θ_dynamic = 0.01  (sample more broadly)

sample using θ_dynamic
```

## 9. detokenize_kr: Korean Text Generation

### 9.1 Process

```
z_ens (latent vector)
  ↓
  ├─ morphological_decoder
  │   ├─ POS tagging
  │   ├─ stem selection
  │   └─ affix attachment
  │
  ├─ syntactic_decoder
  │   ├─ dependency structure
  │   ├─ predicate-argument structure
  │   └─ clause coordination
  │
  ├─ prosodic_decoder
  │   ├─ particle selection (조사)
  │   ├─ intonation patterns
  │   └─ elision rules
  │
  └─ surface_realization
      └─ korean text output
```

### 9.2 Key Korean Considerations

**Postpositional language**:
```
English: "I eat apple"
Korean: "나는 사과를 먹는다"
        [I-NOM apple-ACC eat]
        (subject marker, object marker, then verb)
```

MindLang directly generates Korean word order from z_ens.

**Particle system**:
```
는/은 (nominative)
를/을 (accusative)
에게 (dative)
... (30+ particles with grammatical functions)
```

Each particle is implicitly encoded in the latent dimensions.

**Morphological agglutination**:
```
먹다 (eat)
  → 먹+는 (eat-present)
  → 먹+었+다 (ate)
  → 먹+고+싶+다 (want to eat)
```

Stems and affixes are simultaneously decoded.

### 9.3 Implementation

```typescript
function detokenize_kr(z_ens: Vec<f64>): String {
  // Tokenize from latent space
  morphemes = morpheme_decoder(z_ens);      // [stem, POS, morphs]

  // Compose morphemes into words
  words = compose_morphemes(morphemes);     // [word1, word2, ...]

  // Apply grammatical rules
  words = apply_particles(words);           // [w+particle, ...]
  words = apply_conjugation(words);         // [conjugated_forms]

  // Generate surface form
  text = phonetic_realization(words);       // 음운변화
  text = elision_rules(text);               // 생략 규칙

  return text;
}
```

## 10. Complete Forward Pass

```
input_tokens: [w₁, w₂, ..., w_n]
  ↓
q = embedding_and_pooling(input_tokens)  ∈ ℝ^d
  ↓
z = encoder(q)  ∈ ℝ^m
  ↓
z_a = projection_a(z)  ∈ ℝ^m
z_b = projection_b(z)  ∈ ℝ^m
z_c = projection_c(z)  ∈ ℝ^m  [parallel]
  ↓
[α, β, γ] = compute_weights(z)  ∈ Simplex³
  ↓
z_ens = α·z_a + β·z_b + γ·z_c  ∈ ℝ^m
  ↓
δ = critique(z_ens)  ∈ [-1, 1]
  ↓
if |δ| < 0.3:
  adjust_weights_and_recompute()

  ↓
p = softmax(z_ens)  ∈ ℝ^|V|
  ↓
candidates = filter_by_threshold(p, θ)
  ↓
next_token_idx ~ sample(candidates)
  ↓
output_text += detokenize_kr(z_ens)
  ↓
output_text: korean string
```

## 11. Conceptual Summary Table

| Component | Input | Output | Role |
|-----------|-------|--------|------|
| q | tokens | ℝ^d | semantic input |
| z | q | ℝ^m | latent essence |
| z_a | z | ℝ^m | analytical reasoning |
| z_b | z | ℝ^m | creative reasoning |
| z_c | z | ℝ^m | empirical reasoning |
| α,β,γ | z | [0,1]³ | reasoning mode selector |
| z_ens | z_a,z_b,z_c,α,β,γ | ℝ^m | hybrid representation |
| δ | z_ens | [-1,1] | confidence score |
| p | z_ens | ℝ^|V| | token probability |
| sample | p | {1...|V|} | token selection |
| output | z_ens | String | korean text |

---

**See also**:
- PHILOSOPHY.md for conceptual foundations
- SPEC_02_MATH.md for mathematical formalization
- SPEC_03_AST.md for syntactic structure
