(* MindLang Standard Library - Core Module
   Core mathematical and utility functions for reasoning

   Contains: Vector operations, matrix operations, activation functions,
   distribution sampling, and Korean output formatting utilities
*)

(* Vector Operations *)

(* vector_add: Add two vectors element-wise
   Args: v1 (Vector), v2 (Vector)
   Returns: Vector (sum of v1 and v2)

   Example:
   v1 = [1.0, 2.0, 3.0]
   v2 = [4.0, 5.0, 6.0]
   vector_add v1 v2 -> [5.0, 7.0, 9.0]
*)
fn vector_add(v1: Vector, v2: Vector) -> Vector {
  if length(v1) != length(v2) {
    error("Vector dimensions must match")
  }
  map(fn(i) { v1[i] + v2[i] }, range(length(v1)))
}

(* vector_subtract: Subtract v2 from v1 element-wise
   Args: v1 (Vector), v2 (Vector)
   Returns: Vector (v1 - v2)

   Example:
   v1 = [5.0, 7.0, 9.0]
   v2 = [1.0, 2.0, 3.0]
   vector_subtract v1 v2 -> [4.0, 5.0, 6.0]
*)
fn vector_subtract(v1: Vector, v2: Vector) -> Vector {
  if length(v1) != length(v2) {
    error("Vector dimensions must match")
  }
  map(fn(i) { v1[i] - v2[i] }, range(length(v1)))
}

(* vector_dot: Compute dot product of two vectors
   Args: v1 (Vector), v2 (Vector)
   Returns: Float (dot product)

   Example:
   v1 = [1.0, 2.0, 3.0]
   v2 = [4.0, 5.0, 6.0]
   vector_dot v1 v2 -> 32.0  (1*4 + 2*5 + 3*6)
*)
fn vector_dot(v1: Vector, v2: Vector) -> Float {
  if length(v1) != length(v2) {
    error("Vector dimensions must match")
  }
  reduce(
    fn(acc, i) { acc + (v1[i] * v2[i]) },
    0.0,
    range(length(v1))
  )
}

(* vector_norm: Compute L2 norm (Euclidean norm) of a vector
   Args: v (Vector)
   Returns: Float (norm value)

   Example:
   v = [3.0, 4.0]
   vector_norm v -> 5.0  (sqrt(3^2 + 4^2))
*)
fn vector_norm(v: Vector) -> Float {
  let sum_sq = reduce(
    fn(acc, i) { acc + (v[i] * v[i]) },
    0.0,
    range(length(v))
  )
  sqrt(sum_sq)
}

(* vector_normalize: Normalize vector to unit length
   Args: v (Vector)
   Returns: Vector (normalized vector)

   Example:
   v = [3.0, 4.0]
   vector_normalize v -> [0.6, 0.8]
*)
fn vector_normalize(v: Vector) -> Vector {
  let norm = vector_norm(v)
  if norm == 0.0 {
    error("Cannot normalize zero vector")
  }
  map(fn(i) { v[i] / norm }, range(length(v)))
}

(* vector_scale: Multiply vector by scalar
   Args: v (Vector), scalar (Float)
   Returns: Vector (scaled vector)

   Example:
   v = [1.0, 2.0, 3.0]
   vector_scale v 2.0 -> [2.0, 4.0, 6.0]
*)
fn vector_scale(v: Vector, scalar: Float) -> Vector {
  map(fn(i) { v[i] * scalar }, range(length(v)))
}

(* Matrix Operations *)

(* matrix_multiply: Multiply two matrices
   Args: m1 (Matrix[rows1][cols1]), m2 (Matrix[rows2][cols2])
   Constraint: cols1 must equal rows2
   Returns: Matrix[rows1][cols2]

   Example:
   m1 = [[1, 2], [3, 4]]  // 2x2
   m2 = [[5, 6], [7, 8]]  // 2x2
   matrix_multiply m1 m2 -> [[19, 22], [43, 50]]
*)
fn matrix_multiply(m1: Matrix, m2: Matrix) -> Matrix {
  let rows1 = length(m1)
  let cols1 = length(m1[0])
  let rows2 = length(m2)
  let cols2 = length(m2[0])

  if cols1 != rows2 {
    error("Incompatible matrix dimensions for multiplication")
  }

  let result = []
  for i in range(rows1) {
    let row = []
    for j in range(cols2) {
      let sum = 0.0
      for k in range(cols1) {
        sum = sum + (m1[i][k] * m2[k][j])
      }
      row = append(row, sum)
    }
    result = append(result, row)
  }
  result
}

(* matrix_transpose: Transpose a matrix
   Args: m (Matrix)
   Returns: Matrix (transposed)

   Example:
   m = [[1, 2, 3], [4, 5, 6]]  // 2x3
   matrix_transpose m -> [[1, 4], [2, 5], [3, 6]]  // 3x2
*)
fn matrix_transpose(m: Matrix) -> Matrix {
  let rows = length(m)
  let cols = length(m[0])
  let result = []

  for j in range(cols) {
    let col = []
    for i in range(rows) {
      col = append(col, m[i][j])
    }
    result = append(result, col)
  }
  result
}

(* Activation Functions *)

(* relu: Rectified Linear Unit activation
   Args: x (Float)
   Returns: Float (max(0, x))

   Example:
   relu(-1.0) -> 0.0
   relu(2.0) -> 2.0
*)
fn relu(x: Float) -> Float {
  if x > 0.0 { x } else { 0.0 }
}

(* relu_vector: Apply ReLU to each element
   Args: v (Vector)
   Returns: Vector

   Example:
   relu_vector [-1.0, 2.0, -3.0, 4.0] -> [0.0, 2.0, 0.0, 4.0]
*)
fn relu_vector(v: Vector) -> Vector {
  map(fn(i) { relu(v[i]) }, range(length(v)))
}

(* sigmoid: Sigmoid activation function
   Args: x (Float)
   Returns: Float (1 / (1 + exp(-x)))

   Example:
   sigmoid(0.0) -> 0.5
   sigmoid(10.0) ≈ 0.99995
*)
fn sigmoid(x: Float) -> Float {
  1.0 / (1.0 + exp(-x))
}

(* sigmoid_vector: Apply sigmoid to each element
   Args: v (Vector)
   Returns: Vector

   Example:
   sigmoid_vector [0.0, 1.0] -> [0.5, 0.731...]
*)
fn sigmoid_vector(v: Vector) -> Vector {
  map(fn(i) { sigmoid(v[i]) }, range(length(v)))
}

(* softmax: Softmax normalization
   Args: v (Vector)
   Returns: Vector (probability distribution)

   Example:
   softmax [1.0, 2.0, 3.0] -> [0.09003057, 0.24472146, 0.66524797]
*)
fn softmax(v: Vector) -> Vector {
  let max_val = max(v)
  let shifted = map(fn(i) { exp(v[i] - max_val) }, range(length(v)))
  let sum = reduce(fn(acc, i) { acc + shifted[i] }, 0.0, range(length(v)))
  map(fn(i) { shifted[i] / sum }, range(length(v)))
}

(* tanh: Hyperbolic tangent activation
   Args: x (Float)
   Returns: Float

   Example:
   tanh(0.0) -> 0.0
   tanh(1.0) ≈ 0.7616
*)
fn tanh(x: Float) -> Float {
  let exp_pos = exp(x)
  let exp_neg = exp(-x)
  (exp_pos - exp_neg) / (exp_pos + exp_neg)
}

(* tanh_vector: Apply tanh to each element
   Args: v (Vector)
   Returns: Vector
*)
fn tanh_vector(v: Vector) -> Vector {
  map(fn(i) { tanh(v[i]) }, range(length(v)))
}

(* Distribution Utilities *)

(* sample_from_distribution: Sample from probability distribution
   Args: dist (Vector - probability distribution), seed (Int)
   Returns: Int (sampled index)

   Example:
   dist = [0.1, 0.3, 0.6]
   sample_from_distribution dist 42 -> 2  (likely)
*)
fn sample_from_distribution(dist: Vector, seed: Int) -> Int {
  let r = random(seed)  // Returns value in [0, 1)
  let cumsum = 0.0
  let idx = 0

  for i in range(length(dist)) {
    cumsum = cumsum + dist[i]
    if r < cumsum {
      idx = i
      break
    }
  }
  idx
}

(* gumbel_softmax: Gumbel-Softmax sampling for differentiable sampling
   Args: logits (Vector), temperature (Float), seed (Int)
   Returns: Vector (soft samples)

   Example:
   logits = [1.0, 2.0, 3.0]
   gumbel_softmax logits 0.5 42 -> [0.01, 0.05, 0.94]
*)
fn gumbel_softmax(logits: Vector, temperature: Float, seed: Int) -> Vector {
  let eps = 1e-20
  let gumbel_noise = map(
    fn(i) { -log(-log(random(seed + i) + eps) + eps) },
    range(length(logits))
  )
  let noisy_logits = vector_add(logits, gumbel_noise)
  softmax(vector_scale(noisy_logits, 1.0 / temperature))
}

(* Korean Output Formatting *)

(* format_korean_output: Format output with Korean locale
   Args: text (String)
   Returns: String (formatted output)

   Example:
   format_korean_output "Hello" -> "[MindLang] Hello"
*)
fn format_korean_output(text: String) -> String {
  "[한글출력] " + text
}

(* format_korean_number: Format number in Korean style
   Args: n (Float)
   Returns: String

   Example:
   format_korean_number 1234.5 -> "1,234.5"
*)
fn format_korean_number(n: Float) -> String {
  let int_part = floor(n)
  let dec_part = n - int_part
  let int_str = format_with_separators(int_part)
  if dec_part == 0.0 {
    int_str
  } else {
    int_str + "." + format_decimal(dec_part)
  }
}

(* format_with_separators: Add thousand separators
   Args: n (Float)
   Returns: String
*)
fn format_with_separators(n: Float) -> String {
  to_string(n)  // Simplified - would use proper formatting in real impl
}

(* format_decimal: Format decimal part
   Args: dec (Float)
   Returns: String
*)
fn format_decimal(dec: Float) -> String {
  to_string(dec)
}

(* korean_header: Create a Korean formatted header
   Args: title (String)
   Returns: String

   Example:
   korean_header "결과" -> "=== 결과 ==="
*)
fn korean_header(title: String) -> String {
  "=== " + title + " ==="
}

(* Utility Functions *)

(* clamp: Clamp value between min and max
   Args: x (Float), min (Float), max (Float)
   Returns: Float

   Example:
   clamp 5.0 0.0 10.0 -> 5.0
   clamp 15.0 0.0 10.0 -> 10.0
*)
fn clamp(x: Float, min_val: Float, max_val: Float) -> Float {
  if x < min_val { min_val }
  else if x > max_val { max_val }
  else { x }
}

(* linear_interpolation: Linear interpolation between two values
   Args: a (Float), b (Float), t (Float) where t in [0, 1]
   Returns: Float (interpolated value)

   Example:
   linear_interpolation 0.0 10.0 0.5 -> 5.0
*)
fn linear_interpolation(a: Float, b: Float, t: Float) -> Float {
  a + (b - a) * t
}

(* entropy: Calculate entropy of probability distribution
   Args: dist (Vector)
   Returns: Float

   Example:
   entropy [0.5, 0.5] -> 0.693...  (log(2))
*)
fn entropy(dist: Vector) -> Float {
  reduce(
    fn(acc, i) {
      let p = dist[i]
      if p > 0.0 { acc - (p * log(p)) } else { acc }
    },
    0.0,
    range(length(dist))
  )
}

(* kl_divergence: Calculate KL divergence between two distributions
   Args: p (Vector), q (Vector)
   Returns: Float

   Example:
   p = [0.5, 0.5]
   q = [0.7, 0.3]
   kl_divergence p q -> 0.083...
*)
fn kl_divergence(p: Vector, q: Vector) -> Float {
  if length(p) != length(q) {
    error("Distribution dimensions must match")
  }
  reduce(
    fn(acc, i) {
      let p_i = p[i]
      if p_i > 0.0 { acc + (p_i * log(p_i / q[i])) } else { acc }
    },
    0.0,
    range(length(p))
  )
}

(* temperature_scale: Apply temperature scaling to logits
   Args: logits (Vector), temperature (Float)
   Returns: Vector

   Example:
   temperature_scale [1.0, 2.0, 3.0] 2.0 -> [0.5, 1.0, 1.5]
*)
fn temperature_scale(logits: Vector, temperature: Float) -> Vector {
  vector_scale(logits, 1.0 / temperature)
}

(* confidence_score: Calculate confidence score from distribution
   Args: dist (Vector)
   Returns: Float (0 to 1, where 1 is most confident)

   Example:
   confidence_score [0.9, 0.05, 0.05] -> 0.9
*)
fn confidence_score(dist: Vector) -> Float {
  max(dist)
}

(* average_vectors: Compute element-wise average of multiple vectors
   Args: vectors (Vector of Vectors)
   Returns: Vector (averaged result)

   Example:
   average_vectors [[1.0, 2.0], [3.0, 4.0]] -> [2.0, 3.0]
*)
fn average_vectors(vectors: Vector) -> Vector {
  if length(vectors) == 0 {
    error("Cannot average empty vector list")
  }
  let n = length(vectors)
  let dim = length(vectors[0])
  let sum = make_vector(dim, 0.0)

  for i in range(n) {
    sum = vector_add(sum, vectors[i])
  }
  vector_scale(sum, 1.0 / to_float(n))
}

(* Export all functions *)
export {
  vector_add, vector_subtract, vector_dot, vector_norm, vector_normalize,
  vector_scale, matrix_multiply, matrix_transpose, relu, relu_vector,
  sigmoid, sigmoid_vector, softmax, tanh, tanh_vector,
  sample_from_distribution, gumbel_softmax, format_korean_output,
  format_korean_number, korean_header, clamp, linear_interpolation,
  entropy, kl_divergence, temperature_scale, confidence_score,
  average_vectors
}
