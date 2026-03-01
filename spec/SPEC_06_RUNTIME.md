# MindLang: Runtime and Virtual Machine Architecture

## 1. Runtime Architecture

### 1.1 High-Level Components

```
┌─────────────────────────────────────────────────────┐
│              MindLang Runtime                       │
├─────────────────────────────────────────────────────┤
│  Bytecode Loader                                    │
│    ├─ Magic number validation                       │
│    ├─ Version checking                              │
│    └─ Program parsing                               │
├─────────────────────────────────────────────────────┤
│  Virtual Machine (Executor)                         │
│    ├─ Instruction dispatcher                        │
│    ├─ Stack management                              │
│    ├─ Heap management                               │
│    └─ Thread scheduler                              │
├─────────────────────────────────────────────────────┤
│  Neural Operators                                   │
│    ├─ Matrix multiplication                         │
│    ├─ Activation functions                          │
│    ├─ Softmax                                       │
│    └─ Tensor operations                             │
├─────────────────────────────────────────────────────┤
│  Memory Manager                                     │
│    ├─ Stack allocation                              │
│    ├─ Heap allocation                               │
│    └─ Garbage collection (optional)                 │
├─────────────────────────────────────────────────────┤
│  Thread Manager                                     │
│    ├─ Thread spawning                               │
│    ├─ Synchronization                               │
│    ├─ Work stealing                                 │
│    └─ Join operations                               │
├─────────────────────────────────────────────────────┤
│  I/O Layer                                          │
│    ├─ Input tokenization                            │
│    ├─ Output generation                             │
│    └─ Debug logging                                 │
└─────────────────────────────────────────────────────┘
```

## 2. Memory Model

### 2.1 Memory Segments

```
Address space (typical 64-bit):

0x00000000
│
├─ Code segment (read-only)
│  ├─ Bytecode instructions
│  ├─ Constants (weights, biases)
│  └─ String literals
│  Size: typically 10 MB - 100 MB
│
├─ Data segment (read-write)
│  ├─ Initialized globals
│  ├─ Precomputed tables
│  └─ Cached values
│  Size: typically 1 MB - 10 MB
│
├─ Stack (grows upward)
│  ├─ Function frames
│  ├─ Local variables
│  ├─ Return addresses
│  └─ Temporary values
│  Size: typically 1 MB - 10 MB
│  Growth direction: upward (toward higher addresses)
│
├─ Heap (grows downward from ceiling)
│  ├─ Large tensors (query, weights)
│  ├─ Intermediate activations
│  ├─ Dynamically allocated objects
│  └─ Garbage collection managed
│  Size: typically 100 MB - 1 GB
│  Growth direction: downward (toward lower addresses)
│
└─ Reserved
   └─ System, unmapped
```

### 2.2 Stack Frame Layout

```
Each function call has a frame:

┌──────────────────────┐  (high address)
│ Return address       │  (8 bytes)
├──────────────────────┤
│ Saved BP (RBP)       │  (8 bytes)
├──────────────────────┤
│ Local variables      │  (variable)
├──────────────────────┤
│ Spill slots          │  (variable)
├──────────────────────┤ ← Current SP
│ Temporary values     │  (variable)
│ (computation)        │
└──────────────────────┘  (low address, toward caller)
```

### 2.3 Heap Layout

```
Heap stores large objects:

┌─────────────────────────────────────┐
│ Query embedding q (d*8 bytes)       │
│  [f64, f64, ..., f64] (d elements)  │
├─────────────────────────────────────┤
│ Weight matrix W (m*d*8 bytes)       │
│  row-major layout                   │
├─────────────────────────────────────┤
│ Activation cache                    │
│  [z, z_a, z_b, z_c, z_ens]         │
├─────────────────────────────────────┤
│ Intermediate tensors                │
│  (temporary during computation)     │
├─────────────────────────────────────┤
│ Free space                          │
└─────────────────────────────────────┘
```

## 3. Execution Model

### 3.1 Single-Threaded Execution

```
Program counter (PC): current instruction address
Stack pointer (SP): top of stack
Base pointer (BP): frame base for function

Execution loop:
  while (PC < program_end):
    opcode = fetch_opcode(PC)
    operand_count = opcode_operands[opcode]

    match opcode:
      case ENCODE_Q:
        q = pop_stack()
        z = encoder.forward(q)  // neural computation
        push_stack(z)

      case ENSEMBLE:
        z_c = pop_stack()
        z_b = pop_stack()
        z_a = pop_stack()
        gamma = pop_stack()
        beta = pop_stack()
        alpha = pop_stack()
        z_ens = alpha*z_a + beta*z_b + gamma*z_c
        push_stack(z_ens)

      ... (other opcodes)

    PC += opcode_size[opcode]
```

### 3.2 Control Flow

```
Sequential:
  PC₀ → PC₁ → PC₂ → ... (normal increment)

Branching:
  At JUMP_IF_TRUE:
    if condition:
      PC = target_address
    else:
      PC += instruction_size

Looping:
  LOOP_START: save counter, PC_start
  LOOP_END:   counter -= 1; if counter > 0: PC = PC_start

Function calls (future):
  CALL:       push return address, PC = function entry
  RETURN:     pop return address, PC = return address
```

### 3.3 Error Handling

```
At runtime, errors can occur:

1. Stack underflow
   Action: raise StackUnderflowError, halt

2. Invalid memory access
   Action: raise SegmentationFault, halt

3. Numerical error (NaN, Inf)
   Action: propagate as invalid value
          or raise FloatingPointError

4. Timeout (max instructions exceeded)
   Action: raise TimeoutError, halt

5. Resource exhaustion (heap full)
   Action: raise OutOfMemoryError, halt

Exception handling:
  try {
    execute_bytecode()
  } catch (error):
    print_error(error)
    cleanup()
    exit(error_code)
```

## 4. Stack-Based Computation

### 4.1 Stack as Computation Storage

```
Example: compute z_ens = α·z_a + β·z_b + γ·z_c

Before:
  Stack: [... , γ, z_c, β, z_b, α, z_a]  (bottom to top)

Execute: CONTRIB_A (compute α·z_a)
  POP z_a, α
  result = α * z_a
  PUSH α·z_a

After CONTRIB_A:
  Stack: [... , γ, z_c, β, z_b, α·z_a]

Execute: CONTRIB_B
After CONTRIB_B:
  Stack: [... , γ, z_c, β·z_b, α·z_a]

Execute: CONTRIB_C
After CONTRIB_C:
  Stack: [... , γ·z_c, β·z_b, α·z_a]

Execute: ADD ADD (combine three)
After:
  Stack: [... , z_ens]
```

### 4.2 Register Optimization

```
Some values cached in registers for speed:

r0: current latent (z)
r1: path A result (z_a)
r2: path B result (z_b)
r3: path C result (z_c)
r4: weights [α, β, γ]
r5: ensemble result (z_ens)
r6: confidence (δ)
r7: general purpose

Register assignments:
  REGISTER_ALLOC r0 = z      // persistent
  REGISTER_ALLOC r1 = z_a
  REGISTER_ALLOC r2 = z_b    // after FORK_PATHS
  REGISTER_ALLOC r3 = z_c

  // Use MOV instruction to transfer between stack and registers
  MOV_TO_REG r0, stack       // copy top of stack to r0
  MOV_FROM_REG stack, r0     // copy r0 to stack
```

## 5. Thread and Parallelism Management

### 5.1 Thread Pool

```
Global thread pool at startup:

num_worker_threads = min(num_cpu_cores, max_threads)

Worker threads:
  [Thread 0] - idle, waiting for work
  [Thread 1] - idle
  [Thread 2] - idle
  ...

Work queue (thread-safe):
  Queue: [Task, Task, Task, ...]

Each worker loops:
  while not_terminated:
    task = work_queue.dequeue()
    if task:
      execute(task)
    else:
      sleep()
```

### 5.2 FORK_PATHS Execution

```
Main thread at FORK_PATHS:
  1. Save current state
  2. Create three tasks:
     Task_A: execute PROJECT_A with register[r0] as input
     Task_B: execute PROJECT_B
     Task_C: execute PROJECT_C
  3. Enqueue all three tasks
  4. Yield until BARRIER

Worker threads:
  Thread 1: takes Task_A, computes z_a, stores in r1, signal completion
  Thread 2: takes Task_B, computes z_b, stores in r2, signal completion
  Thread 3: takes Task_C, computes z_c, stores in r3, signal completion

Main thread at BARRIER:
  Wait for all three signals
  Continue with r0, r1, r2, r3 all populated
```

### 5.3 Synchronization Primitives

```
Barrier:
  barrier_init(count=3)
  thread_1 → barrier_wait()  // blocks
  thread_2 → barrier_wait()  // blocks
  thread_3 → barrier_wait()  // blocks until all 3 arrive
  // All released
  All proceed simultaneously

Lock (for shared resources):
  lock.acquire()
  critical_section()
  lock.release()

Atomic operations:
  atomic_add(x, 5)   // thread-safe x += 5
  atomic_swap(ptr1, ptr2)
```

### 5.4 Work Stealing

```
If one thread finishes early:
  1. Check its local queue (no work)
  2. Try to steal from other threads' queues
  3. Remove half of stolen thread's work
  4. Execute stolen work

Benefit: better load balancing
```

## 6. Garbage Collection (Optional)

### 6.1 Mark-and-Sweep GC

```
GC phases:

1. Mark phase:
   - Start from roots (stack, registers)
   - DFS/BFS through reachable objects
   - Mark each reachable object

2. Sweep phase:
   - Iterate through all heap objects
   - If not marked: deallocate
   - If marked: unmark for next cycle

3. Compaction (optional):
   - Move remaining objects to eliminate fragmentation
   - Update all pointers
```

### 6.2 When to GC

```
Trigger GC when:
  - heap_used > heap_threshold (e.g., 80%)
  - explicit call: gc()
  - periodic (every N instructions)

GC stops:
  - Pause all worker threads
  - Mark and sweep
  - Resume threads
```

## 7. Error Recovery and Debugging

### 7.1 Debug Mode

```
Enable with: --debug flag

Behaviors:
  - Log every opcode execution
  - Track stack state after each op
  - Record heap allocations
  - Print register values

Log format:
  [PC=0x1234] ENCODE_Q
    Stack before: [q]
    Stack after: [z]
    Time: 1.23 ms
    Registers: r0=z, r1=?, ...
```

### 7.2 Breakpoints

```
Set breakpoint:
  breakpoint(condition: bool)

Example:
  if confidence < 0.3:
    breakpoint(true)

Debugger commands:
  continue      - resume execution
  step          - execute one opcode
  print_stack   - show stack contents
  print_regs    - show registers
  show_heap     - show heap allocations
```

## 8. Performance Monitoring

### 8.1 Metrics Collected

```
Per instruction:
  - Execution time
  - Memory access (cache hits/misses)
  - Thread utilization

Per program:
  - Total runtime
  - Peak memory usage
  - Thread efficiency
  - Cache hit ratio

Reported as:
  Total time: 5.23 ms
  Breakdown:
    - Encoding: 1.23 ms (23%)
    - Path computation: 2.50 ms (48%, parallelized 3x)
    - Ensemble: 0.50 ms (10%)
    - Critique: 0.30 ms (6%)
    - Sampling: 0.70 ms (13%)
```

### 8.2 Profiling

```
Profile-guided optimization:

1. Collect execution profile
2. Identify hot spots (functions with high time)
3. Optimize hot paths
4. Re-profile to verify improvement

Example hot path:
  SOFTMAX (in SAMPLE opcode) takes 2 ms
  → Optimize using SIMD
  → New time: 0.5 ms
```

## 9. Resource Limits

### 9.1 Configurable Limits

```
max_stack_size: 10 MB
  → Prevents stack overflow
  → Raises error if exceeded

max_heap_size: 500 MB
  → Prevents unbounded memory growth
  → Triggers GC more frequently

max_instructions: 10^7
  → Prevents infinite loops
  → Typical for 10 tokens: 10k instructions

max_threads: 16
  → Limits thread pool size
  → Balance between parallelism and overhead

max_execution_time: 60 seconds
  → Wall-clock timeout
  → Prevents hanging
```

### 9.2 Enforcement

```
Check at each opcode:
  if instructions_executed > max_instructions:
    raise TimeoutError("Instruction limit exceeded")

Check on stack push:
  if SP - BP > max_stack_size:
    raise StackOverflowError()

Check on heap allocation:
  if heap_used > max_heap_size:
    raise OutOfMemoryError()
```

## 10. Runtime Configuration

### 10.1 Configuration File (runtime.cfg)

```
# Memory
stack_size_mb=10
heap_size_mb=500
gc_threshold_percent=80

# Parallelism
max_worker_threads=8
work_steal_enabled=true
barrier_timeout_ms=5000

# Profiling
enable_profiling=false
enable_logging=false
log_level=warn  # debug, info, warn, error

# Optimization
register_allocation=true
simd_enabled=true
cache_constant_tensors=true

# Limits
max_instructions=10000000
max_execution_time_sec=60
```

### 10.2 Runtime Initialization

```
RuntimeConfig config = parse_config_file("runtime.cfg")
Runtime runtime = Runtime::new(config)

runtime.allocate_stack(config.stack_size_mb)
runtime.allocate_heap(config.heap_size_mb)
runtime.create_thread_pool(config.max_worker_threads)

runtime.load_bytecode("program.mind")
runtime.execute()
```

## 11. Runtime Summary Table

| Component | Purpose | Example Value |
|-----------|---------|----------------|
| Stack | Local storage | 10 MB |
| Heap | Tensor storage | 500 MB |
| Registers | Fast cache | r0-r7 |
| PC | Instruction pointer | 0x1234 |
| SP | Stack pointer | 0xFFFFF000 |
| BP | Base pointer | 0xFFFFF500 |
| Thread pool | Parallelism | 8 threads |
| GC | Memory reclamation | Mark-sweep |
| Profiler | Performance monitoring | enabled |

---

**Cross-references**:
- SPEC_04_BYTECODE.md for instruction details
- SPEC_07_PARALLELISM.md for threading model
