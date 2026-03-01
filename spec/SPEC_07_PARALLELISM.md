# MindLang: Parallelism and Concurrency Model

## 1. Three-Way Branching Parallelism

### 1.1 Fork-Join Pattern

```
Sequential execution flow:
  ... → COMPUTE z → ... → ENSEMBLE → ...

Parallel execution flow (FORK_PATHS):

               ┌─ Thread 1: PROJECT_A → z_a
     z ────────┤─ Thread 2: PROJECT_B → z_b  (parallel)
               └─ Thread 3: PROJECT_C → z_c
                      ↓ (all complete)
                    BARRIER (synchronization)
                      ↓
                   ENSEMBLE (join): z_ens = α·z_a + β·z_b + γ·z_c
```

### 1.2 Execution Timeline

```
Time →

Main Thread:
  [encode q] ──→ z ──→ [FORK_PATHS] ────→ [BARRIER] ──→ [ENSEMBLE] → ...
                         ↓                   ↓
                      spawn                wait

Worker Thread 1:
                         ↓ [PROJECT_A]
                         ├─ compute z_a
                         ├─ store in r1
                         └─ signal done
                                          ↓ [released by BARRIER]

Worker Thread 2:
                         ↓ [PROJECT_B]
                         ├─ compute z_b
                         ├─ store in r2
                         └─ signal done
                                          ↓ [released by BARRIER]

Worker Thread 3:
                         ↓ [PROJECT_C]
                         ├─ compute z_c
                         ├─ store in r3
                         └─ signal done
                                          ↓ [released by BARRIER]

Critical path:    [encode] + max(PROJECT_A, B, C) + [ENSEMBLE]
Sequential time:  [encode] + PROJECT_A + PROJECT_B + PROJECT_C + [ENSEMBLE]
Speedup:          ~3x (ignoring overhead)
```

### 1.3 Task Distribution

```
Work queue:
  Initial: empty

At FORK_PATHS:
  Enqueue: [
    Task(THREAD_1, PROJECT_A, r0),
    Task(THREAD_2, PROJECT_B, r0),
    Task(THREAD_3, PROJECT_C, r0),
  ]

Worker threads:
  Thread 1: dequeue Task 1 → execute PROJECT_A
  Thread 2: dequeue Task 2 → execute PROJECT_B
  Thread 3: dequeue Task 3 → execute PROJECT_C

Results:
  r1 ← z_a (from Thread 1)
  r2 ← z_b (from Thread 2)
  r3 ← z_c (from Thread 3)

At BARRIER:
  All three must complete before proceeding
```

## 2. Path Scheduling

### 2.1 Scheduling Strategy

```
Goal: minimize total execution time

Strategy 1: Static scheduling
  Always assign:
    Thread 1 → PROJECT_A
    Thread 2 → PROJECT_B
    Thread 3 → PROJECT_C

Strategy 2: Load-aware scheduling
  Estimate cost: cost_A, cost_B, cost_C
  Assign fastest to slowest path:
    If cost_A > cost_B > cost_C:
      Thread 1 → PROJECT_A
      Thread 2 → PROJECT_B
      Thread 3 → PROJECT_C

Strategy 3: Dynamic work-stealing
  All three threads start from work queue
  Whichever thread is free takes next task
```

### 2.2 Critical Path Analysis

```
For each path:
  PROJECT_A: matrix multiply W_a ∈ ℝ^(m×m), input z ∈ ℝ^m
    Time: ~m² / (clock * parallelism)
    Parallelizable: yes (SIMD, cache-friendly)

  PROJECT_B: same as A, but with noise addition
    Time: ~m² + ε  (slightly more for noise generation)
    Parallelizable: yes

  PROJECT_C: same as A, but with sigmoid activation
    Time: ~m² + activation_cost
    Parallelizable: yes

Critical path: max(T_A, T_B, T_C) ≈ m² / clock_cycles

Example with m = 512, clock = 1 GHz:
  T_A = 512² / (1000 * 8) ≈ 33 cycles ≈ 33 ns (per SIMD operation)
  If not parallelized: 512² / 1000 ≈ 260 cycles ≈ 260 ns
  Speedup: 3x achieved
```

## 3. Work Stealing

### 3.1 Work-Stealing Deque

```
Each worker thread has a local deque (double-ended queue):

Thread 1:
  Local work: [Task_A1, Task_A2, Task_A3]
  Insert at tail, remove from head

If Thread 1 becomes idle:
  1. Check its own deque (empty)
  2. Try to steal from Thread 2's deque tail
     → Successfully steal Task_B3
  3. Execute Task_B3
  4. Continue stealing if more idle

Advantages:
  - Minimal contention (only steal from tail)
  - LIFO cache locality (recently added tasks are cache-hot)
  - Load balancing automatically emerges
```

### 3.2 Stealing Protocol

```
procedure try_steal():
  for each worker_thread in other_threads:
    if worker_thread.deque.size() > 1:
      task = worker_thread.deque.steal_from_tail()
      if task acquired successfully:
        return task
  return None

procedure worker_loop():
  while not_terminated:
    task = deque.pop_from_head()
    if task:
      execute(task)
    else:
      task = try_steal()
      if task:
        execute(task)
      else:
        sleep(backoff_time)
```

### 3.3 Performance Impact

```
Scenario 1: Balanced load
  Each path takes ~33 ns
  Total: 33 ns
  No stealing needed

Scenario 2: Imbalanced load
  PROJECT_A: 50 ns
  PROJECT_B: 30 ns
  PROJECT_C: 20 ns

  Timeline:
    t=0ms:   all start
    t=20ns:  Thread 3 finishes, idles
    t=20-30ns: Thread 3 steals from Thread 2
    t=30ns:  Thread 2 finishes
    t=30-50ns: Thread 2 steals from Thread 1
    t=50ns:  all complete

  With stealing: 50 ns
  Without stealing: 50 ns (still critical path limited)
  Improvement: 0% (critical path unchanged)

  But if we had more tasks:
    With stealing: better utilization across tasks
```

## 4. Synchronization Barriers

### 4.1 Barrier Implementation

```
Barrier with N threads:

struct Barrier {
  target_count: u32 = N,
  current_count: u32 = 0,
  generation: u32 = 0,
  lock: Mutex,
  cond: ConditionVariable,
}

procedure barrier_wait():
  lock.acquire()

  current_count += 1

  if current_count == target_count:
    // last thread to arrive
    generation += 1
    current_count = 0
    cond.broadcast()      // wake all waiters
    lock.release()
    return                // proceed

  else:
    // wait for others
    gen_at_entry = generation
    while generation == gen_at_entry:
      cond.wait(lock)     // release lock, sleep

    lock.release()
    return                // proceed
```

### 4.2 Efficiency

```
In MindLang: BARRIER always has exactly 3 threads

Cost:
  - Atomic increment: ~1 cycle
  - Lock acquire/release: ~10-50 cycles (if contended)
  - Condition variable: ~5-20 cycles
  - Total: ~50 cycles ≈ 50 ns

Compared to path computation: 33 ns
Overhead: ~50% of critical path

Optimization: custom 3-thread barrier
  struct Barrier3 {
    flags: [u32; 3] = [0, 0, 0],    // per-thread flag
    counter: atomic<u32> = 0,
  }

  procedure barrier_wait(thread_id):
    flags[thread_id] = 1
    atomic_add(counter, 1)
    while counter != 3: spin()      // busy wait
    counter = 0
    flags[thread_id] = 0
```

## 5. Join Operation

### 5.1 Join Synchronization

```
At ENSEMBLE opcode:
  All three results must be available:
    r1: z_a (computed by Thread 1)
    r2: z_b (computed by Thread 2)
    r3: z_c (computed by Thread 3)

Join ensures:
  ∀ paths: computation completed
  ∀ results: written to registers
  ∀ memory: synchronized (visible to all threads)

Memory barrier (fence):
  Before ensemble computation, ensure:
    - All writes from threads visible to main thread
    - No stale cached values
```

### 5.2 Memory Synchronization

```
Without synchronization:
  Thread 1 writes z_a to r1 (cached in L1)
  Main thread reads r1 (sees stale value)
  Incorrect computation

With synchronization:
  Thread 1: compute z_a, write to r1, fence()
  BARRIER waits for all threads
  Main thread: fence(), read r1 (guaranteed fresh)
  Correct computation

Fence costs:
  ~100 cycles on modern CPU (serializes pipeline)
  But called only once per BARRIER, worth it for correctness
```

## 6. Critique Parallelization

### 6.1 Optional Parallelism

```
CRITIQUE operation:
  δ = tanh(W_c · z_ens + b_c)  or multi-layer

Sequential:
  compute(z_ens) → δ

Parallel (if multi-layer):
  Layer 1: h₁ = W₁ · z_ens (can be parallelized)
           - Partition z_ens into blocks
           - Threads compute partial sums
           - Reduce to final h₁

  Layer 2: h₂ = W₂ · h₁

  Layer 3: δ = tanh(W₃ · h₂)

But:
  - Critique is inherently sequential in depth
  - Can parallelize matrix operations internally (SIMD)
  - Not as much opportunity as 3-way branching

Decision: Keep CRITIQUE sequential for simplicity
```

## 7. Sampling Parallelization

### 7.1 Softmax Parallelization

```
LOGITS_TO_PROB: p = softmax(logits)

Sequential softmax:
  1. Find max (sequential scan)
  2. Compute exp differences (parallel)
  3. Sum (parallel reduction)
  4. Divide (parallel)

Parallel version:
  threads = ceil(|V| / block_size)
  for each thread:
    block_max = reduce_max(logits[block])
  global_max = reduce_max(block_maxes)

  for each thread:
    block_sum = 0
    for each element in block:
      block_sum += exp(logits[i] - global_max)
  global_sum = reduce_sum(block_sums)

  for each thread:
    for each element in block:
      p[i] = exp(logits[i] - global_max) / global_sum

Complexity:
  Sequential: O(|V|)
  Parallel: O(log |V|) with |V| processors
  Practical: O(|V| / num_threads) with memory bandwidth limiting

Example: |V| = 100,000
  Sequential: 100k operations
  Parallel (8 threads): 12.5k operations per thread + 20k reduction ≈ 32.5k total
  Speedup: ~3x
```

### 7.2 Threshold Filtering Parallelization

```
FILTER_THRESHOLD: candidates = {i : p_i > θ}

Sequential:
  for each i in 0..|V|-1:
    if p[i] > θ:
      candidates.push(i)

Parallel:
  threads = ceil(|V| / block_size)
  for each thread in parallel:
    local_candidates = []
    for each i in thread's block:
      if p[i] > θ:
        local_candidates.push(i)

  // Merge local_candidates into global
  candidates = concatenate(all local_candidates)

Speedup: ~proportional to threads (linear)
```

## 8. Performance Considerations

### 8.1 Overhead Analysis

```
Cost of parallelism:
  - Thread spawning: ~1000 cycles
  - Context switching: ~500 cycles
  - Barrier synchronization: ~100 cycles
  - Memory synchronization fence: ~100 cycles
  - Total overhead: ~1700 cycles ≈ 1.7 μs

Path computation:
  - PROJECT_A: ~512² / parallelism ≈ 33 ns
  - PROJECT_B: ~33 ns
  - PROJECT_C: ~33 ns

Breakeven analysis:
  If total path time < overhead, parallelism not worth it
  33 ns << 1700 cycles ≈ 1.7 μs

  Solution: Batch multiple queries
  Process K queries:
    Parallelism overhead amortized: 1.7 μs / K
    K=100: 17 ns overhead per query
    K=100: path time 33 ns + overhead 17 ns ≈ 50 ns total
    Speedup: still ~3x
```

### 8.2 Memory Bandwidth

```
Bottleneck: loading tensors from memory

PROJECT_A: load W_a (m² * 8 bytes) + load z (m * 8 bytes)
  = 512² * 8 + 512 * 8 bytes
  = 2,097,152 + 4,096
  ≈ 2.1 MB

Memory bandwidth (typical):
  DDR4: 50 GB/s
  HBM2: 250 GB/s

Time to load data:
  With DDR4: 2.1 MB / 50 GB/s ≈ 42 ns
  Computation time: 33 ns

Computation is memory-bound! (data loading > computation)
Solution: cache weights in L3 or use SIMD prefetching
```

### 8.3 Cache Locality

```
W_a stored in row-major order (cache-friendly):
  [W_a[0,0], W_a[0,1], ..., W_a[0,511],
   W_a[1,0], W_a[1,1], ..., W_a[1,511],
   ...]

Accessing z[i]:
  Prefetch W_a[*, i] (column vector)
  Cache line: 64 bytes = 8 f64 values
  Required: 512 / 8 = 64 cache lines

L1 cache: 32 KB = 512 cache lines
L2 cache: 256 KB
L3 cache: 8 MB

For PROJECT_A:
  Load W_a: 512 cache lines (not all fit in L1)
  Cache misses: ~75% on repeated accesses
```

## 9. Synchronization Primitives Summary

| Primitive | Use Case | Cost | Notes |
|-----------|----------|------|-------|
| Barrier | Sync after fork | 100 cy | Custom 3-thread version recommended |
| Lock | Protect shared data | 10-50 cy | Rarely needed in MindLang |
| Atomic ops | Counter increments | 5-10 cy | Used in work stealing |
| Memory fence | Visibility guarantee | 100 cy | Required for correctness |
| Condition var | Thread wakeup | 5-20 cy | Used in barrier wait |

## 10. Parallelism Best Practices

### 10.1 For MindLang Implementation

```
1. Use fork-join pattern (fixed 3-way)
   ✓ simple, predictable
   ✓ always has work (3 paths)
   ✗ fixed to 3 threads

2. Minimize barrier overhead
   ✓ custom 3-thread barrier
   ✓ avoid multiple barriers per query

3. Balance path complexity
   ✓ keep PROJECT_A, B, C roughly equal time
   ✓ adjust weights regularization to balance load

4. Cache tensor weights
   ✓ load W_a, W_b, W_c once at startup
   ✓ reuse across multiple queries
   ✓ fit in L3 cache if possible

5. Batch queries
   ✓ process multiple queries in pipeline
   ✓ amortize parallelism overhead
```

### 10.2 Scalability Considerations

```
For future N-way branching (N > 3):

Challenges:
  - Barrier becomes O(N) cycles
  - Thread pool management overhead
  - Memory bandwidth scales poorly

Solutions:
  - Hierarchical barriers
  - Task-based parallelism (instead of thread-based)
  - GPU acceleration (CUDA/HIP) for large N
```

## 11. Parallelism Summary Table

| Component | Parallelizable | Speedup | Overhead |
|-----------|-----------------|---------|----------|
| FORK_PATHS | yes (3-way) | 3x | ~1.7 μs |
| PROJECT_A,B,C | yes (SIMD) | ~4-8x | low |
| ENSEMBLE | no | - | ~50 ns |
| CRITIQUE | partial | 1-2x | ~500 ns |
| LOGITS_TO_PROB | yes (parallel reduction) | ~3-8x | ~200 ns |
| FILTER_THRESHOLD | yes | ~Nx | low |
| BARRIER | N/A | - | ~100 ns |

**Total speedup (single query): ~2-3x**
**With batching (100 queries): ~2.5-3x sustained**

---

**Cross-references**:
- SPEC_04_BYTECODE.md for FORK_PATHS, BARRIER opcodes
- SPEC_06_RUNTIME.md for thread management
