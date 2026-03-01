/**
 * PostMindLang Runtime: Pure Tensor Operations
 * 순수 벡터/행렬/텐서 연산 모듈
 * 모든 연산은 선형대수(Linear Algebra) 기반
 */

export type Tensor = Float64Array; // ℝ^n
export type Matrix = Float64Array; // ℝ^(m×n) flattened
export type Tensor3D = Float64Array; // ℝ^(d1×d2×d3) flattened

/**
 * Tensor 메타데이터 - shape 정보 저장
 */
export interface TensorShape {
  dims: number[];
  size: number;
}

/**
 * 텐서 생성 및 기본 연산
 */
export class TensorOps {
  /**
   * 1D 텐서 생성
   */
  static zeros(n: number): Tensor {
    return new Float64Array(n);
  }

  /**
   * 1D 텐서를 임의의 값으로 생성
   */
  static fill(n: number, value: number): Tensor {
    const t = new Float64Array(n);
    t.fill(value);
    return t;
  }

  /**
   * 1D 텐서를 난수로 초기화 (Gaussian)
   */
  static randn(n: number, seed?: number): Tensor {
    const t = new Float64Array(n);
    const rng = seed !== undefined ? this.seededRandom(seed) : Math.random;
    for (let i = 0; i < n; i++) {
      // Box-Muller 변환: 균등분포 → 정규분포
      const u1 = rng();
      const u2 = rng();
      t[i] = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
    return t;
  }

  /**
   * 시드 기반 난수 생성기
   */
  private static seededRandom(seed: number) {
    return () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  /**
   * 행렬 생성 (m × n)
   */
  static matrix(m: number, n: number, init?: (i: number, j: number) => number): Matrix {
    const M = new Float64Array(m * n);
    if (init) {
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          M[i * n + j] = init(i, j);
        }
      }
    }
    return M;
  }

  /**
   * 단위 행렬 생성
   */
  static eye(n: number): Matrix {
    return this.matrix(n, n, (i, j) => (i === j ? 1 : 0));
  }

  /**
   * 내적 (dot product): <a, b> = Σ a_i * b_i
   */
  static dot(a: Tensor, b: Tensor): number {
    if (a.length !== b.length) {
      throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result += a[i] * b[i];
    }
    return result;
  }

  /**
   * L2 노름: ||a||_2 = √(Σ a_i²)
   */
  static l2_norm(a: Tensor): number {
    return Math.sqrt(this.dot(a, a));
  }

  /**
   * L1 노름: ||a||_1 = Σ |a_i|
   */
  static l1_norm(a: Tensor): number {
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result += Math.abs(a[i]);
    }
    return result;
  }

  /**
   * 최대 노름: ||a||_∞ = max |a_i|
   */
  static max_norm(a: Tensor): number {
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result = Math.max(result, Math.abs(a[i]));
    }
    return result;
  }

  /**
   * 벡터 덧셈: c = a + b
   */
  static add(a: Tensor, b: Tensor): Tensor {
    if (a.length !== b.length) {
      throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
    }
    const c = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      c[i] = a[i] + b[i];
    }
    return c;
  }

  /**
   * 벡터 뺄셈: c = a - b
   */
  static subtract(a: Tensor, b: Tensor): Tensor {
    if (a.length !== b.length) {
      throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
    }
    const c = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      c[i] = a[i] - b[i];
    }
    return c;
  }

  /**
   * 스칼라 곱셈: b = α * a
   */
  static scale(a: Tensor, alpha: number): Tensor {
    const b = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      b[i] = a[i] * alpha;
    }
    return b;
  }

  /**
   * 원소별 곱셈 (Hadamard product): c = a ⊙ b
   */
  static elementwise_mult(a: Tensor, b: Tensor): Tensor {
    if (a.length !== b.length) {
      throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
    }
    const c = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      c[i] = a[i] * b[i];
    }
    return c;
  }

  /**
   * 원소별 나눗셈: c = a ÷ b (element-wise)
   */
  static elementwise_div(a: Tensor, b: Tensor): Tensor {
    if (a.length !== b.length) {
      throw new Error(`Dimension mismatch: ${a.length} vs ${b.length}`);
    }
    const c = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      c[i] = a[i] / b[i];
    }
    return c;
  }

  /**
   * 외적 (outer product): C = a ⊗ b, C ∈ ℝ^(m×n)
   * flattened: C[i*n + j] = a[i] * b[j]
   */
  static outer(a: Tensor, b: Tensor): Matrix {
    const m = a.length;
    const n = b.length;
    const C = new Float64Array(m * n);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        C[i * n + j] = a[i] * b[j];
      }
    }
    return C;
  }

  /**
   * 행렬-벡터 곱셈: b = A @ v
   * A: m×n (flattened), v: n×1, result: m×1
   */
  static matvec(A: Matrix, v: Tensor, m: number, n: number): Tensor {
    if (v.length !== n) {
      throw new Error(`Dimension mismatch: vector length ${v.length} vs matrix width ${n}`);
    }
    const b = new Float64Array(m);
    for (let i = 0; i < m; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += A[i * n + j] * v[j];
      }
      b[i] = sum;
    }
    return b;
  }

  /**
   * 행렬-행렬 곱셈: C = A @ B
   * A: m×k, B: k×n, C: m×n
   */
  static matmul(
    A: Matrix,
    B: Matrix,
    m: number,
    k: number,
    n: number
  ): Matrix {
    const C = new Float64Array(m * n);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let p = 0; p < k; p++) {
          sum += A[i * k + p] * B[p * n + j];
        }
        C[i * n + j] = sum;
      }
    }
    return C;
  }

  /**
   * 전치 (transpose): B = A^T
   * A: m×n → B: n×m
   */
  static transpose(A: Matrix, m: number, n: number): Matrix {
    const B = new Float64Array(n * m);
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < n; j++) {
        B[j * m + i] = A[i * n + j];
      }
    }
    return B;
  }

  /**
   * 배치 행렬-벡터 곱셈: V = Q @ A (각 행과 A의 곱)
   * Q: batch_size × k (각 행이 벡터)
   * A: k × n
   * V: batch_size × n
   */
  static matmul_batch(
    Q: Matrix,
    A: Matrix,
    batch_size: number,
    k: number,
    n: number
  ): Matrix {
    const V = new Float64Array(batch_size * n);
    for (let b = 0; b < batch_size; b++) {
      for (let j = 0; j < n; j++) {
        let sum = 0;
        for (let p = 0; p < k; p++) {
          sum += Q[b * k + p] * A[p * n + j];
        }
        V[b * n + j] = sum;
      }
    }
    return V;
  }

  /**
   * ReLU 활성화: y = max(0, x)
   */
  static relu(x: Tensor): Tensor {
    const y = new Float64Array(x.length);
    for (let i = 0; i < x.length; i++) {
      y[i] = Math.max(0, x[i]);
    }
    return y;
  }

  /**
   * ReLU 그래디언트: ∂L/∂x = ∂L/∂y * (x > 0 ? 1 : 0)
   */
  static grad_relu(grad_y: Tensor, x: Tensor): Tensor {
    const grad_x = new Float64Array(x.length);
    for (let i = 0; i < x.length; i++) {
      grad_x[i] = x[i] > 0 ? grad_y[i] : 0;
    }
    return grad_x;
  }

  /**
   * Sigmoid 활성화: y = 1 / (1 + exp(-x))
   */
  static sigmoid(x: Tensor): Tensor {
    const y = new Float64Array(x.length);
    for (let i = 0; i < x.length; i++) {
      y[i] = 1 / (1 + Math.exp(-x[i]));
    }
    return y;
  }

  /**
   * Sigmoid 그래디언트: ∂L/∂x = ∂L/∂y * y * (1 - y)
   */
  static grad_sigmoid(grad_y: Tensor, y: Tensor): Tensor {
    const grad_x = new Float64Array(y.length);
    for (let i = 0; i < y.length; i++) {
      grad_x[i] = grad_y[i] * y[i] * (1 - y[i]);
    }
    return grad_x;
  }

  /**
   * Softmax 활성화: y_i = exp(x_i / τ) / Σ exp(x_j / τ)
   */
  static softmax(x: Tensor, tau: number = 1.0): Tensor {
    // 수치 안정성을 위해 최댓값 빼기
    let max_x = x[0];
    for (let i = 1; i < x.length; i++) {
      max_x = Math.max(max_x, x[i]);
    }

    const y = new Float64Array(x.length);
    let sum = 0;
    for (let i = 0; i < x.length; i++) {
      const exp_val = Math.exp((x[i] - max_x) / tau);
      y[i] = exp_val;
      sum += exp_val;
    }

    for (let i = 0; i < y.length; i++) {
      y[i] /= sum;
    }
    return y;
  }

  /**
   * Softmax 그래디언트: ∂L/∂x_i = ∂L/∂y_i * (y_i - y_i * Σ y_j * ∂L/∂y_j)
   */
  static grad_softmax(grad_y: Tensor, y: Tensor): Tensor {
    const grad_x = new Float64Array(y.length);
    let sum = 0;
    for (let i = 0; i < y.length; i++) {
      sum += grad_y[i] * y[i];
    }
    for (let i = 0; i < y.length; i++) {
      grad_x[i] = y[i] * (grad_y[i] - sum);
    }
    return grad_x;
  }

  /**
   * 텐서 축약 (Tensor Contraction)
   * 두 텐서의 지정된 인덱스에 대해 내적 수행
   */
  static contract(
    t1: Tensor,
    t2: Tensor,
    shape1: number[],
    shape2: number[],
    indices1: number[],
    indices2: number[]
  ): Tensor {
    // 간단한 구현: 1D와 2D만 지원
    if (shape1.length === 1 && shape2.length === 1) {
      // 두 벡터의 내적
      return this.fill(1, this.dot(t1, t2));
    }
    throw new Error("Complex tensor contraction not yet implemented");
  }

  /**
   * 최댓값 원소
   */
  static max(a: Tensor): number {
    let max_val = a[0];
    for (let i = 1; i < a.length; i++) {
      max_val = Math.max(max_val, a[i]);
    }
    return max_val;
  }

  /**
   * 최댓값 인덱스
   */
  static argmax(a: Tensor): number {
    let max_idx = 0;
    let max_val = a[0];
    for (let i = 1; i < a.length; i++) {
      if (a[i] > max_val) {
        max_val = a[i];
        max_idx = i;
      }
    }
    return max_idx;
  }

  /**
   * 합계
   */
  static sum(a: Tensor): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += a[i];
    }
    return sum;
  }

  /**
   * 평균
   */
  static mean(a: Tensor): number {
    return this.sum(a) / a.length;
  }

  /**
   * 표준편차
   */
  static std(a: Tensor): number {
    const m = this.mean(a);
    let sum_sq = 0;
    for (let i = 0; i < a.length; i++) {
      sum_sq += (a[i] - m) * (a[i] - m);
    }
    return Math.sqrt(sum_sq / a.length);
  }

  /**
   * 정규화 (normalization): x_norm = (x - mean) / std
   */
  static normalize(a: Tensor): Tensor {
    const mean = this.mean(a);
    const std = this.std(a);
    const b = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      b[i] = (a[i] - mean) / (std + 1e-8);
    }
    return b;
  }

  /**
   * Exp 함수 (element-wise)
   */
  static exp(x: Tensor): Tensor {
    const y = new Float64Array(x.length);
    for (let i = 0; i < x.length; i++) {
      y[i] = Math.exp(x[i]);
    }
    return y;
  }

  /**
   * Log 함수 (element-wise)
   */
  static log(x: Tensor): Tensor {
    const y = new Float64Array(x.length);
    for (let i = 0; i < x.length; i++) {
      y[i] = Math.log(x[i]);
    }
    return y;
  }

  /**
   * 절댓값 (element-wise)
   */
  static abs(x: Tensor): Tensor {
    const y = new Float64Array(x.length);
    for (let i = 0; i < x.length; i++) {
      y[i] = Math.abs(x[i]);
    }
    return y;
  }

  /**
   * 복사
   */
  static copy(a: Tensor): Tensor {
    return new Float64Array(a);
  }

  /**
   * 클리핑: clamp(x, min, max)
   */
  static clip(a: Tensor, min: number, max: number): Tensor {
    const b = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      b[i] = Math.max(min, Math.min(max, a[i]));
    }
    return b;
  }

  /**
   * 텐서 덤프 (디버깅용)
   */
  static dump(a: Tensor, name: string = "Tensor", limit: number = 10): string {
    const vals = Array.from(a.slice(0, limit)).map((v) => v.toFixed(4));
    const suffix = a.length > limit ? `... (${a.length} total)` : "";
    return `${name}: [${vals.join(", ")}]${suffix}`;
  }

  /**
   * 기울기 검사 (numerical gradient verification)
   */
  static checkGradient(
    fn: (x: Tensor) => number,
    grad_fn: (x: Tensor) => Tensor,
    x: Tensor,
    eps: number = 1e-5
  ): number {
    const grad_analytical = grad_fn(x);
    let max_diff = 0;

    for (let i = 0; i < x.length; i++) {
      const x_plus = this.copy(x);
      const x_minus = this.copy(x);
      x_plus[i] += eps;
      x_minus[i] -= eps;

      const grad_numerical =
        (fn(x_plus) - fn(x_minus)) / (2 * eps);
      const diff = Math.abs(grad_analytical[i] - grad_numerical);
      max_diff = Math.max(max_diff, diff);
    }

    return max_diff;
  }
}

/**
 * 다중선형 연산 (Multilinear Operations)
 */
export class MultilinearOps {
  /**
   * 다선형 형태 (bilinear form): L(x, y) = x^T @ A @ y
   */
  static bilinear_form(x: Tensor, A: Matrix, y: Tensor, n: number, m: number): number {
    // 먼저 A @ y 계산
    const Ay = TensorOps.matvec(A, y, n, m);
    // 그 다음 x^T @ (A @ y) 계산
    return TensorOps.dot(x, Ay);
  }

  /**
   * 다선형 형태의 그래디언트 w.r.t. x: ∂L/∂x = A @ y
   */
  static grad_bilinear_x(A: Matrix, y: Tensor, n: number, m: number): Tensor {
    return TensorOps.matvec(A, y, n, m);
  }

  /**
   * 다선형 형태의 그래디언트 w.r.t. y: ∂L/∂y = A^T @ x
   */
  static grad_bilinear_y(
    A: Matrix,
    x: Tensor,
    n: number,
    m: number
  ): Tensor {
    const AT = TensorOps.transpose(A, n, m);
    return TensorOps.matvec(AT, x, m, n);
  }
}
