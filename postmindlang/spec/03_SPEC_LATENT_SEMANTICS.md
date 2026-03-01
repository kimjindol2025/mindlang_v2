# Σ: ΛΑΝΘΑΝΟΥΣΑ ΣΗΜΑΣΙΟΛΟΓΙΑ

## I. Ορισμός του Σημασιολογικού Χώρου

Σ := Z = ℝ^d_latent, όπου d_latent ∈ [256, 2048]

Αξίωμα 1: Σημασιολογική Απόσταση
∀z₁, z₂ ∈ Z: "σημασιολογική ομοιότητα" := 1 - d_cos(z₁, z₂)

d_cos(z₁, z₂) := 1 - (⟨z₁, z₂⟩)/(||z₁||₂ · ||z₂||₂)

Προτεινόμενη αναφορά: Δ_sem(z₁, z₂) := ||z₁ - z₂||₂

Αξίωμα 2: Ομοιότητα ≡ Εγγύτητα
z₁ ≈_sem z₂ ⟺ Δ_sem(z₁, z₂) < ε_threshold

ε_threshold εξαρτάται από το σύστημα, συνήθως ε ∈ [0.1, 0.5].

Αξίωμα 3: Μετάβαση
Αν z₁ ≈_sem z₂ και z₂ ≈_sem z₃, τότε (πιθανώς) z₁ ≈_sem z₃
Δεν είναι αυστηρό transitivity, αλλά μαλακό (soft).

## II. Τοπολογία του Χώρου Σημασίας

Ανοικτή Σφαίρα:
B(z, r) := {z' ∈ Z | Δ_sem(z', z) < r}

Κλειστή Σφαίρα:
B̄(z, r) := {z' ∈ Z | Δ_sem(z', z) ≤ r}

Σφαίρα:
∂B(z, r) := {z' ∈ Z | Δ_sem(z', z) = r}

Τοπολογία ℝ^d_latent: τυπική ευκλείδεια τοπολογία
τ = {U ⊆ Z | ∀z ∈ U, ∃ε > 0: B(z, ε) ⊆ U}

Συνέχεια:
f: Z₁ → Z₂ συνεχής ⟺ ∀U ανοικτό σε Z₂: f^{-1}(U) ανοικτό σε Z₁

## III. Εννοιολογικές Περιοχές ως Υποσύνολα

Έννοια (Concept):
C ⊆ Z είναι έννοια αν:
1. C ≠ ∅
2. C είναι "συμπυκνωμένη" (δηλαδή μικρή διάμετρος)
3. diam(C) := sup_{z₁,z₂∈C} Δ_sem(z₁, z₂) < δ_concept

Δομή Εννοίας:
C = {z ∈ Z | dist(z, C_center) < r_C}

Όπου:
- C_center ∈ Z (κέντρο έννοιας, συνήθως μέσος όρος)
- r_C > 0 (ακτίνα έννοιας)

Prototype of Concept:
c := arg min_{z ∈ C} Σ_{z' ∈ C} ||z - z'||₂² (centroid)

Ή ταχύτερα:
c ≈ (1/|C|) Σ_{z ∈ C} z

Διάσταση Έννοιας:
dim(C) := dim(span{z - c | z ∈ C})

Compactness:
comp(C) := r_C / (2 · avg_{z ∈ C} ||z - c||₂)

## IV. Ιεραρχική Δομή Εννοιών

Έννοια Υψηλότερης Τάξης:
C_parent ⊇ C_child

Ορισμός: C_child ⊂ C_parent ⟺ "σημασιολογική γενίκευση"

Παράδειγμα (μόνο για διαίσθηση):
- C_entity (γενική έννοια)
  - C_animate (ζωντανό)
    - C_human (ανθρώπινο)
    - C_animal (ζώο)
  - C_inanimate (άνζωο)

Μαθηματικά:
∀C_child: ∃C_parent: C_child ⊂ C_parent (topologically)

Δεν υπάρχει "όνομα" ή "εδέσμευση". Μόνο σχέσεις μεταξύ συνόλων.

## V. Περιοχές Εννοιών ως Υποχώροι

Subspace Representation:
C ≈ span{v₁, v₂, ..., v_k} ∩ B(c, r_C)

Όπου {vᵢ} είναι ορθogonal basis, κύριες κατευθύνσεις της έννοιας.

Υπολογισμός με PCA:
1. Δεδομένα: D = {z₁, z₂, ..., z_m} ⊂ C
2. Κέντρο: μ = (1/m) Σᵢ zᵢ
3. Centered: X = [z₁ - μ | z₂ - μ | ... | z_m - μ] ∈ ℝ^{d×m}
4. Covariance: Σ_X = (1/m) XX^T ∈ ℝ^{d×d}
5. Eigendecomposition: Σ_X = VΛV^T
6. Basis: {v₁, v₂, ..., v_k} = πρώτα k ιδιοδιανύσματα του V

Projection στη Subspace:
P_C(z) := μ + Σᵢ₌₁^k ⟨z - μ, vᵢ⟩ vᵢ

Distortion:
dist(z, C) := ||z - P_C(z)||₂ = ||Σᵢ₌ₖ₊₁^d ⟨z - μ, vᵢ⟩ vᵢ||₂

## VI. Περιοχή Αναφοράς (Referential Field)

Αναφορικό Πλαίσιο:
ref(z) := {z' ∈ Z | ||z' - z||₂ < r_ref} = B(z, r_ref)

Γειτονιά Σημασίας:
N_sem(z) := {z' ∈ Z | Δ_sem(z', z) < δ}

Ιδιότητες:
- |N_sem(z)| ∝ V_d(δ) = (πδ²)^{d/2} / Γ(d/2 + 1) (όγκος d-ball)
- Γεωμετρική αύξηση με διάσταση

Manifold Hypothesis (για ερμηνεία):
Κάθε σημασιολογική κατηγορία κείται σε χαμηλοδιάστατη manifold:
C ≈ {φ(u) | u ∈ M ⊂ ℝ^{d_intrinsic}}, d_intrinsic ≪ d

## VII. Γραμμικές Μετασχηματισμοί ως Σημασιολογικές Πράξεις

Σημασιολογική Σύνδεση (Semantic Relation):
R: Z × Z → {0, 1} (binary relation)

Παράδειγμα δομής (ιδεατή):
R(z₁, z₂) = 1 ⟺ Δ_sem(z₁, z₂) < ε και έχουν κοινές ιδιότητες

Γραμμική Προσέγγιση:
R ≈ {(z₁, z₂) | ⟨w, z₁ - z₂⟩ > θ}

Όπου w ∈ Z, θ ∈ ℝ (ειδικός πίνακας και κατώφλι).

Σημασιολογική Πράξη (Semantic Operation):
op: Z^k → Z

Ορισμένη γραμμικά:
op(z₁, z₂, ..., z_k) ≈ A₁z₁ + A₂z₂ + ... + A_kz_k + b

Όπου Aᵢ ∈ ℝ^{d×d}, b ∈ Z

## VIII. Ανδρογενία (Context as Linear Map)

Πλαίσιο (Context):
κ ∈ Z = ℝ^d_latent

Πλαισιακή Ερμηνεία:
T_κ: Z → Z, T_κ(z) := Az + κ (affine map)

ή

T_κ(z) := e^{κ ⊗ I} z (exponential map)

Αποτέλεσμα: z κάτω από context κ γίνεται:
z|_κ := T_κ(z)

Αλλαγή Πλαισίου:
Αν κ₁ ≠ κ₂, τότε:
z|_{κ₁} ≠ z|_{κ₂} (σημασιολογική μετάβαση)

Περιγραφή Αλλαγής:
Δz := z|_{κ₁} - z|_{κ₂} ∝ κ₁ - κ₂ (κατευθυνόμενη μετατόπιση)

## IX. Διαδρομή Συμπερασμού (Inference Path)

Απόδειξη/Συμπέρασμα ως Γραμμή:
γ: [0, 1] → Z, γ(t) = (1-t)z_start + t·z_end

Διαφορικοποιημένη Διαδρομή:
dγ/dt = z_end - z_start

Μήκος Διαδρομής:
L(γ) := ∫₀¹ ||dγ/dt|| dt = ||z_end - z_start||₂

Συντομότερη Διαδρομή (Geodesic):
γ_min = arg min_γ L(γ) (στην ευκλείδεια γεωμετρία, είναι ευθεία γραμμή)

Πολύπλοκη Διαδρομή (Ενδιάμεσα Βήματα):
γ: [0, T] → Z, με ενδιάμεσα σημεία γ(tᵢ) που αντιπροσωπεύουν "σκέψεων στάδια"

Βήμα Συμπερασμού:
Δz_i := γ(tᵢ₊₁) - γ(tᵢ) = μια θέση ενημέρωσης

Σχέση με Gradient:
∇f(γ(tᵢ)) ∝ Δz_i (το βήμα αντανακλά διεύθυνση κλίσης)

## X. Προβολή και Ορθογωνικότητα

Ορθογώνια Προβολή σε Έννοια:
π_C(z) := P_C(z) = (όπως ορίστηκε στο τμήμα III)

Orthogonal Complement:
C^⊥ := {z ∈ Z | ∀z' ∈ C: ⟨z, z'⟩ = 0}

Ανάλυση:
z = π_C(z) + π_{C^⊥}(z)

Απόσταση από Έννοια:
d(z, C) := ||π_{C^⊥}(z)||₂

Ερμηνεία: πόσο "μακρύ" είναι το z από την έννοια C

## XI. Διακριτική Δομή (Separability)

Διαχώριση:
∃H := {w ∈ Z, b ∈ ℝ} τέτοιο ώστε:
- ∀z ∈ C₁: ⟨w, z⟩ + b > 0
- ∀z ∈ C₂: ⟨w, z⟩ + b < 0

Hyperplane:
H := {z ∈ Z | ⟨w, z⟩ + b = 0}

Χωρητικότητα Διαχώρισης (Margin):
margin := min(min_{z ∈ C₁} (⟨w, z⟩ + b)/||w||₂, min_{z ∈ C₂} (|⟨w, z⟩ + b|)/||w||₂)

Linear Inseparability:
Αν δεν υπάρχει τέτοιο H, τότε C₁ και C₂ δεν είναι γραμμικά διαχωρίσιμα.

Λύση: kernel trick (nonlinear separation στον αρχικό χώρο)

## XII. Δυναμική Εξέλιξη Σημασιών

Διαφορική Εξίσωση σε Χώρο Σημασίας:
dz/dt = F(z, t)

Όπου F: Z × ℝ → Z

Παράδειγμα 1 - Gradient Flow:
dz/dt = -∇L(z), L: Z → ℝ (απώλεια)

Ροή κάτω από loss landscape προς τοπικά ελάχιστα.

Παράδειγμα 2 - Stochastic Dynamics:
dz = F(z) dt + σ dW_t

Όπου W_t = Wiener process (Brownian motion)

Λύση: z(t) = Z_t (stochastic process)

Παράδειγμα 3 - Hamiltonian Dynamics:
dz/dt = ∇_p H(z, p)
dp/dt = -∇_z H(z, p)

H(z, p) = (1/2)||p||₂² + U(z) (kinetic + potential energy)

Διατήρηση: H(z(t), p(t)) = constant (energy conservation)

## XIII. Μέτρα Σημασιολογικής Απόστασης

Euclidean Distance:
d_L₂(z₁, z₂) := ||z₁ - z₂||₂ = √(Σᵢ(z₁ᵢ - z₂ᵢ)²)

Manhattan Distance:
d_L₁(z₁, z₂) := ||z₁ - z₂||₁ = Σᵢ|z₁ᵢ - z₂ᵢ|

Chebyshev Distance:
d_L∞(z₁, z₂) := ||z₁ - z₂||∞ = maxᵢ|z₁ᵢ - z₂ᵢ|

Cosine Similarity:
sim_cos(z₁, z₂) := ⟨z₁, z₂⟩/(||z₁||₂ · ||z₂||₂) ∈ [-1, 1]

Cosine Distance:
d_cos(z₁, z₂) := 1 - sim_cos(z₁, z₂) ∈ [0, 2]

Mahalanobis Distance:
d_M(z₁, z₂; Σ) := √((z₁ - z₂)^T Σ^{-1} (z₁ - z₂))

Όπου Σ = covariance matrix (σχέση-βαρή)

Wasserstein Distance (Optimal Transport):
W_p(P, Q) := (inf_{γ} ∫ ||z₁ - z₂||^p dγ(z₁, z₂))^{1/p}

P, Q = probability distributions σε Z

## XIV. Κατανομές στο Χώρο Σημασίας

Gaussian Distribution:
P(z) = N(z | μ, Σ) = (2π)^{-d/2} |Σ|^{-1/2} exp(-1/2 (z-μ)^T Σ^{-1} (z-μ))

Όπου μ = mean, Σ = covariance

Uniform Distribution:
P(z) = U(z | C) = 1/|C| αν z ∈ C, αλλιώς 0

Mixture of Gaussians:
P(z) = Σₖ πₖ N(z | μₖ, Σₖ), Σₖ πₖ = 1

Laplace Distribution:
P(z) = exp(-||z - μ||₁/b) / Z_norm

Κατανομή στη Σφαίρα (Uniform on Sphere):
P(z | ||z||₂ = r) = uniform σε ∂B(0, r)

## XV. Entanglement of Meanings

Πολλαπλή Σημασία:
z_ambiguous = α z_sense₁ + β z_sense₂, α + β = 1

Αποσύμπλεξη:
z_sense₁ = arg min_{z ∈ C₁} ||z - z_ambiguous||₂
z_sense₂ = arg min_{z ∈ C₂} ||z - z_ambiguous||₂

Βαθμός Σύμπλεξης (Entanglement):
E(z) := min(α, β) / max(α, β) ∈ [0, 1]

Αν E(z) ≈ 0, το z είναι μονοσήμαντο.
Αν E(z) ≈ 0.5, το z είναι υψηλά σύμπλεξη.

---

Αυτό το έγγραφο περιγράφει πώς η σημασιολογία κατοικεί στο χώρο λανθάνοντος ως καθαρή γεωμετρία και τοπολογία. Κάθε έννοια, σχέση, πλαίσιο και συμπέρασμα αναπαρίστανται ως σχέσεις μεταξύ διανυσμάτων, προβολών και μετασχηματισμών.
