# MindLang: Bytecode and Virtual Machine

## 1. Instruction Set: 45 Opcodes

### 1.1 Data Movement (5 opcodes)

| Opcode | Name | Operands | Stack Effect | Description |
|--------|------|----------|---------------|-------------|
| 0x00 | LOAD_QUERY | addr: u32 | → q | Load query embedding from heap address |
| 0x01 | LOAD_CONST | const_id: u32 | → value | Load constant (weight matrix, bias, etc.) |
| 0x02 | STORE_LOCAL | slot: u8 | value → | Store value in local register |
| 0x03 | LOAD_LOCAL | slot: u8 | → value | Load value from local register |
| 0x04 | HEAP_LOAD | addr: u32, size: u32 | → tensor | Load tensor from heap |

### 1.2 Encoding (3 opcodes)

| Opcode | Name | Stack | Description |
|--------|------|-------|-------------|
| 0x10 | ENCODE_Q | q → z | q ∈ ℝ^d → z ∈ ℝ^m via encoder |
| 0x11 | NORM_L2 | v → v_norm | L2 normalization: v / ‖v‖₂ |
| 0x12 | DROPOUT | v, rate → v' | Dropout regularization (rate ∈ [0, 1]) |

### 1.3 Activation Functions (4 opcodes)

| Opcode | Name | Stack | Description |
|--------|------|-------|-------------|
| 0x20 | RELU | v → max(0, v) | Rectified linear unit |
| 0x21 | TANH | v → tanh(v) | Hyperbolic tangent |
| 0x22 | SIGMOID | v → σ(v) | Logistic sigmoid |
| 0x23 | SOFTMAX | v → softmax(v) | Softmax normalization |

### 1.4 Arithmetic (6 opcodes)

| Opcode | Name | Stack | Description |
|--------|------|-------|-------------|
| 0x30 | SCALE | v, α → α·v | Scalar multiplication |
| 0x31 | ADD | v1, v2 → v1+v2 | Vector addition |
| 0x32 | SUB | v1, v2 → v1-v2 | Vector subtraction |
| 0x33 | HADAMARD | v1, v2 → v1⊙v2 | Element-wise multiplication |
| 0x34 | MATMUL | M, v → M·v | Matrix-vector product |
| 0x35 | OUTER | u, v → u⊗v | Outer product |

### 1.5 Projections (3 opcodes)

| Opcode | Name | Stack | Description |
|--------|------|-------|-------------|
| 0x40 | PROJECT_A | z → z_a | Analytical path: z_a = W_a·z + b_a |
| 0x41 | PROJECT_B | z → z_b | Creative path: z_b = W_b·z + b_b + ε |
| 0x42 | PROJECT_C | z → z_c | Empirical path: z_c = W_c·z + b_c |

### 1.6 Path Forking (1 opcode)

| Opcode | Name | Stack | Description |
|--------|------|-------|-------------|
| 0x50 | FORK_PATHS | z → [z_a, z_b, z_c] | Launch 3 parallel threads |

### 1.7 Synchronization (2 opcodes)

| Opcode | Name | Stack | Description |
|--------|------|-------|-------------|
| 0x51 | BARRIER | [z_a, z_b, z_c] → [z_a, z_b, z_c] | Join threads, synchronization point |
| 0x52 | THREAD_YIELD | none | Yield control to other threads |

### 1.8 Weight Computation (2 opcodes)

| Opcode | Name | Stack | Description |
|--------|------|-------|-------------|
| 0x60 | COMPUTE_WEIGHTS | z → [α, β, γ] | Attention: [α,β,γ] = softmax(W·z+b) |
| 0x61 | TEMP_SCALE | logits, T → logits/T | Temperature scaling: logits/T |

### 1.9 Ensemble (3 opcodes)

| Opcode | Name | Stack | Description |
|--------|------|-------|-------------|
| 0x70 | ENSEMBLE | [z_a,z_b,z_c],[α,β,γ] → z_ens | z_ens = α·z_a + β·z_b + γ·z_c |
| 0x71 | CONTRIB_A | z_a, α → α·z_a | Compute analytical contribution |
| 0x72 | CONTRIB_B | z_b, β → β·z_b | Compute creative contribution |

### 1.10 Critique (3 opcodes)

| Opcode | Name | Stack | Description |
|--------|------|-------|-------------|
| 0x80 | CRITIQUE | z_ens → δ | Confidence scoring: δ = crit(z_ens) ∈ [-1,1] |
| 0x81 | CRIT_CHECK | δ, low, high → bool | Check if δ ∈ [low, high] |
| 0x82 | RETRY_WEIGHTS | δ → [α',β',γ'] | Recompute weights if low confidence |

### 1.11 Sampling (4 opcodes)

| Opcode | Name | Stack | Description |
|--------|------|-------|-------------|
| 0x90 | LOGITS_TO_PROB | z_ens → p | p = softmax(W·z_ens) ∈ [0,1]^|V| |
| 0x91 | FILTER_THRESHOLD | p, θ → candidates | Filter: {i : p_i > θ} |
| 0x92 | SAMPLE | candidates, p_filt → token | Sample from filtered distribution |
| 0x93 | GREEDY | p → argmax(p) | Greedy selection (max probability) |

### 1.12 Detokenization (2 opcodes)

| Opcode | Name | Stack | Description |
|--------|------|-------|-------------|
| 0xA0 | DECODE_MORPHEME | z_ens → morphemes | Extract morphemes from latent |
| 0xA1 | COMPOSE_KOREAN | morphemes → korean_text | Generate Korean surface form |

### 1.13 Control Flow (4 opcodes)

| Opcode | Name | Stack | Description |
|--------|------|-------|-------------|
| 0xB0 | JUMP | target: u32 | Unconditional jump to instruction |
| 0xB1 | JUMP_IF_TRUE | target: u32, cond | Jump if condition true |
| 0xB2 | LOOP_START | iter_count → | Begin loop (for iteration) |
| 0xB3 | LOOP_END | → | End loop, decrement counter |

### 1.14 Debugging & Admin (2 opcodes)

| Opcode | Name | Description |
|--------|------|-------------|
| 0xF0 | DEBUG_PRINT | Print stack/registers to stdout |
| 0xF1 | HALT | Terminate execution |

---

**Total: 45 opcodes**

## 2. Bytecode Format

### 2.1 Instruction Encoding

```
Single instruction (1-5 bytes):

Byte 0:          opcode (0x00-0xF1)
Bytes 1-4:       operands (variable length)

Examples:
  RELU:            [0x20]                          (no operand)
  LOAD_QUERY:      [0x00] [addr: 4 bytes]         (4-byte address)
  JUMP:            [0xB0] [target: 4 bytes]       (jump address)
  LOAD_CONST:      [0x01] [const_id: 4 bytes]     (constant ID)
```

### 2.2 Program Structure

```
┌─────────────────────────────┐
│ Header (16 bytes)           │
├─────────────────────────────┤
│ Magic: "MIND" (4 bytes)     │
│ Version: u32 (1.0)          │
│ EntryPoint: u32 (offset)    │
│ Size: u32 (bytecode length) │
├─────────────────────────────┤
│ Constants (variable)        │
│   Weight matrices           │
│   Biases                    │
│   Thresholds                │
├─────────────────────────────┤
│ Bytecode Instructions       │
├─────────────────────────────┤
│ Jump Table (optional)       │
└─────────────────────────────┘
```

## 3. Stack Layout

### 3.1 Stack Organization

```
┌──────────────────────────────┐ Top (SP)
│ Return address               │
├──────────────────────────────┤
│ Local variables (caller)     │
├──────────────────────────────┤
│ Parameters (from FORK_PATHS) │
├──────────────────────────────┤
│ Temporary values             │
├──────────────────────────────┤
│ Current computation          │
└──────────────────────────────┘ Bottom (BP)
```

### 3.2 Register Allocation

```
Registers (fast access):
  r0: current z
  r1: z_a (from thread 1)
  r2: z_b (from thread 2)
  r3: z_c (from thread 3)
  r4: weights [α, β, γ]
  r5: z_ens
  r6: δ (confidence)
  r7: temporary
```

## 4. Memory Layout

### 4.1 Memory Segments

```
┌─────────────────────────────┐ 0x0000
│ Code segment (bytecode)     │
├─────────────────────────────┤ code_size
│ Data segment (constants)    │
├─────────────────────────────┤ code_size + data_size
│ Stack (grows upward)        │
├─────────────────────────────┤
│ ...                         │
├─────────────────────────────┤ heap_base
│ Heap (grows downward)       │
│   Query embeddings q        │
│   Large tensors             │
│   Intermediate buffers      │
└─────────────────────────────┘ heap_max
```

### 4.2 Tensor Storage

```
Tensor layout in heap (row-major):
  For matrix M ∈ ℝ^(m×n):
    [M[0,0], M[0,1], ..., M[0,n-1],
     M[1,0], M[1,1], ..., M[1,n-1],
     ...
     M[m-1,0], M[m-1,1], ..., M[m-1,n-1]]

  Dimensions: 2 u32 integers (m, n)
  Data: m·n f64 values
```

## 5. Execution Model

### 5.1 Sequential Execution

```
Pseudocode:
  PC = 0                        // program counter
  SP = stack_base               // stack pointer
  BP = stack_base               // base pointer

  while PC < program_size:
    opcode = bytecode[PC]
    PC += 1

    match opcode:
      0x20 (RELU):
        v = pop_stack()
        result = max(0, v)
        push_stack(result)
        PC += 0

      0x00 (LOAD_QUERY):
        addr = read_u32(bytecode, PC)
        PC += 4
        q = heap[addr : addr + query_dim]
        push_stack(q)

      ... (other opcodes)
```

### 5.2 Parallel Execution (FORK_PATHS)

```
Normal execution:
  PC₀ → PC₁ → PC₂ → ... (sequential)

At FORK_PATHS:
  Thread 0 (PC_current + 1):  execute PROJECT_A
  Thread 1 (new):            execute PROJECT_B
  Thread 2 (new):            execute PROJECT_C

  All three threads run in parallel.

At BARRIER:
  Wait until all three threads reach BARRIER
  Collect results [z_a, z_b, z_c]
  Continue with Thread 0 (or any)
```

### 5.3 Conditional Execution

```
At CRIT_CHECK:
  if condition(δ) is true:
    continue
  else:
    execute RETRY_WEIGHTS
    jump back to recompute ensemble

Pattern:
  CRITIQUE             // δ = crit(z_ens)
  CRIT_CHECK δ         // check confidence
  JUMP_IF_TRUE good    // if confident, jump to 'good'
  RETRY_WEIGHTS        // else recompute
  JUMP retry_ensemble  // jump back
good:
  SAMPLE               // continue to sampling
```

## 6. Example Bytecode Programs

### 6.1 Simple Query → Z → Output

```
Entry point (0x00):
  0x00: LOAD_QUERY      (addr=0x100)      → q on stack
  0x10: ENCODE_Q                          → z on stack
  0x11: NORM_L2                           → z_norm
  0x02: STORE_LOCAL     (slot=0)          z_norm in r0

  0x50: FORK_PATHS                        [z_a, z_b, z_c] in parallel
  0x51: BARRIER                           wait for all threads
  0x60: COMPUTE_WEIGHTS                   → [α, β, γ]
  0x70: ENSEMBLE                          → z_ens
  0x80: CRITIQUE                          → δ
  0x81: CRIT_CHECK      δ, -0.3, 1.0     check confidence
  0xB1: JUMP_IF_TRUE    (target=0x40)    if high confidence

  [Low confidence path]
  0x82: RETRY_WEIGHTS                     → [α', β', γ']
  0xB0: JUMP            (target=0x28)    back to ensemble

  [High confidence path]
  0x40: 0x90: LOGITS_TO_PROB              → p
  0x91: FILTER_THRESHOLD (θ=0.05)        → candidates
  0x92: SAMPLE                            → token_idx
  0xA0: DECODE_MORPHEME                   → morphemes
  0xA1: COMPOSE_KOREAN                    → korean_text
  0xF1: HALT
```

### 6.2 Multi-token Generation Loop

```
Entry point (0x00):
  ... [initialization as above, up to z_ens] ...

  0x03: LOAD_LOCAL      (slot=0)          → num_tokens = 10
  0xB2: LOOP_START      (iter_count=10)   begin loop

  [Loop body: generate one token]
  0x90: LOGITS_TO_PROB                    → p_i
  0x91: FILTER_THRESHOLD                  → candidates_i
  0x92: SAMPLE                            → token_i
  0xA0: DECODE_MORPHEME                   → morpheme_i
  0xA1: COMPOSE_KOREAN                    → append to output

  [Optional: update z for next token based on output]
  0x03: LOAD_LOCAL      (slot=1)          → z_prev
  0x31: ADD             (z_ens, context)  → z_ens_new
  0xB3: LOOP_END                          decrement counter, back to 0xB2

  0xF0: DEBUG_PRINT                       print output
  0xF1: HALT
```

## 7. Instruction Execution Examples

### 7.1 ENCODE_Q

```
Before: stack = [q ∈ ℝ^d, ...]
Operation:
  z = W_enc · q + b_enc
  where W_enc ∈ ℝ^(m×d), b_enc ∈ ℝ^m
After: stack = [z ∈ ℝ^m, ...]
Cost: O(d·m) operations
```

### 7.2 ENSEMBLE

```
Before: stack = [α, β, γ, z_a, z_b, z_c, ...]
Operation:
  z_ens = α · z_a + β · z_b + γ · z_c
  pop: γ, z_c, β, z_b, α, z_a
  compute: 3m float operations
After: stack = [z_ens ∈ ℝ^m, ...]
Cost: O(m) operations
```

### 7.3 FORK_PATHS

```
Before: stack = [z, ...]
Operation:
  thread0: push(z); execute PROJECT_A
  thread1: push(z); execute PROJECT_B  [new thread]
  thread2: push(z); execute PROJECT_C  [new thread]
After: stack0 = [z_a, ...], stack1 = [z_b, ...], stack2 = [z_c, ...]
Cost: O(m²) for projection, parallelized
Wait: BARRIER synchronization point
```

## 8. Virtual Machine Performance

### 8.1 Instruction Timing (Approximate)

```
Memory operations:     1-3 cycles
Arithmetic (+,-,*):    1-4 cycles
Activation (relu):     1-2 cycles
Softmax:              O(|V|) cycles ≈ 100-1000 cycles
Matrix multiply:       O(n·m) cycles ≈ 1000s cycles
FORK_PATHS:           0 cycles (spawn threads)
BARRIER:              variable (wait for slowest)
```

### 8.2 Throughput

```
Single-token generation:
  Query encoding:     d·m/1000 ≈ 1 ms       (1M ops / GHz)
  3-path parallel:    m²/3000 ≈ 0.3 ms
  Ensemble:           m/1000 ≈ 0.001 ms
  Critique:           m/1000 ≈ 0.001 ms
  Sampling:           |V|/1000 ≈ 0.1 ms
  Detokenization:     m/1000 ≈ 0.001 ms
  ───────────────────────────────────
  Total per token:    ≈ 1.4 ms

Multi-token (10 tokens):
  With parallelism:   ≈ 1.4 + 9*0.4 ≈ 5 ms
  Without:            ≈ 1.4 + 9*1.4 ≈ 13.6 ms
  Speedup:            ≈ 2.7x
```

## 9. Exception Handling

### 9.1 Runtime Errors

```
Error codes:
  0x00: Stack overflow
  0x01: Stack underflow
  0x02: Heap out of bounds
  0x03: Invalid opcode
  0x04: Timeout (max iterations exceeded)
  0x05: Division by zero
  0x06: Invalid thread state
```

### 9.2 Error Recovery

```
try-catch bytecode:
  [instruction that might fail]
  JUMP_IF_ERROR (target=error_handler)

  error_handler:
    LOAD_CONST (error_msg_id)
    PRINT_ERROR
    JUMP (cleanup)
```

## 10. Bytecode Summary Table

| Category | Count | Range |
|----------|-------|-------|
| Data Movement | 5 | 0x00-0x04 |
| Encoding | 3 | 0x10-0x12 |
| Activation | 4 | 0x20-0x23 |
| Arithmetic | 6 | 0x30-0x35 |
| Projections | 3 | 0x40-0x42 |
| Forking | 1 | 0x50 |
| Sync | 2 | 0x51-0x52 |
| Weights | 2 | 0x60-0x61 |
| Ensemble | 3 | 0x70-0x72 |
| Critique | 3 | 0x80-0x82 |
| Sampling | 4 | 0x90-0x93 |
| Detokenization | 2 | 0xA0-0xA1 |
| Control | 4 | 0xB0-0xB3 |
| Admin | 2 | 0xF0-0xF1 |
| **Total** | **45** | **0x00-0xF1** |

---

**Cross-references**:
- SPEC_01_CONCEPTS.md for operation semantics
- SPEC_06_RUNTIME.md for VM architecture
- SPEC_07_PARALLELISM.md for threading model
