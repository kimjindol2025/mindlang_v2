# MindLang: Code Examples and Use Cases

## 1. Example 1: Simple Question Answering

### 1.1 Problem
Question: "서울의 평균 기온은?"
(What is Seoul's average temperature?)

### 1.2 MindLang Execution Flow

```
input_tokens: ["서울의", "평균", "기온은"]
    ↓
q = embedding_and_pool(input_tokens)  // q ∈ ℝ^768
    ↓
z = encode(q)  // z ∈ ℝ^512, compress semantic meaning
    ↓
FORK_PATHS:
    z_a = project_a(z)  // analytical: "fact lookup" path
         // W_a trained to retrieve factual information
         // high activation on factual queries

    z_b = project_b(z)  // creative: "reasoning" path
         // might generate associations like "korean climate"

    z_c = project_c(z)  // empirical: "pattern matching" path
         // learned correlation: "Seoul" → "temperature"
    ↓
[α, β, γ] = compute_weights(z)
    // For factual questions, attention network learns:
    // α = 0.8  (analytical dominant - fact lookup)
    // β = 0.1  (creative minor)
    // γ = 0.1  (empirical minor)
    ↓
z_ens = 0.8·z_a + 0.1·z_b + 0.1·z_c
    ↓
δ = critique(z_ens)
    // Model is very confident about factual answer
    // δ = 0.95 (high confidence)
    ↓
p = softmax(z_ens)  // convert to token probabilities
    ↓
candidates = {tokens where p_i > 0.05}
    // Only high-probability tokens pass threshold
    // "15도", "18도", "영상" likely candidates
    ↓
token ~ sample(candidates)
    // Select "15" with p=0.87
    ↓
output: "서울의 평균 기온은 15도입니다."
```

### 1.3 Bytecode Representation

```
0x00: LOAD_QUERY           // load q from input
0x10: ENCODE_Q             // z = encode(q)
0x11: NORM_L2              // ‖z‖ = 1 (optional)

0x50: FORK_PATHS           // spawn 3 threads

  // Thread 1: analytical
  0x40: PROJECT_A          // z_a = W_a·z + b_a
  0x20: RELU               // activation

  // Thread 2: creative
  0x41: PROJECT_B          // z_b = W_b·z + b_b
  0x21: TANH               // activation
  0x12: DROPOUT 0.1        // add some noise

  // Thread 3: empirical
  0x42: PROJECT_C          // z_c = W_c·z + b_c
  0x22: SIGMOID            // activation

0x51: BARRIER              // wait for all 3

0x60: COMPUTE_WEIGHTS      // [α, β, γ] = softmax(...)
0x70: ENSEMBLE             // z_ens = α·z_a + β·z_b + γ·z_c

0x80: CRITIQUE             // δ = crit(z_ens)
0x81: CRIT_CHECK 0.7 1.0   // if δ ∈ [0.7, 1.0], proceed

0x90: LOGITS_TO_PROB       // p = softmax(W_vocab·z_ens)
0x91: FILTER_THRESHOLD 0.05 // candidates where p > 0.05
0x92: SAMPLE               // token ~ sample(candidates)
0xA0: DECODE_MORPHEME      // extract morphemes
0xA1: COMPOSE_KOREAN       // "15" + "도" + "입니다"

0xF1: HALT                 // done
```

### 1.4 Performance Characteristics

```
Timing breakdown:
  LOAD_QUERY:     0.1 ms
  ENCODE_Q:       0.5 ms
  FORK_PATHS+
    PROJ_A:       0.3 ms } parallel
    PROJ_B:       0.3 ms }
    PROJ_C:       0.3 ms }
  BARRIER:        0.05 ms
  WEIGHTS:        0.2 ms
  ENSEMBLE:       0.1 ms
  CRITIQUE:       0.2 ms
  SOFTMAX:        0.1 ms
  FILTER+SAMPLE:  0.1 ms
  DETOKENIZE:     0.2 ms
  ──────────────────────
  Total:          1.9 ms

Without parallelism: 0.1 + 0.5 + 0.9 + 0.2 + 0.1 + 0.2 + 0.1 + 0.1 + 0.2 ≈ 2.4 ms
Speedup from parallelism: 1.26x
```

## 2. Example 2: Self-Critique Loop with Retry

### 2.1 Problem
Query: "AI 윤리의 가장 중요한 원칙은 무엇인가?"
(What is the most important principle of AI ethics?)

This is complex, may require multiple attempts.

### 2.2 MindLang Execution Flow

```
q = encode_input(...)
z = encoder(q)

Attempt 1:
    FORK_PATHS:
        z_a = project_a(z)  // logical reasoning
        z_b = project_b(z)  // creative synthesis
        z_c = project_c(z)  // empirical patterns

    [α₁, β₁, γ₁] = compute_weights(z)
        α₁ = 0.3, β₁ = 0.4, γ₁ = 0.3  (balanced approach)

    z_ens₁ = 0.3·z_a + 0.4·z_b + 0.3·z_c

    δ₁ = critique(z_ens₁)
        δ₁ = 0.25  (uncertain, below threshold 0.3)

    if δ₁ < 0.3:
        // Retry with adjusted weights
        [α₂, β₂, γ₂] = reweight()
        // Increase creative path (β) for more nuanced answer
        α₂ = 0.2, β₂ = 0.6, γ₂ = 0.2

Attempt 2:
    z_ens₂ = 0.2·z_a + 0.6·z_b + 0.2·z_c
    δ₂ = critique(z_ens₂)
        δ₂ = 0.62  (better, above threshold 0.3)

    // Proceed with sampling
    p = softmax(z_ens₂)
    output: "공정성과 투명성이 AI 윤리의 핵심입니다."
```

### 2.3 Bytecode with Retry Logic

```
entry:
  LOAD_QUERY
  ENCODE_Q
  NORM_L2

attempt_loop:
  LOAD_LOCAL r_retry_count        // counter
  CRIT_CHECK r_retry_count 3      // max 3 attempts

  FORK_PATHS
  BARRIER

  attempt_id = LOAD_LOCAL r_attempt_count
  COMPUTE_WEIGHTS_V2 attempt_id   // different weights each time

  ENSEMBLE
  CRITIQUE                         // δ in r6

  CRIT_CHECK δ, 0.3, 1.0          // if δ > 0.3, proceed
  JUMP_IF_TRUE good_path

  // Low confidence: retry
  RETRY_WEIGHTS                    // adjust α, β, γ
  ADD r_retry_count, 1
  JUMP_IF_LESS 3, attempt_loop    // retry if count < 3

  // Fallback if max retries reached
  ENSEMBLE                         // use last z_ens
  // Continue to sampling

good_path:
  LOGITS_TO_PROB
  FILTER_THRESHOLD 0.05
  SAMPLE

  DECODE_MORPHEME
  COMPOSE_KOREAN

  HALT
```

### 2.4 Interpretation

```
Retries represent AI "thinking harder" about difficult questions:

Attempt 1:
  Use balanced approach (analytical:creative:empirical = 30:40:30)
  Check: δ=0.25 (uncertain)

Attempt 2:
  Shift to more creative reasoning (30:60:20)
  Check: δ=0.62 (better!)
  Proceed

This simulates human behavior:
  "First impression: uncertain"
  "Let me think more creatively..."
  "Now I'm more confident"
```

## 3. Example 3: Multi-Path Divergence and Convergence

### 3.1 Problem
Query: "효율성과 윤리를 어떻게 균형을 맞출까?"
(How to balance efficiency and ethics?)

This problem benefits from all three paths equally.

### 3.2 Execution

```
z = encoder(query)

FORK_PATHS:
    z_a = project_a(z)
        // Analytical path
        // Extracts: "efficiency" (measurable), "ethics" (principles)
        // Formalizes as: efficiency = speed/resources, ethics = constraints
        // Reasoning: both objectives must be satisfied

    z_b = project_b(z)
        // Creative path
        // Novel associations:
        // "efficiency" → "innovation", "optimization"
        // "ethics" → "responsibility", "human values"
        // Synthesizes: ethical innovation, responsible efficiency

    z_c = project_c(z)
        // Empirical path
        // Learned patterns from data:
        // Real-world examples where efficiency + ethics succeeded
        // "DevOps best practices", "agile with ethics review"

BARRIER: all complete

[α, β, γ] = compute_weights(z)
    // For balanced problems, attention learns:
    α = 0.33, β = 0.33, γ = 0.34 (nearly equal)

z_ens = 0.33·z_a + 0.33·z_b + 0.34·z_c

δ = critique(z_ens)
    // High confidence from multi-perspective agreement
    δ = 0.78

output: "효율성과 윤리의 균형은 다음과 같은 방법으로:
         1. 분석: 양쪽 제약 조건을 명확히 정의
         2. 창의: 새로운 접근법 모색
         3. 경험: 성공한 사례 적용"
```

### 3.3 Contribution Analysis

```
Each path contributed:
  contrib_a = 0.33 × z_a     (analytical framework)
  contrib_b = 0.33 × z_b     (creative ideas)
  contrib_c = 0.34 × z_c     (empirical examples)

If we remove one path (ablation):
  Without z_a: "How to balance? (missing logical framework)"
  Without z_b: "How to balance? (missing novel ideas)"
  Without z_c: "How to balance? (missing concrete examples)"

All three necessary for good answer!
```

## 4. Example 4: Confidence-Based Output Adjustment

### 4.1 Problem
Multiple queries with varying confidence levels.

### 4.2 Code Pattern

```
queries = [
  "한국의 수도는?",           // Factual, high confidence
  "좋은 삶이란?",             // Philosophical, medium confidence
  "2050년 기술은?",           // Speculative, low confidence
]

for query in queries:
    z = encoder(query)
    z_a, z_b, z_c = fork_project(z)
    [α, β, γ] = compute_weights(z)
    z_ens = ensemble([α, β, γ], [z_a, z_b, z_c])
    δ = critique(z_ens)

    // Adjust sampling based on confidence
    if δ > 0.8:
        // Very confident: greedy sampling (pick argmax)
        token = argmax(softmax(z_ens))

    elif 0.5 < δ ≤ 0.8:
        // Moderately confident: top-k sampling (k=10)
        token ~ softmax(z_ens, k=10)

    else:  // δ ≤ 0.5
        // Low confidence: broad sampling (full distribution)
        token ~ softmax(z_ens)
        // Or: nucleus sampling (p=0.9)

    output += detokenize_kr(z_ens)
```

### 4.3 Example Outputs

```
Query 1: "한국의 수도는?"
  δ = 0.95 (very confident)
  Sampling: greedy
  Output: "서울입니다." (definitive)

Query 2: "좋은 삶이란?"
  δ = 0.52 (uncertain)
  Sampling: broad
  Output: "좋은 삶이란 여러 측면에서 해석될 수 있습니다.
           개인에게는 행복과 자아실현을,
           사회에는 기여와 공존을 의미합니다." (nuanced, multi-faceted)

Query 3: "2050년 기술은?"
  δ = 0.38 (very uncertain)
  Sampling: very broad
  Output: "예측하기 어렵지만, 다음과 같은 가능성이 있습니다:
           1. 양자 컴퓨팅
           2. 생명공학
           3. 우주기술
           4. 인공지능" (tentative, open-ended)
```

## 5. Example 5: AI Agent Architecture (Sketch)

### 5.1 Problem
Build a question-answering agent that can:
- Answer simple questions directly
- Break down complex questions into sub-problems
- Search for information if uncertain
- Provide confidence scores

### 5.2 Agent Pseudocode

```
function ai_agent(query: String) → (answer: String, confidence: f64):
  z = encoder(query)

  // Analyze query complexity
  complexity = analyze_complexity(z)

  if complexity == SIMPLE:
    return simple_qa(z)
  elif complexity == MODERATE:
    return compound_qa(z)
  else:  // COMPLEX
    return multi_step_reasoning(z)

function simple_qa(z):
  FORK_PATHS: z_a, z_b, z_c = project(z)
  [α, β, γ] = compute_weights(z)
  z_ens = ensemble([α, β, γ], [z_a, z_b, z_c])
  δ = critique(z_ens)

  if δ > 0.7:
    answer = generate_from(z_ens)
    return (answer, δ)
  else:
    // Delegate to compound reasoning
    return compound_qa(z)

function compound_qa(z):
  // Break down question into sub-queries
  sub_queries = decompose(z)  // z → [z₁, z₂, z₃, ...]

  results = []
  for sub_q in sub_queries:
    result_i = simple_qa(sub_q)
    results.append(result_i)

  // Combine results
  z_combined = combine_results(results)
  [α, β, γ] = compute_weights(z_combined)
  z_ens = ensemble([α, β, γ], ...)
  δ = critique(z_ens)

  answer = generate_from(z_ens)
  return (answer, δ)

function multi_step_reasoning(z):
  // Search for relevant information
  query_text = detokenize_kr(z)  // Convert back to text for search
  docs = search(query_text)       // External search

  // Incorporate search results
  for doc in docs:
    z_doc = encoder(doc)
    z = combine(z, z_doc, weight=0.5)

  return compound_qa(z)

// Usage:
query = "2024년 한국 경제 전망은 어떻게 되나요?"
answer, confidence = ai_agent(query)

output:
  "2024년 한국 경제는 다음과 같은 특징을..."
  confidence_score: 0.71
```

### 5.3 Flow Diagram

```
User Query
    ↓
Encoder: q → z
    ↓
Complexity Analysis
    ├─ SIMPLE (direct answer)
    │   └─ 1-step fork-join
    │
    ├─ MODERATE (decomposition)
    │   ├─ Decompose: z → [z₁, z₂, z₃]
    │   ├─ Process each: simple_qa(zᵢ)
    │   └─ Combine results
    │
    └─ COMPLEX (with search)
        ├─ Generate search query
        ├─ Retrieve documents
        ├─ Encode and integrate
        └─ Multi-step reasoning
    ↓
Self-Critique
    ├─ High confidence (δ > 0.7): proceed
    ├─ Medium confidence (0.3 < δ ≤ 0.7): refine
    └─ Low confidence (δ ≤ 0.3): request clarification or search
    ↓
Generate Output
    ├─ Sample tokens
    ├─ Detokenize to Korean
    └─ Return answer with confidence
```

## 6. Example 6: Training Loop Integration

### 6.1 Supervised Learning

```
// Prepare dataset
dataset = [
  (query_1, expected_output_1),
  (query_2, expected_output_2),
  ...
]

// Training loop
for epoch in range(num_epochs):
  for (query, expected) in dataset:
    // Forward pass
    q = encoder(query_tokens)
    z = encoder_network(q)
    z_a, z_b, z_c = project(z)
    [α, β, γ] = attention(z)
    z_ens = ensemble(...)
    δ = critique(z_ens)
    p = softmax(z_ens)
    output = sample(p)

    // Loss computation
    L_pred = cross_entropy(output, expected)
    L_crit = (δ - confidence_label)²
    L_path = -entropy([α, β, γ])
    L_total = L_pred + λ₁·L_crit + λ₂·L_path

    // Backward pass
    L_total.backward()

    // Update parameters
    optimizer.step()
```

### 6.2 Metrics Tracked

```
During training:

per_batch:
  - Loss breakdown: L_pred, L_crit, L_path
  - Path weights distribution: [α, β, γ] histogram
  - Confidence scores: δ distribution
  - Token accuracy

per_epoch:
  - Validation accuracy
  - Validation loss
  - Average confidence
  - Path specialization score
    (how much each path specializes)
```

---

## 7. Summary: Example Patterns

| Example | Pattern | Key Feature |
|---------|---------|-------------|
| 1: Simple QA | fork-join | Direct 3-way inference |
| 2: Retry Loop | self-critique | Low confidence triggers retry |
| 3: Multi-path | balanced weights | All paths equally important |
| 4: Confidence | adaptive sampling | Adjust diversity based on δ |
| 5: Agent | hierarchical | Complex queries recursively decomposed |

These examples demonstrate MindLang's core capabilities:
- **Parallelism**: 3-way branching (Example 1, 3)
- **Self-awareness**: Critique and retry (Example 2)
- **Flexibility**: Adaptive behavior (Example 4)
- **Composability**: Agent architecture (Example 5)
- **Learnability**: Training integration (Example 6)

---

**Cross-references**:
- SPEC_01_CONCEPTS.md for operation semantics
- SPEC_04_BYTECODE.md for actual bytecode
- SPEC_06_RUNTIME.md for execution environment
