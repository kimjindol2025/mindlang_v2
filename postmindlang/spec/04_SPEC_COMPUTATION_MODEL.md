# Ψ: ΥΠΟΛΟΓΙΣΤΙΚΟ ΜΟΝΤΕΛΟ

## I. Αρχιτεκτονική Ευρείας Άποψης

Ολικό Σύστημα:
𝒮 := (Enc, Proj, Weight, Ens, Crit, Sample)

Ροή Δεδομένων:
q ∈ ℝ^d_input
  ↓ Enc
z ∈ ℝ^d_latent
  ↓ Proj
(z_a, z_b, z_c) ∈ (ℝ^d_proj)³
  ↓ Weight
w ∈ Δ² ⊂ ℝ³
  ↓ Ens
e ∈ ℝ^d_proj
  ↓ Crit
(e, δ, confidence) ∈ ℝ^d_proj × ℝ^d_proj × ℝ
  ↓ Sample
y ∈ {1, 2, ..., V} (output vocabulary)

## II. Κωδικοποίηση (Encoding)

Συνάρτηση Κωδικοποίησης:
Enc: ℝ^{d_input} → ℝ^{d_latent}

Παραμετροποίηση:
Enc(q) = σ(W_enc q + b_enc)

Όπου:
- W_enc ∈ ℝ^{d_latent × d_input} (πίνακας κωδικοποίησης)
- b_enc ∈ ℝ^{d_latent} (bias vector)
- σ: ℝ^{d_latent} → ℝ^{d_latent} (activation function)

Συνήθεις Ενεργοποίηση:

ReLU: σ_ReLU(x) = max(0, x) = max(0, xᵢ) element-wise
Ιδιότητες:
- ∂σ_ReLU/∂x = 1 αν x > 0, αλλιώς 0 (non-differentiable at 0)
- Sparse activation (πολλά 0s)

GELU: σ_GELU(x) = x · Φ(x), Φ = CDF of N(0,1)
Ιδιότητες:
- Smooth, differentiable everywhere
- ∂σ_GELU/∂x = Φ(x) + x·φ(x) = Φ(x) + x·(1/√(2π))exp(-x²/2)

Tanh: σ_tanh(x) = (e^x - e^{-x})/(e^x + e^{-x})
Ιδιότητες:
- ∂σ_tanh/∂x = 1 - σ_tanh(x)²
- Range [-1, 1]

Επιλογή στο PostMindLang: Συνήθως GELU ή ReLU

Κωδικοποιημένη Έξοδος:
z = Enc(q) ∈ ℝ^{d_latent}

Τυπικά:
- d_input ∈ {256, 512, 768, 1024}
- d_latent ∈ {256, 512, 768}
- d_latent ≤ d_input (compression)

## III. Προβολή (Projection)

Τρι-Κατευθυντική Προβολή:
P_a, P_b, P_c: ℝ^{d_latent} → ℝ^{d_proj}

Ορισμός:
z_a = P_a(z) = σ(W_a z + b_a)
z_b = P_b(z) = σ(W_b z + b_b)
z_c = P_c(z) = σ(W_c z + b_c)

Όπου:
- W_a, W_b, W_c ∈ ℝ^{d_proj × d_latent}
- b_a, b_b, b_c ∈ ℝ^{d_proj}
- σ = ενεργοποίηση

Τυπικά:
- d_latent ∈ {256, 512, 768}
- d_proj ∈ {128, 256, 512}
- d_proj ≤ d_latent

Ερμηνεία:
Κάθε προβολή "φιλτράρει" τις πληροφορίες μέσω ενός διαφορετικού φακού.
- z_a = "αναλυτική" άποψη
- z_b = "διαισθητική" άποψη
- z_c = "συνθετική" άποψη

(Αυτές είναι ονοματοδοσίες. Μαθηματικά, είναι απλές γραμμικές μετασχηματισμοί.)

## IV. Βαρύτητα (Weighting)

Simplex:
Δ² := {w ∈ ℝ³ | wᵢ ≥ 0 ∀i, Σᵢ wᵢ = 1}

Παράδειγμα: w = (α, β, γ) με α + β + γ = 1, α,β,γ ≥ 0

Υπολογισμός Βαρών:
logits = f(q) ∈ ℝ³

Όπου f: ℝ^{d_input} → ℝ³ (neural network layer)

f(q) = W_weight q + b_weight
W_weight ∈ ℝ^{3 × d_input}
b_weight ∈ ℝ³

Softmax Normalization:
w = softmax(logits) = (exp(logitᵢ) / Σⱼ exp(logitⱼ))ᵢ₌₁,₂,₃

w ∈ Δ² (εγγυημένη)

Εναλλακτικά - Λογιστική Κανονικοποίηση:
w' = sigmoid(logits) ∈ [0,1]³
w = w' / (Σᵢ w'ᵢ) ∈ Δ² (κανονικοποίηση)

## V. Σύνολο (Ensemble)

Σταθμισμένη Σύνθεση:
e = α · z_a + β · z_b + γ · z_c ∈ ℝ^{d_proj}

Όπου w = (α, β, γ) ∈ Δ²

Ισοδύναμη Μητρική Μορφή:
e = [z_a | z_b | z_c] · w = Z_proj · w

Όπου Z_proj ∈ ℝ^{d_proj × 3}

Ιδιότητα Κυρτοτητας (Convexity):
e ∈ conv(z_a, z_b, z_c) (κυρτό περίβλημα των τριών διανυσμάτων)

Κέντρο Μάζας Ερμηνεία:
Αν z_a, z_b, z_c είναι σημεία μάζας, τότε e είναι το κέντρο μάζας με βάρη α, β, γ.

## VI. Κριτική (Critique)

Αριθμητική Λειτουργία του Συστήματος:
Δεδομένου του ensemble e, υπολογίζουμε ένα "σφάλμα" ή "διαφωνία".

Loss Function:
L: ℝ^{d_proj} × ℝ^{d_input} → ℝ

Ορισμός (παράδειγμα):
L(e, q) = ||Dec(e) - q||₂²

Όπου Dec: ℝ^{d_proj} → ℝ^{d_input} (decoder)

Ή εναλλακτικά:
L(e, q) = -log P(q | e) (maximum likelihood)

Gradient (Slope):
∇_e L = ∂L/∂e ∈ ℝ^{d_proj}

Μεγνητι Grad:
||∇_e L||₂ = √(Σᵢ (∂L/∂eᵢ)²)

Εμπιστοσύνη (Confidence):
conf := 1 - exp(-||∇_e L||₂²)

ή

conf := 1 - tanh(||∇_e L||₂)

Ερμηνεία:
- Αν ||∇_e L||₂ ≈ 0, τότε conf ≈ 0 (χαμηλή εμπιστοσύνη - καμία διαφωνία)
- Αν ||∇_e L||₂ ≫ 0, τότε conf ≈ 1 (υψηλή εμπιστοσύνη - μεγάλη διαφωνία)

Διόρθωση (Correction Signal):
δ = -∇_e L ∈ ℝ^{d_proj}

(Αρνητικό gradient - κατεύθυνση μείωσης απώλειας)

## VII. Δειγματοληψία (Sampling)

Επεξεργασία Εξόδου:
e ∈ ℝ^{d_proj} → logits ∈ ℝ^V

Όπου V = vocabulary size (π.χ., 50000)

Γραμμική Πρόβλεψη:
logits = W_out · e + b_out

Όπου:
- W_out ∈ ℝ^{V × d_proj} (output projection)
- b_out ∈ ℝ^V (output bias)

Κανονικοποίηση Θερμοκρασία (Temperature Scaling):
p_raw = softmax(logits / τ)

τ ∈ (0, 1] (temperature hyperparameter)
- τ → 0: p_raw → one-hot (κρύο, αιτιοκρατικό)
- τ → ∞: p_raw → uniform (ζεστό, τυχαίο)

Δειγματοληψία με Όριο (Threshold Sampling):
p = p_raw (κανονικοποιημένη κατανομή)

y = argmax(p) αν max(p) > θ_threshold

y ~ Categorical(p) αλλιώς (sampling)

Όπου θ_threshold ∈ [0, 1] (confidence threshold)

Ερμηνεία:
- Αν είμαστε "σίγουροι" (υψηλή πιθανότητα), παίρνουμε το best guess.
- Αν είμαστε "αβέβαιοι" (χαμηλή πιθανότητα), δειγματοληπτούμε τυχαία.

Ενδεχόμενη Εναλλακτική - Top-k Sampling:
1. Ταξινομήστε το p σε φθίνουσα σειρά
2. Κρατήστε τα κορυφαία k ενδεχόμενα
3. Κανονικοποιήστε το υπό όρου κατανομή
4. Δείγμα από τη σκευασμένη κατανομή

## VIII. Ροή Πληροφοριών - Διαγραμματική Αναπαράσταση

```
q ∈ ℝ^{d_input}
    |
    | Enc
    ↓
z ∈ ℝ^{d_latent}
    |
    +-----→ P_a ─→ z_a
    |
    +-----→ P_b ─→ z_b
    |
    +-----→ P_c ─→ z_c
    |
    | (z_a, z_b, z_c)
    |
    | f(q) → logits → softmax
    | (α, β, γ)
    |
    ↓ Ens
e ∈ ℝ^{d_proj}
    |
    | L(e, q)
    |
    ↓ Crit
    |
    ├─→ ∇_e L → δ (correction)
    |
    ├─→ ||∇_e L||₂ → conf (confidence)
    |
    | Dec(e) (reconstruction)
    |
    ↓ W_out
logits ∈ ℝ^V
    |
    | softmax(·/τ)
    |
    ↓ Sample
y ∈ {1, ..., V}
```

## IX. Ολοκληρωμένες Εξισώσεις

Encoding:
z = σ_enc(W_enc q + b_enc)

Projection:
z_i = σ_proj(W_i z + b_i), i ∈ {a, b, c}

Weighting:
w = softmax(W_w q + b_w)

Ensemble:
e = z_a w_a + z_b w_b + z_c w_c

Criticism:
δ = -∇_e L(e, q)
conf = confidence_fn(||δ||₂)

Output Logits:
ℓ = W_out e + b_out

Probability:
p = softmax(ℓ / τ)

Sampling:
y = { argmax(p)         if max(p) > θ
    { Sample(p)         otherwise

## X. Backpropagation - Full Computational Graph

Forward Pass Summary:
1. q → z: enc_output = σ(W_enc q + b_enc)
2. z → (z_a, z_b, z_c): proj_a,b,c = σ(W_{a,b,c} z + b_{a,b,c})
3. q → w: logits_w = W_w q + b_w, w = softmax(logits_w)
4. (z_a, z_b, z_c, w) → e: e = Σᵢ wᵢ z_i
5. (e, q) → L: L = loss_fn(e, q)

Backward Pass:
∂L/∂w = ?
∂L/∂z_i = ?
∂L/∂z = ?
∂L/∂W_enc, ∂L/∂b_enc = ?
∂L/∂W_w, ∂L/∂b_w = ?
κ.λ.π.

Chain Rule Application:
∂L/∂e = ∂L/∂L · 1 = ∂L/∂e (εξ'ορισμού)

∂L/∂w = (∂L/∂e)^T (∂e/∂w) = (∂L/∂e)^T [z_a | z_b | z_c]^T

∂L/∂z_i = (∂L/∂e) · w_i^T (if z_i ∈ ℝ^{d_proj})

∂L/∂z = Σᵢ (∂L/∂z_i) (∂z_i/∂z)

Ν.Β. Τα ∂z_i/∂z εξαρτώνται από τα W_{a,b,c}, σ' (derivative), κ.λ.

## XI. Αριθμητική Σταθερότητα

Forward Stability:
- Normalize inputs: q' = q / ||q||₂
- Clip activations: σ(x) = clip(σ(x), -C, C) για μερικές C

Backward Stability:
- Gradient clipping: ∇ ← ∇ / max(1, ||∇|| / G), G = gradient_max_norm
- Numerical precision: χρησιμοποιήστε float32 ή float64, όχι float16 (για αριθμητικά σφάλματα)

## XII. Χρονική Πολυπλοκότητα

Forward Pass:
- Enc: O(d_input · d_latent)
- Proj (×3): O(3 · d_latent · d_proj)
- Weight: O(d_input)
- Ens: O(d_proj)
- Crit: O(d_proj · d_input) (για reconstruction)
- Sample: O(V · log V) (για softmax + sampling)

Σύνολο: O(d_input · d_latent + d_input · d_proj + V · log V)

Backward Pass:
- ∼ 2× forward (συνήθως)

Memory:
- Activations: O(d_input + d_latent + 3·d_proj)
- Parameters: O(d_input·d_latent + 3·d_latent·d_proj + 3·d_input + V·d_proj)

## XIII. Παραλλαγές Αρχιτεκτονικής

Παραλλαγή 1: N-way Ensemble
Αντί 3 κατευθύνσεων, χρησιμοποιήστε N:

e = Σᵢ₌₁^N wᵢ zᵢ, w ∈ Δ^{N-1}

Softmax σε ℝ^N αντί ℝ³

Παραλλαγή 2: Attention-Weighted Projection
w_{ij} = softmax(⟨q, P_i(z_j)⟩)
e = Σᵢⱼ w_{ij} P_i(z_j)

(Cross-attention mechanism)

Παραλλαγή 3: Hierarchical Ensemble
- Level 1: 3-way ensemble (a, b, c)
- Level 2: Meta-ensemble της Level 1 outputs

e_final = α e_{abc} + β e_xyz + γ e_pqr

---

Αυτό το έγγραφο κάνει ξεκάθαρο ότι κάθε υπολογισμό δεν είναι παρά μια σειρά γραμμικών και μη-γραμμικών μετασχηματισμών. Δεν υπάρχουν "εντολές" ή "λογική ροή". Υπάρχουν μόνο διανύσματα, πίνακες και μαθηματικές πράξεις.
