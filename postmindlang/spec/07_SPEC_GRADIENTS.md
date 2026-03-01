# ∇: ΔΙΑΦΟΡΙΚΗ ΔΟΜΗ ΚΑΙ ΑΝΤΙΣΤΡΟΦΗ ΔΙΑΔΟΣΗ

## I. Ορισμός Gradient

Gradient:
∇_x f(x) := (∂f/∂x₁, ∂f/∂x₂, ..., ∂f/∂x_n)^T ∈ ℝ^n

(Vector of partial derivatives)

Jacobian (Generalization for Vector Functions):
f: ℝ^m → ℝ^n

J_f ∈ ℝ^{n×m}
(J_f)_{ij} = ∂f_i/∂x_j

Hessian (Second-Order):
H_f ∈ ℝ^{n×n}
(H_f)_{ij} = ∂²f/∂x_i ∂x_j

(Matrix of mixed second derivatives)

## II. Chain Rule

Βαθμιαία Περίπτωση:
f: ℝ → ℝ, g: ℝ → ℝ

d(f ∘ g)/dx = (df/dg) · (dg/dx)

Multivariate Περίπτωση:
f: ℝ^n → ℝ^k, g: ℝ^m → ℝ^n

J_{f∘g} = J_f · J_g ∈ ℝ^{k×m}

(Product of Jacobians)

Σε Διανυσματικές Όρους:
Έστω L: ℝ^k → ℝ (scalar loss)

∂L/∂x = (∂L/∂f)^T · (∂f/∂x) = J_f^T · ∇_f L

(Upstream gradient · local Jacobian)

## III. Backpropagation Σχημα

Computational Graph:
z₁ → z₂ → ... → z_n = L (loss)

Αριθμητική Αντιστροφη (Reverse-Mode):
Ξεκινήστε από το τέλος (L) και πρέπει προς τα πίσω

Forward Pass (Compute):
z₁ = input
z_i = f_i(z_{i-1}) για i = 2, ..., n

Backward Pass (Accumulate Gradients):
ḡ_n := ∂L/∂z_n = 1 (base case)

ḡ_{n-1} := ḡ_n · ∂z_n/∂z_{n-1}
ḡ_{n-2} := ḡ_{n-1} · ∂z_{n-1}/∂z_{n-2}
...
ḡ_1 := ḡ_2 · ∂z_2/∂z_1

Final Result:
∇_{z_1} L = ḡ_1

## IV. Gradient Rules για Στοιχειώδης Πράξης

Addition:
f(x, y) = x + y

∂f/∂x = I, ∂f/∂y = I

Ερμηνεία: Gradient "διακλαδώνεται" ίσα στα δύο inputs

Multiplication (Scalar):
f(x, y) = xy (both scalars)

∂f/∂x = y, ∂f/∂y = x

Gradient: df/dx = y, df/dy = x

Matrix Multiplication:
C = AB, A ∈ ℝ^{m×n}, B ∈ ℝ^{n×k}

∂L/∂A = (∂L/∂C) · B^T ∈ ℝ^{m×n}
∂L/∂B = A^T · (∂L/∂C) ∈ ℝ^{n×k}

(Transpose του άλλου παράγοντα)

Element-wise Operations:
f(x) = σ(x) (activation function)

∂f/∂x = σ'(x) (element-wise derivative)

Example (ReLU):
σ(x) = max(0, x)

σ'(x) = {1 αν x > 0
       {0 αλλιώς

∂L/∂x = (∂L/∂σ) ⊙ σ'(x) (element-wise product)

Dot Product:
f(x, y) = x^T y = Σᵢ xᵢ yᵢ

∂f/∂x = y, ∂f/∂y = x

L2 Norm:
f(x) = ||x||₂ = √(x^T x)

∂f/∂x = x / ||x||₂ (unit vector in direction of x)

## V. Softmax Gradient

Softmax Function:
f(z) = softmax(z) ∈ ℝ^n

f_i = exp(z_i) / Σ_j exp(z_j)

Jacobian:
∂f_i/∂z_j = { f_i(1 - f_i)     αν i = j
            { -f_i f_j         αν i ≠ j

Μητρική Μορφή:
J_f = diag(f) - f f^T

(Outer product)

Combined with Cross-Entropy:
L = -log(f_y) (for label y)

∂L/∂z_i = f_i - δ_{iy}

(f_i - 1_i, where 1_i = 1 if i=y, else 0)

Ιδιαιτερότητα: Gradient είναι απλούστερο για cross-entropy than softmax separately

## VI. Batch Normalization Gradient

Batch Norm:
z_norm = (z - μ_batch) / √(σ²_batch + ε)

f(z) = γ z_norm + β

Backward Pass (Complex due to batch statistics):

∂L/∂z_norm = (∂L/∂f) ⊙ γ

∂L/∂γ = Σ_i (∂L/∂f_i) z_norm,i

∂L/∂β = Σ_i ∂L/∂f_i

∂L/∂σ²_batch = Σ_i (∂L/∂z_norm,i) · (z_i - μ_batch) · (-1/2) · (σ²_batch + ε)^{-3/2}

∂L/∂μ_batch = Σ_i (∂L/∂z_norm,i) · (-1/√(σ²_batch + ε)) + (∂L/∂σ²_batch) · Σ_i 2(z_i - μ_batch) / |batch|

∂L/∂z_i = (∂L/∂z_norm,i) · (1/√(σ²_batch + ε)) + (∂L/∂σ²_batch) · 2(z_i - μ_batch) / |batch| + (∂L/∂μ_batch) / |batch|

(Extremely non-local!)

## VII. Recurrent Structures - Truncated Backpropagation Through Time (BPTT)

Recurrent Relation:
h_t = f(h_{t-1}, x_t; θ)

L = Σ_t ℓ_t(h_t, y_t)

Unrolled Computation Graph:
x₁ → h₁ → ℓ₁ \
                 → L
x₂ → h₂ → ℓ₂ /

Backward Pass:
∂L/∂h_T = ∂ℓ_T/∂h_T

∂L/∂h_t = ∂ℓ_t/∂h_t + (∂L/∂h_{t+1}) · (∂h_{t+1}/∂h_t)

(Gradient flows backward through time)

Truncation:
Αν η sequence είναι πολύ μακρά, κόψτε το backprop σε τ timesteps:

∂L/∂h_{t-τ} ≈ 0 (assume vanishing after τ steps)

## VIII. Convolutional Layer Gradient

Convolution:
y = x * w (convolution with kernel w)

(y)_i = Σ_j x_{i+j} w_j

Gradient w.r.t. Input:
∂L/∂x_i = Σ_j (∂L/∂y_j) · (∂y_j/∂x_i)
        = Σ_j (∂L/∂y_j) · [w_j if i ∈ receptive field]

Gradient w.r.t. Kernel:
∂L/∂w_j = Σ_i (∂L/∂y_i) · x_{i+j}

(Correlation of upstream gradient with input)

## IX. Attention Mechanism Gradient

Attention (Simplified):
scores = Q · K^T / √d_k
α = softmax(scores)
output = α · V

Backward:

∂L/∂α (upstream gradient)
∂L/∂scores = ???

Chain rule through softmax:
∂L/∂score_i = Σ_j (∂L/∂α_j) · ∂α_j/∂score_i

Using softmax Jacobian (Section V):
∂α_j/∂score_i = α_i(δ_{ij} - α_j)

∂L/∂score_i = Σ_j (∂L/∂α_j) · α_i(δ_{ij} - α_j)
            = α_i[(∂L/∂α_i) - Σ_j (∂L/∂α_j) α_j]

∂L/∂Q, ∂L/∂K, ∂L/∂V: πολλαπλασιάστε με αντίστοιχα transpose

## X. Numerical Gradient Verification (Gradient Checking)

Finite Differences:
f'(x) ≈ (f(x + h) - f(x - h)) / (2h)

(Central difference, O(h²) error)

Algorithm:
For each parameter θ_i:
1. Compute f(θ + h e_i) - f(θ - h e_i) / (2h) = numerical_grad_i
2. Compute analytical ∂L/∂θ_i via backprop
3. Check: |numerical_grad_i - analytical_grad_i| < ε

(Verify gradients are computed correctly)

Typical ε: 1e-5 for float32, 1e-8 for float64

## XI. Γενικευμένα Μη-Διαφορίσιμα Σημεία

ReLU και Άλλες Piecewise Differentiable:
At x = 0:
- Left derivative: 0
- Right derivative: 1
- No defined derivative

Handling: Αυθαίρετα επιλέγουμε μία (συνήθως right derivative)

ή χρησιμοποιούμε "subgradient" (generalized gradient)

Subgradient:
g ∈ ∂f(x) ⟺ f(y) ≥ f(x) + g^T(y - x) ∀y

(Set-valued derivative)

For ReLU at x=0: ∂ReLU(0) = [0, 1] (any value works)

## XII. Automatic Differentiation

Two Modes:

Forward Mode:
Compute derivatives alongside forward pass

v = ∂z₁/∂x (seed: velocity vector)
v = (∂z₂/∂z₁) v
...

Efficient for few inputs, many outputs

Reverse Mode (Backpropagation):
Compute derivatives after full forward pass

ḡ = ∂L/∂z_n (seed: gradient)
ḡ = (∂z_n/∂z_{n-1})^T ḡ
...

Efficient for many inputs, few outputs

## XIII. Mixed Precision Training

Float32 (Full Precision):
32 bits per number
Range: ±10^{-38} to ±10^{38}

Float16 (Half Precision):
16 bits per number
Range: ±6e-5 to ±6e4 (limited!)

Technique:
1. Forward pass: float16
2. Loss computation: float32 (avoid underflow)
3. Backward: float16, accumulate in float32
4. Parameter update: float32

Loss Scaling:
L_scaled = L × scale (prevent underflow in gradients)
∂L_scaled/∂θ = scale · ∂L/∂θ
Unscale before updating θ

## XIV. Gradient Accumulation

Problem: Batch size limited by GPU memory

Solution: Process smaller micro-batches, accumulate gradients

Algorithm:
for batch in get_batches(accumulation_steps):
    loss = compute_loss(batch)
    loss.backward()  // accumulate gradients
    (don't update yet)

# After K micro-batches:
optimizer.step()  // single update with accumulated gradient
optimizer.zero_grad()

Equivalent to training with batch_size × accumulation_steps

## XV. Second-Order Gradients (Hessian-Vector Products)

Computing Hessian Directly:
H[i,j] = ∂²L/(∂θ_i ∂θ_j)

Expensive: O(p²) time, O(p²) memory

Hessian-Vector Product:
H · v = ∂/∂ε[∇_θ L(θ + ε v)]|_{ε=0}

Algorithm:
1. Compute g = ∇_θ L(θ)
2. Compute ∂g/∂ε[θ + ε v] = (∇²L) · v

Using AD (reverse of reverse mode):
hvp = grad(grad(loss, θ) · v)

Efficient: O(p) time, O(p) memory (same as gradient)

---

Αυτό το έγγραφο αποδεικνύει ότι η διαφοροποίηση και η backpropagation είναι πλήρως αριθμητικές διαδικασίες. Κάθε κανόνας είναι μαθηματικά ακριβής και υπολογίσιμη.
