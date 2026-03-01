# Ξ: ΣΗΜΕΙΩΣΕΙΣ ΥΛΟΠΟΙΗΣΗΣ

## I. Αρχιτεκτονική Μνήμης

Row-Major (C-style) Layout:
A ∈ ℝ^{m×n} αποθηκεύεται ως ενιαία μονοδιάστατη πίνακα

address(i, j) = base + (i * n + j) * sizeof(element)

Πλεονέκτημα: Sequential access όταν επαναλαμβάνουμε γραμμές
Μειονέκτημα: Random column access είναι κακή

Column-Major (Fortran-style) Layout:
address(i, j) = base + (j * m + i) * sizeof(element)

Πλεονέκτημα: Sequential access στηλών
Μειονέκτημα: Random row access είναι κακή

Cache Line Optimization:
CPU cache line: 64 bytes (typical)

For float32: 16 elements fit in one cache line
For float64: 8 elements fit in one cache line

Implication:
Προσπαθήστε να έχετε δεδομένα aligned σε cache line boundaries

Block-Wise Access:
Αντί ολόκληρης του πίνακα, επεξεργάστε σε blocks
- Βελτιώνει locality
- Μείωση cache misses

## II. Vectorization με NumPy/Array Operations

Numpy Array Operations:
A, B ∈ ℝ^{m×n}

# Vectorized (fast, uses BLAS):
C = np.dot(A, B)  # O(1) loop overhead
C = A + B
C = np.maximum(A, 0)  # ReLU

# Python loop (slow):
for i in range(m):
    for j in range(n):
        C[i,j] = ...

Speed difference: 10-100×

BLAS Routines (Basic Linear Algebra Subprograms):

Level 1: Vector operations, O(n)
- Dot product: α = x^T y
- Scaling: y = αx

Level 2: Matrix-vector, O(n²)
- y = Ax
- A = A + xy^T

Level 3: Matrix-matrix, O(n³)
- C = AB
- C = ABC

Underlying Implementation: BLAS uses:
- SIMD (Single Instruction Multiple Data)
- Loop unrolling
- Tiling (blocking)
- Multithreading

## III. SIMD (Single Instruction Multiple Data)

Concept:
Ένα instruction ενεργεί σε πολλαπλά elements ταυτόχρονα

SSE (Streaming SIMD Extensions):
- 128-bit registers
- 4 float32 ή 2 float64

AVX (Advanced Vector Extensions):
- 256-bit registers
- 8 float32 ή 4 float64

AVX-512:
- 512-bit registers
- 16 float32 ή 8 float64

Example (Manual SIMD, pseudocode):
# Scalar version:
for i in 0..N:
    c[i] = a[i] + b[i]

# SIMD version (AVX):
for i in 0..N step 8:
    c[i:i+8] = a[i:i+8] +_SIMD b[i:i+8]  # 8 adds in 1 cycle

Speedup: ~8× for this operation

Modern NumPy/PyTorch:
Automatically uses SIMD όταν κατάλληλο

## IV. Quantization

Float32 (Default):
32 bits per number
Precision: ~7 significant digits

Float16 (Half Precision):
16 bits per number
Precision: ~4 significant digits
Range: ±6e-5 to ±6e4

INT8 (Signed Byte):
8 bits, range [-128, 127]

Quantization Scheme (Linear):
x_int = round(x_float / scale) + zero_point

x_float = (x_int - zero_point) * scale

Parameters:
- scale ∈ ℝ₊: η κλίμακα
- zero_point ∈ ℤ: offset

Post-Training Quantization (PTQ):
1. Train on full precision
2. Convert weights to INT8
3. Inference in INT8

Implication:
- Model size: 4× μικρότερο (float32 → INT8)
- Computation: ~4× faster
- Accuracy loss: minimal (typically <1%)

Quantization-Aware Training (QAT):
Train with quantization simulation
- Better accuracy preservation
- Slightly slower training

## V. GPU Implementation

GPU Memory Hierarchy:

Registers (very fast, very small):
- Per-thread
- Typical: 256-KB per SM (streaming multiprocessor)
- ~1 cycle latency

Shared Memory (fast, small):
- Per-block
- Typical: 48-96 KB per block
- ~10-20 cycle latency

Global Memory (slow, large):
- Per GPU
- Typical: 16-80 GB
- ~100-400 cycle latency

Bandwidth:
- Register: ~petabytes/s (infinite within core)
- Shared: ~terabytes/s
- Global: 100-1000 GB/s

Optimization Strategy:
1. Keep working set in shared memory
2. Minimize global memory transfers
3. Use coalesced access patterns

Coalescing:
Threads in a warp (32 threads) access adjacent memory locations
- Fully coalesced: 1 memory transaction
- Partially coalesced: multiple transactions
- Scattered: very inefficient

Example (Matrix Multiplication on GPU):
Block-wise tiling:

```
Load submatrix A[blockIdx.x * BLOCK_SIZE : ...] to shared mem
Load submatrix B[blockIdx.y * BLOCK_SIZE : ...] to shared mem
Synchronize (ensure load complete)
Compute C = C + A * B (in shared/registers)
Store result to global memory
```

Performance: 10-100× faster than single-threaded CPU

## VI. Parallelization

Data Parallelism:
Multiple GPUs/CPUs compute on different data

Architecture:
- Each worker: processes batch_size / num_workers examples
- Aggregate gradients: all-reduce or centralized

Synchronous SGD:
All workers wait for slowest

Gradient Aggregation:
∇_total = (1/K) Σ_k ∇_k

Communication Cost:
O(p) where p = number of parameters

Asynchronous SGD:
Workers update independently

Advantage: No waiting
Disadvantage: Stale gradients

Model Parallelism:
Different parts of model on different devices

Example:
Layer 1-50: GPU0
Layer 51-100: GPU1

Forward pass:
x → GPU0 → h_{50} → GPU1 → output

Backward pass:
output_grad ← GPU1 ← h_{50}_grad ← GPU0

Communication: At layer boundaries

Communication vs Computation Overlap:
While computing on GPU0, transfer gradients from GPU1
pipelined execution

## VII. Sparse Tensors

Sparse Representation:
Instead of storing m×n matrix, store only non-zeros

Coordinate Format (COO):
(row, col, value) triples

```
[[1, 0, 2],
 [0, 0, 0],
 [3, 0, 4]]

COO: [(0,0,1), (0,2,2), (2,0,3), (2,2,4)]
```

Compressed Sparse Row (CSR):
row_ptr: where each row starts in data
col_idx: column indices
data: values

Example:
```
row_ptr = [0, 2, 2, 4]
col_idx = [0, 2, 0, 2]
data = [1, 2, 3, 4]
```

Memory Savings:
If sparsity = 95% (only 5% non-zero):
Dense: m×n storage
Sparse: 3×nnz storage, nnz = 0.05×m×n
Savings: 20× reduction

Operation Efficiency:
Sparse-Dense Matrix Multiply: O(nnz × n)
vs Dense-Dense: O(m×n×k)

Speedup: depends on sparsity level

## VIII. Automatic Mixed Precision (AMP)

PyTorch/TensorFlow Implementation:

Datatype Selection (Automatic):
- Convolution, Dense: float16
- Normalization, Reduction: float32
- Loss computation: float32

Algorithm:
```
with torch.cuda.amp.autocast():
    output = model(input)  # float16 where possible
    loss = criterion(output, target)  # float32

scaler.scale(loss).backward()  # scaled backward
scaler.unscale_(optimizer)  # unscale gradients
scaler.step(optimizer)  # update
scaler.update()  # adjust scale dynamically
```

Benefits:
- ~2× speedup
- Reduced memory (float16 weights + activations)
- Minimal accuracy loss

## IX. Compiler Optimization (XLA, TVM, etc.)

Just-in-Time (JIT) Compilation:
Computational graph → machine code

XLA (Accelerated Linear Algebra):
1. Receive computation graph
2. Fuse operations (reduce memory traffic)
3. Generate optimized kernel code
4. Compile to LLVM/machine code

Example Fusion:
```
C = A + B  (load A, B, add, write C)
D = C * 2  (load C, multiply, write D)
```

Fused:
```
D = (A + B) * 2  (load A, B, compute A+B, multiply by 2, write D)
```

Memory: 2 reads/writes vs 3

TVM (Tensor Virtual Machine):
Automatic code generation for tensor operations
- Supports various backends (CPU, GPU, mobile)
- Autotuning: Generates multiple kernels, benchmarks, selects best

## X. Numerical Stability

Underflow:
Very small numbers round to zero

Example: float32 underflow ≈ 1e-38

Solution:
- Use float64 for accumulation
- Normalize intermediate results

Overflow:
Very large numbers become infinity

Example: exp(1000) = inf

Solution:
- Use log-sum-exp trick: log(Σ exp(xᵢ)) = max(xᵢ) + log(Σ exp(xᵢ - max(xᵢ)))

Catastrophic Cancellation:
Subtraction of nearly-equal numbers causes precision loss

Example:
a = 1.0000001
b = 1.0000000
c = a - b = 1e-7 (many significant digits lost)

Solution:
- Reformulate computation algebraically
- Use numerically stable algorithms

## XI. Benchmarking και Profiling

Timing Measurements:
```
import time
start = time.perf_counter()
# operation
end = time.perf_counter()
elapsed = end - start
```

Pitfalls:
- GPU operations are asynchronous: need torch.cuda.synchronize()
- Warmup: first iteration often slow

Profile-Guided Optimization:
1. Run with profiler (cProfile, torch.profiler)
2. Identify bottlenecks
3. Optimize top 10%

Memory Profiling:
torch.cuda.memory_allocated()
torch.cuda.max_memory_allocated()

## XII. Reproducibility

Sources of Non-Determinism:
- Floating-point order: (a+b)+c ≠ a+(b+c)
- Hash-based operations: dict iteration order
- Parallel execution: thread scheduling varies
- GPU operations: some have non-deterministic implementations

Ensuring Reproducibility:
```
import torch
import numpy as np
import random

seed = 42
random.seed(seed)
np.random.seed(seed)
torch.manual_seed(seed)
torch.cuda.manual_seed_all(seed)

# Disable some optimizations
torch.backends.cudnn.deterministic = True
torch.backends.cudnn.benchmark = False
```

Trade-off: Determinism vs Performance (~5-10% slower)

## XIII. Production Deployment

Model Serialization:
Save model weights + architecture

Formats:
- PyTorch: .pt, .pth (pickle-based)
- ONNX: Open format (platform-independent)
- SavedModel: TensorFlow format

Inference Optimization:
- Remove training-only layers (Dropout)
- Quantize to INT8
- Prune weights
- Distill to smaller model

Serving:
TensorFlow Serving, TorchServe, ONNX Runtime
- Load model once
- Batch inference requests
- Monitor latency, throughput

Latency Target:
Typical: 10-100ms per request
QPS (queries per second): 100-1000 for typical server

## XIV. Testing Strategy

Unit Tests:
Test individual layers/functions

Example:
```
def test_relu():
    x = np.array([-1, 0, 1])
    expected = np.array([0, 0, 1])
    assert np.allclose(relu(x), expected)
```

Gradient Checking:
Numerical vs analytical gradients (Section X, Spec_Gradients)

Integration Tests:
Train on toy dataset, verify loss decreases

Regression Tests:
Compare current vs previous version
Ensure no performance degradation

## XV. Hyperparameter Tuning

Grid Search:
Try all combinations of hyperparameters

Example:
```
lr in [1e-4, 1e-3, 1e-2]
batch_size in [32, 64, 128]
```
Total: 3 × 3 = 9 configurations

Random Search:
Sample hyperparameters uniformly

Advantage: More efficient for high-dimensional spaces

Bayesian Optimization:
Model the objective function P(performance | hyperparams)
Use acquisition function to select next hyperparams

Implementation: HyperOpt, Optuna, Ray Tune

---

Αυτό το έγγραφο καθορίζει τις πρακτικές λεπτομέρειες υλοποίησης. Κάθε βελτιστοποίηση είναι μια μαθηματική εγκατάσταση ή μια αριθμητική τεχνική. Δεν υπάρχει κανένα "κόλπο" - μόνο δομή.
