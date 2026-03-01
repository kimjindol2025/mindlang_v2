# 𝒪: ΒΕΛΤΙΣΤΟΠΟΙΗΣΗ

## I. Ορισμός του Προβλήματος Βελτιστοποίησης

Σκοπός:
Ελαχιστοποίηση της συνάρτησης απώλειας L σε σχέση με τις παράμετροι θ

min_θ L(θ) = min_θ E_{(q,y)~D}[ℓ(f_θ(q), y)]

Όπου:
- θ ∈ ℝ^p = διανύσμα παραμέτρων (weights, biases, κ.λ.π.)
- D = σύνολο δεδομένων εκπαίδευσης
- f_θ = μοντέλο με παραμέτρους θ
- ℓ: ℝ^V × {1,...,V} → ℝ = συνάρτηση απώλειας ανά δείγμα
- L = μέσο σφάλμα

## II. Συναρτήσεις Απώλειας

Cross-Entropy Loss (Ταξινόμηση):
ℓ(logits, y) = -log(softmax(logits)_y) = -log P(y | logits)

= -logits_y + log(Σ_j exp(logits_j))

Ιδιότητες:
- ℓ ≥ 0, με ℓ = 0 ⟺ logits_y = +∞ (perfect prediction)
- ℓ → ∞ όταν P(y | logits) → 0

L2 Regression Loss:
ℓ(ŷ, y) = ||ŷ - y||₂² = Σᵢ(ŷᵢ - yᵢ)²

L1 Regression Loss:
ℓ(ŷ, y) = ||ŷ - y||₁ = Σᵢ|ŷᵢ - yᵢ|

Huber Loss:
ℓ(ŷ, y, δ) = { (1/2)(ŷ - y)² αν |ŷ - y| ≤ δ
             { δ(|ŷ - y| - δ/2) αλλιώς

(Robust to outliers)

Margin Loss (SVM-style):
ℓ(ŷ, y) = max(0, 1 - y·ŷ)

(Hinge loss)

KL Divergence (Probabilistic):
ℓ(P, Q) = KL(Q || P) = Σ_i Q_i log(Q_i / P_i)

Hellinger Distance:
ℓ(P, Q) = √(Σ_i (√P_i - √Q_i)²)

## III. Regularization

L2 Regularization (Weight Decay):
L_reg(θ) = L(θ) + λ ||θ||₂² = L(θ) + λ Σⱼ θⱼ²

λ ∈ ℝ₊ = regularization strength

Ερμηνεία: Τιμωρία για μεγάλα βάρη (manifold, απλούστερη λύση)

L1 Regularization (Lasso):
L_reg(θ) = L(θ) + λ ||θ||₁ = L(θ) + λ Σⱼ |θⱼ|

Ερμηνεία: Τιμωρία για μη-αραιή λύση (promotes sparsity)

Elastic Net:
L_reg(θ) = L(θ) + λ₁ ||θ||₁ + λ₂ ||θ||₂²

Γενικευμένο Ĺ_p Regularization:
L_reg(θ) = L(θ) + λ ||θ||_p^p = L(θ) + λ (Σⱼ |θⱼ|^p)

Dropout Regularization (Implicit):
Κατά το training, τυχαία "απενεργοποίηση" ορισμένων νευρώνων
P(neuron active) = 1 - p_drop

## IV. Gradient Descent Optimization

Gradient Descent (Batch):
θ_{t+1} = θ_t - η ∇_θ L(θ_t)

Όπου:
- η ∈ ℝ₊ = learning rate (step size)
- ∇_θ L = gradient του loss σε σχέση με θ

Convergence:
Αν η sufficiently small και L convex:
θ_t → θ* (global optimum)

Ρυθμός Σύγκλισης:
||θ_t - θ*|| = O(1/t) (sublinear για convex, α ∇ θ μη-κυρτή)

Stochastic Gradient Descent (SGD):
θ_{t+1} = θ_t - η ∇_θ ℓ(f_θ(q_t), y_t)

Όπου (q_t, y_t) ~ D (single sample)

Advantage: Faster per-iteration (O(1) vs O(|D|))
Disadvantage: Noisy updates

Mini-batch SGD:
θ_{t+1} = θ_t - η (1/|B|) Σ_{(q,y) ∈ B} ∇_θ ℓ(f_θ(q), y)

Όπου B ⊂ D, |B| ∈ [32, 256] (typical batch size)

## V. Adaptive Learning Rate Methods

Momentum:
m_t = β m_{t-1} + ∇_θ L(θ_t)
θ_{t+1} = θ_t - η m_t

Όπου β ∈ [0.9, 0.99] = momentum coefficient

Ερμηνεία: Δινοσύρία του gradient (δεν στοπάρουμε αμέσως)

Nesterov Momentum:
m_t = β m_{t-1} + ∇_θ L(θ_t - β m_{t-1})
θ_{t+1} = θ_t - η m_t

(Lookahead: gradient σε ενδιάμεσο σημείο)

AdaGrad:
G_t = G_{t-1} + (∇_θ L(θ_t))²
θ_{t+1} = θ_t - η (G_t + ε)^{-1/2} ⊙ ∇_θ L(θ_t)

Όπου ⊙ = element-wise multiplication, ε = numerical stability

Ερμηνεία: Κλιμάκωση της τάσης αντιστρόφως με την ιστορία κλίσης

RMSprop:
G_t = γ G_{t-1} + (1-γ) (∇_θ L(θ_t))²
θ_{t+1} = θ_t - η (√G_t + ε)^{-1} ⊙ ∇_θ L(θ_t)

(Exponential moving average of squared gradients)

Adam (Adaptive Moment Estimation):
m_t = β₁ m_{t-1} + (1-β₁) ∇_θ L(θ_t)                    (1st moment)
v_t = β₂ v_{t-1} + (1-β₂) (∇_θ L(θ_t))²                 (2nd moment)

m̂_t = m_t / (1 - β₁^t)     (bias correction)
v̂_t = v_t / (1 - β₂^t)     (bias correction)

θ_{t+1} = θ_t - η m̂_t / (√v̂_t + ε)

Typical hyperparameters:
- β₁ = 0.9 (momentum)
- β₂ = 0.999 (RMSprop decay)
- η = 10^{-3} (learning rate)
- ε = 10^{-8}

## VI. Learning Rate Scheduling

Constant Learning Rate:
η(t) = η₀

Linear Decay:
η(t) = η₀ (1 - t / T_max)

Step Decay:
η(t) = η₀ γ^⌊t / T_step⌋, γ ∈ (0, 1)

Exponential Decay:
η(t) = η₀ exp(-λ t)

Cosine Annealing:
η(t) = η₀/2 (1 + cos(πt/T_max))

Warm Restarts (SGDR):
η(t) = η₀/2 (1 + cos(πt_cur / T_i))

Όπου t_cur resets every T_i epochs

## VII. Gradient Clipping

Purpose: Αποτροπή exploding gradients

Norm-based Clipping:
g = ∇_θ L(θ)
g' = g / max(1, ||g||₂ / G_clip)

Element-wise Clipping:
g'_i = clip(g_i, -G_clip, G_clip)

## VIII. Convexity Analysis

Convex Function:
f είναι convex ⟺ ∀x, y, λ ∈ [0,1]:
f(λx + (1-λ)y) ≤ λf(x) + (1-λ)f(y)

Ισοδύναμα (για smooth f):
∇²f ≽ 0 (Hessian positive semidefinite)

Non-Convex Landscape (Typical for Deep Learning):
- Multiple local minima
- Saddle points
- Plateaus

Implication: Gradient descent δεν εγγυάται global optimum

## IX. Critical Points

Stationary Point:
∇_θ L(θ*) = 0

Local Minimum:
∃ε > 0: L(θ*) ≤ L(θ) ∀θ: ||θ - θ*||₂ < ε

Strict Local Minimum:
L(θ*) < L(θ) ∀θ ≠ θ*: ||θ - θ*||₂ < ε

Global Minimum:
L(θ*) ≤ L(θ) ∀θ

Saddle Point:
∇_θ L(θ*) = 0, αλλά ∃u, v: u^T ∇²L(θ*) u > 0, v^T ∇²L(θ*) v < 0

(Mixed curvature)

## X. Hessian Analysis

Hessian Matrix:
H_θ L := ∂²L/∂θᵢ∂θⱼ ∈ ℝ^{p×p}

(Matrix of second derivatives)

Ιδιοχρέες:
λ₁ ≥ λ₂ ≥ ... ≥ λ_p = eigenvalues of H_θ L

Ταξινόμηση Critical Point:
- Αν λᵢ > 0 ∀i: strict local minimum
- Αν λᵢ < 0 ∀i: strict local maximum
- Αν mixed signs: saddle point
- Αν some λᵢ = 0: degenerate (undefined)

Condition Number:
κ := λ_max / λ_min

(Measure of landscape curvature)

- κ ≈ 1: well-conditioned (easy optimization)
- κ ≫ 1: ill-conditioned (slow convergence)

## XI. Second-Order Methods

Newton Method:
θ_{t+1} = θ_t - (∇²_θ L(θ_t))^{-1} ∇_θ L(θ_t)

Ρυθμός Σύγκλισης: Τετραγωνικός (πολύ γρήγορος κοντά στο ελάχιστο)

Πρόβλημα: Υπολογισμός inverse Hessian είναι O(p³)

Quasi-Newton (BFGS, L-BFGS):
Προσέγγιση του inverse Hessian με low-rank updates

H_t^{-1} ≈ V_t^T D_t V_t (compact representation)

L-BFGS:
Κρατά μόνο τα τελευταία m gradients (π.χ., m = 20)

Memory: O(mp) instead of O(p²)

## XII. Trust Region Methods

Trust Region:
Προσέγγιμα αντικατάσταση της απώλειας με quadratic model στην περιοχή:

m(s) := L(θ_t) + ∇_θ L(θ_t)^T s + (1/2) s^T B_t s

Όπου B_t ≈ ∇²L(θ_t), s = proposed step

Constrained Minimization:
min_s m(s) subject to ||s||₂ ≤ Δ_t

(Δ_t = trust region radius)

Ratio:
ρ_t = (L(θ_t) - L(θ_t + s)) / (m(θ_t) - m(θ_t + s))

(Actual reduction / Predicted reduction)

Δ Update:
- Αν ρ_t > threshold (good prediction): Δ_{t+1} = Δ_t + ε
- Αν ρ_t < threshold (bad prediction): Δ_{t+1} = Δ_t - ε

## XIII. Distributed Optimization

Data Parallel:
Multiple GPUs/machines αναφέρουν δεδομένα, computing local gradients

1. Scatter: Δεδομένα σε όλα τα workers
2. Compute: Κάθε worker υπολογίζει ∇ℓ ανεξάρτητα
3. Reduce: Συγκεντρώστε gradients: ∇L = (1/K) Σ_k ∇ℓ_k
4. Update: θ ← θ - η ∇L

Synchronization Overhead: Communication cost

Asynchronous SGD:
Κάθε worker ενημερώνει θ ανεξάρτητα (χωρίς αναμονή)

Advantage: Δεν περιμένουμε για αργούς workers
Disadvantage: "Stale" gradients (θ αλλάζει ενώ υπολογίζουμε)

## XIV. Batch Normalization και Standardization

Batch Norm:
Κάθε ενεργοποίηση κανονικοποιείται στη batch

z_norm = (z - μ_batch) / √(σ²_batch + ε)

z_out = γ z_norm + β

Όπου:
- μ_batch = (1/|B|) Σ_{i ∈ B} z_i (batch mean)
- σ²_batch = (1/|B|) Σ_{i ∈ B} (z_i - μ_batch)² (batch variance)
- γ, β = learnable scale and shift

Ιδιότητες:
- Μείωση "internal covariate shift"
- Επιτρέπει υψηλότερα learning rates
- Ελαφρή κανονικοποίηση

Layer Norm:
Κανονικοποίηση ανά παράδειγμα (όχι κατά batch)

z_norm = (z - μ_sample) / √(σ²_sample + ε)

Ιδιότητες:
- Ανεξάρτητο από batch size
- Χρήσιμο σε RNNs, Transformers

## XV. Early Stopping

Motivation:
Το training loss μπορεί να συνεχίσει να μειώνεται, αλλά validation loss αυξάνεται (overfitting)

Algorithm:
1. Κάθε epoch, υπολογίστε L_val σε validation set
2. Αν L_val ≤ L_val,best - ε: L_val,best ← L_val
3. Αν epoch - epoch_best > patience: STOP

Ιδιότητες:
- Απλό, αποτελεσματικό
- Δεν αυξάνει υπολογιστικό κόστος

## XVI. Convergence Guarantees

Για Convex Functions:
∃ learning rate schedule η_t τέτοια ώστε:
L(θ_t) - L(θ*) = O(1/t)

(Sublinear convergence)

Για Strongly Convex (μ > 0):
∃ constant c: L(θ_t) - L(θ*) ≤ c · ρ^t

ρ < 1 (exponential/linear convergence)

Για Non-Convex Smooth Functions:
Gradient descent collects to stationary point:
lim_{t→∞} ||∇_θ L(θ_t)||₂ = 0

(Not necessarily minimum)

---

Αυτό το έγγραφο αποδεικνύει ότι η βελτιστοποίηση είναι πλήρως περιγράφεται ως μαθηματικές πράξεις σε παραμέτρων χώρο. Δεν υπάρχει καμία "διαίσθηση" ή "λύση" - μόνο επαναλήψεις και αριθμητικές μέθοδοι.
