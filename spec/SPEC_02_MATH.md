# MindLang: Mathematical Formalization

## 1. Formal Definitions

### 1.1 Vector Spaces

```
Input space:          Q = ℝ^d          (d: embedding dimension)
Latent space:         Z = ℝ^m          (m: latent dimension, m < d)
Token space:          T = {1, 2, ..., |V|}
Output space:         O = Σ*           (korean strings)
Probability space:    P = [0, 1]
Weight simplex:       Δ³ = {(α,β,γ) | α,β,γ ≥ 0, α+β+γ=1}
Confidence space:     C = [-1, 1]
```

### 1.2 Functions and Operators

```
Encoder:              E: Q → Z,          E(q) = encoder(q) ∈ Z
Projections:          P_a, P_b, P_c: Z → Z
Attention:            A: Z → Δ³,         A(z) = softmax(W_attn · z)
Ensemble:             E: Δ³ × Z³ → Z,   E(α,β,γ,z_a,z_b,z_c) = α·z_a + β·z_b + γ·z_c
Critique:             C: Z → C,         C(z) ∈ [-1, 1]
Softmax:              S: Z → P^|V|,     S(z_i) = exp(z_i)/Σ_j exp(z_j)
Sample:               Sample: P^|V| × ℝ → T
Detokenize:           D: Z → O,         D(z) = detokenize_kr(z)
```

## 2. Embedding and Encoding

### 2.1 Input Embedding

Given input tokens w = (w₁, w₂, ..., w_n) where w_i ∈ Vocab:

```
Embedding layer:
e_i = Embed(w_i) ∈ ℝ^d,    i = 1..n

Embedding matrix:
E_vocab ∈ ℝ^(|V| × d)
e_i = E_vocab[w_i, :]
```

### 2.2 Contextual Encoding

Apply transformer/LSTM to get contextualized embeddings:

```
Encoder (self-attention):
h_i = Attention_multi_head({e₁, ..., e_n}, i)

or

Encoder (LSTM):
h₁ = LSTM_cell(e₁, h₀)
h₂ = LSTM_cell(e₂, h₁)
...
h_n = LSTM_cell(e_n, h_{n-1})
```

### 2.3 Query Pooling

Reduce sequence to single vector q:

```
Option 1 (CLS token):
  q = h_1  (first token special marker)

Option 2 (Mean pooling):
  q = (1/n) Σᵢ h_i

Option 3 (Attention-weighted pooling):
  weights = softmax(W_pool · [h₁, ..., h_n]ᵀ)
  q = Σᵢ weights_i · h_i

Option 4 (Max pooling):
  q_j = max_i(h_i,j) for each dimension j
```

**Constraint**: ‖q‖₂ = 1 (normalization to unit sphere)

### 2.4 Latent Encoding

```
z = E(q) = W_enc · q + b_enc

where:
  W_enc ∈ ℝ^(m×d)
  b_enc ∈ ℝ^m

Non-linearity (optional):
  z = ReLU(W_enc · q + b_enc)
  or
  z = tanh(W_enc · q + b_enc)
```

**Reconstruction loss** (optional):
```
L_recon = ‖q - D(z)‖²₂

where D is decoder (transpose of E)
```

## 3. Path Projection and Branching

### 3.1 Three-Way Projection

```
z_a = P_a(z) = W_a · z + b_a      (Analytical)
z_b = P_b(z) = W_b · z + b_b      (Creative)
z_c = P_c(z) = W_c · z + b_c      (Empirical)

where:
  W_a, W_b, W_c ∈ ℝ^(m×m)
  b_a, b_b, b_c ∈ ℝ^m
```

### 3.2 Activation Functions

```
Analytical (deterministic):
  z_a = max(0, W_a · z + b_a)     [ReLU: preserves positive signals]

Creative (stochastic):
  z_b = tanh(W_b · z + b_b) + ε
  where ε ~ N(0, σ²_b · I)        [noise for diversity]

Empirical (conservative):
  z_c = σ(W_c · z + b_c)          [sigmoid: bounded to [0,1]]
```

### 3.3 Path-Specific Loss

Optional: penalize unused paths.

```
L_path_balance = -log(1 - 3·var([‖z_a‖², ‖z_b‖², ‖z_c‖²]))

Forces all paths to have similar magnitude.
```

## 4. Weight Computation

### 4.1 Dynamic Attention Weights

```
logits = W_attn · z + b_attn

where:
  W_attn ∈ ℝ^(3×m)
  b_attn ∈ ℝ³
  logits ∈ ℝ³

[α, β, γ] = softmax(logits)

α = exp(logits_1) / Σⱼ exp(logits_j)
β = exp(logits_2) / Σⱼ exp(logits_j)
γ = exp(logits_3) / Σⱼ exp(logits_j)

Constraints:
  α, β, γ ∈ [0, 1]
  α + β + γ = 1
```

### 4.2 Multi-Head Attention (Alternative)

```
For k attention heads:
  [α⁽¹⁾, β⁽¹⁾, γ⁽¹⁾] = softmax(W_attn^(1) · z)
  [α⁽²⁾, β⁽²⁾, γ⁽²⁾] = softmax(W_attn^(2) · z)
  ...
  [α⁽ᵏ⁾, β⁽ᵏ⁾, γ⁽ᵏ⁾] = softmax(W_attn^(k) · z)

Average:
  ᾱ = (1/k) Σᵢ α⁽ⁱ⁾
  β̄ = (1/k) Σᵢ β⁽ⁱ⁾
  γ̄ = (1/k) Σᵢ γ⁽ⁱ⁾
```

### 4.3 Temperature Scaling

```
logits_T = logits / T

where T ∈ (0, ∞) is temperature:
  T → 0   : weights approach one-hot (greedy)
  T = 1   : normal softmax
  T → ∞   : weights approach uniform [1/3, 1/3, 1/3]
```

## 5. Ensemble Operation

### 5.1 Weighted Linear Combination

```
z_ens = α · z_a + β · z_b + γ · z_c

Expanded:
z_ens = α · (W_a · z + b_a) + β · (W_b · z + b_b) + γ · (W_c · z + b_c)

     = (α·W_a + β·W_b + γ·W_c) · z + (α·b_a + β·b_b + γ·b_c)

Rearranged:
     = W_ensemble(α,β,γ) · z + b_ensemble(α,β,γ)
```

### 5.2 Ensemble Norm

```
Normalized ensemble:
  z_ens' = z_ens / ‖z_ens‖₂

Ensures consistency in magnitude regardless of path contributions.
```

### 5.3 Gradient with Respect to Weights

```
For backpropagation:
∂z_ens/∂α = z_a - z_b      (if using softmax parametrization)
∂z_ens/∂β = z_b - z_c
∂z_ens/∂γ = z_c - z_a      (sum is zero due to constraint)

This shows sensitivity of ensemble to weight changes.
```

## 6. Self-Critique Mechanism

### 6.1 Critique Function

```
δ = C(z_ens) = tanh(W_c · z_ens + b_c)

where:
  W_c ∈ ℝ^(1×m)
  b_c ∈ ℝ
  output δ ∈ [-1, 1]
```

### 6.2 Multi-Layer Critique

```
h₁ = ReLU(W₁ · z_ens + b₁)     hidden layer
h₂ = ReLU(W₂ · h₁ + b₂)        deeper reasoning

δ = tanh(W₃ · h₂ + b₃)         final score

where:
  W₁ ∈ ℝ^(m'×m)
  W₂ ∈ ℝ^(m'×m')
  W₃ ∈ ℝ^(1×m')
```

### 6.3 Critique Calibration

Training objective:

```
L_critique = (δ - y_confidence)²

where y_confidence is ground truth:
  y_confidence = 1  if prediction is correct
  y_confidence = -1 if prediction is incorrect
  y_confidence = 0  if uncertain
```

### 6.4 Confidence Score Distribution

```
If δ > threshold_high (e.g., 0.7):
  high_confidence region → use greedy sampling

If δ ∈ (threshold_low, threshold_high):
  medium confidence → use top-k sampling

If δ < threshold_low (e.g., -0.3):
  low confidence → use broad sampling or retry
```

## 7. Probability and Sampling

### 7.1 Logit to Probability Conversion

```
logits = z_ens ∈ ℝ^m

Map to token probabilities:
  logits_tokens = W_vocab · z_ens + b_vocab

where:
  W_vocab ∈ ℝ^(|V|×m)
  b_vocab ∈ ℝ^|V|

p = softmax(logits_tokens)

p_i = exp(logits_tokens_i) / Σⱼ exp(logits_tokens_j)

p ∈ [0, 1]^|V|
Σᵢ p_i = 1
```

### 7.2 Threshold-Based Filtering

```
θ ∈ (0, 1)   confidence threshold

candidates = {i ∈ {1, ..., |V|} : p_i > θ}

p_filtered = [p_i for i ∈ candidates]

p_normalized = p_filtered / Σ p_filtered   (renormalize)
```

### 7.3 Categorical Sampling

```
next_token ~ Categorical(p_normalized)

Implementation:
  u ~ Uniform(0, 1)
  CDF = cumsum(p_normalized)
  next_token = argmin{i : CDF_i > u}
```

### 7.4 Temperature-Adjusted Sampling

```
Adjust sharpness of distribution:

p_T = softmax(logits_tokens / T)

T = 1.0    normal distribution
T > 1.0    softer distribution (more diversity)
T < 1.0    sharper distribution (less diversity)
```

## 8. Loss Functions

### 8.1 Primary Loss (Prediction)

```
L_pred = CrossEntropy(p, y_true)

where y_true is one-hot encoded target token.

L_pred = -Σᵢ y_true_i · log(p_i)
```

### 8.2 Critique Loss

```
L_crit = (δ - y_confidence)²

where y_confidence ∈ {-1, 0, 1}
```

### 8.3 Path Diversity Loss

```
L_div = -Σᵢ∈{a,b,c} ‖z_i‖²₂ · log(‖z_i‖²₂)

Encourages all paths to contribute meaningfully.
```

### 8.4 Weight Distribution Loss

```
L_weight = -entropy([α, β, γ])
         = α·log(α) + β·log(β) + γ·log(γ)

Prevents collapse to single path (α≈1, β≈0, γ≈0).
```

### 8.5 Total Loss

```
L_total = L_pred + λ₁·L_crit + λ₂·L_div + λ₃·L_weight

where λ₁, λ₂, λ₃ are hyperparameters.

Typical: λ₁ = 0.1, λ₂ = 0.01, λ₃ = 0.01
```

## 9. Backpropagation Through Paths

### 9.1 Gradient Flow Diagram

```
                    L_total
                      │
         ┌────────────┼────────────┐
         │            │            │
      L_pred       L_crit       L_div
         │            │            │
         ├────────────┼────────────┤
         │            │            │
    p ← softmax    δ ← tanh     ‖z_a‖,‖z_b‖,‖z_c‖
         │            │            │
         └────────────┼────────────┘
                      │
                   z_ens
                      │
         ┌────────────┼────────────┐
         │            │            │
    Ensemble    ∂z_ens/∂α    ∂z_ens/∂β
         │            │            │
    ┌────┴────┐   Attention
    │          │   network
   z_a  z_b  z_c   α,β,γ
    │    │    │
    P_a  P_b  P_c
     │   │    │
    └────┴────┘
         │
         z
         │
        E(q)
```

### 9.2 Chain Rule Example: Loss to z

```
∂L_total/∂z = (∂L_total/∂z_ens) · (∂z_ens/∂z)

where:
∂z_ens/∂z = α·W_a + β·W_b + γ·W_c

∂L_total/∂z_ens = ∂L_pred/∂z_ens + ∂L_crit/∂z_ens + ...
```

### 9.3 Gradient to Path Projections

```
∂L_total/∂W_a = (∂L_total/∂z_ens) · (∂z_ens/∂z_a) · (∂z_a/∂W_a)
              = (∂L_total/∂z_ens) · α · (z ⊗ 1)

where ⊗ is outer product.
```

## 10. Mathematical Summary Table

| Formula | Meaning | Domain |
|---------|---------|--------|
| q ∈ ℝ^d | semantic embedding | query space |
| z = E(q) | latent encoding | latent space |
| z_a = P_a(z) | analytical branch | latent space |
| z_b = P_b(z) + ε | creative branch | latent space |
| z_c = P_c(z) | empirical branch | latent space |
| [α,β,γ] = softmax(...) | weight distribution | simplex |
| z_ens = αz_a + βz_b + γz_c | ensemble result | latent space |
| δ = tanh(W_c · z_ens) | confidence score | [-1, 1] |
| p = softmax(W_vocab · z_ens) | token distribution | probability |
| candidates = {i : p_i > θ} | high-confidence tokens | token indices |
| y ~ Categorical(p_norm) | sampled token | vocabulary |
| output = D(z_ens) | korean text | string |

## 11. Complexity Analysis

### 11.1 Time Complexity

```
Input processing:      O(n·d)              (n: sequence length)
Pooling:               O(n)
Encoding to z:         O(d·m)
3-way projection:      O(3·m²)             (parallel)
Weight computation:    O(m)
Ensemble:              O(m)
Critique:              O(m) or O(m²)
Softmax:               O(|V|·m) or O(|V|)
Total single step:     O(n·d + d·m + |V|)

Per-token generation:  O(m²) with parallelism
Sequential tokens:     O(L·m²) where L is output length
```

### 11.2 Space Complexity

```
Parameters:
  Encoder:    O(d·m)
  Projections: O(3·m²)
  Attention:  O(3·m)
  Critique:   O(m²) or O(m)
  Vocab:      O(|V|·m)
  Total:      O(|V|·m + d·m + m²)

Memory at inference:
  Activations: O(m)
  KV cache (if transformer): O(L·m)
```

---

**References**:
- SPEC_01_CONCEPTS.md for intuitive explanations
- SPEC_04_BYTECODE.md for computational operations
