/**
 * PostMindLang Runtime: Query Encoding
 * 쿼리 인코딩 모듈: E: ℝ^768 → ℝ^512
 */

import { Tensor, Matrix, TensorOps } from "./tensor";

/**
 * 쿼리 인코더
 * 선형 변환 + 편향: z = W^T @ q + b
 */
export class QueryEncoder {
  /**
   * 가중치 행렬: W ∈ ℝ^(768×512)
   * 저장: flattened (768 * 512 = 393216 elements)
   */
  W: Matrix;

  /**
   * 편향: b ∈ ℝ^512
   */
  b: Tensor;

  /**
   * 입력 차원
   */
  input_dim: number;

  /**
   * 출력 차원
   */
  output_dim: number;

  constructor(input_dim: number = 768, output_dim: number = 512) {
    this.input_dim = input_dim;
    this.output_dim = output_dim;

    // He 초기화: W ~ N(0, sqrt(2/input_dim))
    const scale = Math.sqrt(2.0 / input_dim);
    this.W = TensorOps.randn(input_dim * output_dim);
    for (let i = 0; i < this.W.length; i++) {
      this.W[i] *= scale;
    }

    // 편향 초기화: b = 0
    this.b = TensorOps.zeros(output_dim);
  }

  /**
   * 단일 쿼리 인코딩: z = W^T @ q + b
   * q ∈ ℝ^768 → z ∈ ℝ^512
   */
  encode(q: Tensor): Tensor {
    if (q.length !== this.input_dim) {
      throw new Error(
        `Query dimension mismatch: ${q.length} vs ${this.input_dim}`
      );
    }

    // 1. W^T @ q: (768×512)^T @ 768 = 512×768 @ 768 = 512
    const WT = TensorOps.transpose(this.W, this.input_dim, this.output_dim);
    const z_linear = TensorOps.matvec(WT, q, this.output_dim, this.input_dim);

    // 2. z = z_linear + b
    const z = TensorOps.add(z_linear, this.b);
    return z;
  }

  /**
   * 배치 쿼리 인코딩: Z = Q @ W + b (vectorized)
   * Q ∈ ℝ^(batch_size×768) → Z ∈ ℝ^(batch_size×512)
   */
  encode_batch(Q: Matrix, batch_size: number): Matrix {
    if (Q.length !== batch_size * this.input_dim) {
      throw new Error(
        `Batch query dimension mismatch: ${Q.length} vs ${
          batch_size * this.input_dim
        }`
      );
    }

    // Z = Q @ W (batch_size × 768) @ (768 × 512) = batch_size × 512
    const Z = TensorOps.matmul_batch(
      Q,
      this.W,
      batch_size,
      this.input_dim,
      this.output_dim
    );

    // Z += b (broadcasting: 더하기)
    for (let b = 0; b < batch_size; b++) {
      for (let j = 0; j < this.output_dim; j++) {
        Z[b * this.output_dim + j] += this.b[j];
      }
    }

    return Z;
  }

  /**
   * 전체 그래디언트 계산
   * ∂L/∂W, ∂L/∂b, ∂L/∂q 계산
   */
  gradient(
    grad_z: Tensor,
    q: Tensor
  ): { dW: Matrix; db: Tensor; dq: Tensor } {
    if (grad_z.length !== this.output_dim) {
      throw new Error(
        `Gradient dimension mismatch: ${grad_z.length} vs ${this.output_dim}`
      );
    }

    // 1. ∂L/∂b = grad_z (직접 전파)
    const db = TensorOps.copy(grad_z);

    // 2. ∂L/∂q = W @ grad_z (chain rule)
    // q ← W @ grad_z인데, W: 768×512, grad_z: 512
    // 따라서 ∂L/∂q = W @ grad_z (768)
    const dq = TensorOps.matvec(
      this.W,
      grad_z,
      this.input_dim,
      this.output_dim
    );

    // 3. ∂L/∂W = q ⊗ grad_z (외적)
    // z_i = Σ_j W_ji * q_j + b_i
    // ∂L/∂W_ji = ∂L/∂z_i * ∂z_i/∂W_ji = grad_z_i * q_j
    // flattened: W[i*output_dim + j], gradient: outer(q, grad_z)
    const dW = TensorOps.outer(q, grad_z);

    return { dW, db, dq };
  }

  /**
   * 배치 그래디언트 계산
   */
  gradient_batch(
    grad_Z: Matrix,
    Q: Matrix,
    batch_size: number
  ): { dW: Matrix; db: Tensor; dQ: Matrix } {
    if (grad_Z.length !== batch_size * this.output_dim) {
      throw new Error(`Batch gradient dimension mismatch`);
    }

    // 1. ∂L/∂b = Σ_batch grad_z_b (합계)
    const db = TensorOps.zeros(this.output_dim);
    for (let b = 0; b < batch_size; b++) {
      for (let j = 0; j < this.output_dim; j++) {
        db[j] += grad_Z[b * this.output_dim + j];
      }
    }

    // 2. ∂L/∂Q = grad_Z @ W^T
    const WT = TensorOps.transpose(this.W, this.input_dim, this.output_dim);
    const dQ = TensorOps.matmul_batch(
      grad_Z,
      WT,
      batch_size,
      this.output_dim,
      this.input_dim
    );

    // 3. ∂L/∂W = Q^T @ grad_Z
    // Q: batch × 768, grad_Z: batch × 512
    // 각 배치 b에서: dW_b = Q_b ⊗ grad_Z_b
    // 전체: dW = Σ Q_b ⊗ grad_Z_b
    const dW = TensorOps.zeros(this.input_dim * this.output_dim);
    for (let b = 0; b < batch_size; b++) {
      const q_b_start = b * this.input_dim;
      const grad_z_b_start = b * this.output_dim;

      for (let i = 0; i < this.input_dim; i++) {
        for (let j = 0; j < this.output_dim; j++) {
          dW[i * this.output_dim + j] +=
            Q[q_b_start + i] * grad_Z[grad_z_b_start + j];
        }
      }
    }

    return { dW, db, dQ };
  }

  /**
   * 가중치 업데이트 (SGD)
   */
  update(dW: Matrix, db: Tensor, learning_rate: number): void {
    // W := W - lr * dW
    for (let i = 0; i < this.W.length; i++) {
      this.W[i] -= learning_rate * dW[i];
    }

    // b := b - lr * db
    for (let i = 0; i < this.b.length; i++) {
      this.b[i] -= learning_rate * db[i];
    }
  }

  /**
   * 가중치 업데이트 (Momentum)
   */
  update_momentum(
    dW: Matrix,
    db: Tensor,
    learning_rate: number,
    momentum: number,
    v_W: Matrix,
    v_b: Tensor
  ): void {
    // v_W := momentum * v_W - lr * dW
    for (let i = 0; i < this.W.length; i++) {
      v_W[i] = momentum * v_W[i] - learning_rate * dW[i];
      this.W[i] += v_W[i];
    }

    // v_b := momentum * v_b - lr * db
    for (let i = 0; i < this.b.length; i++) {
      v_b[i] = momentum * v_b[i] - learning_rate * db[i];
      this.b[i] += v_b[i];
    }
  }

  /**
   * 가중치 업데이트 (Adam)
   */
  update_adam(
    dW: Matrix,
    db: Tensor,
    learning_rate: number,
    beta1: number,
    beta2: number,
    eps: number,
    t: number,
    m_W: Matrix,
    v_W: Matrix,
    m_b: Tensor,
    v_b: Tensor
  ): void {
    const lr_t = learning_rate * Math.sqrt(1 - Math.pow(beta2, t)) /
      (1 - Math.pow(beta1, t));

    // W 업데이트
    for (let i = 0; i < this.W.length; i++) {
      m_W[i] = beta1 * m_W[i] + (1 - beta1) * dW[i];
      v_W[i] = beta2 * v_W[i] + (1 - beta2) * dW[i] * dW[i];
      this.W[i] -= (lr_t * m_W[i]) / (Math.sqrt(v_W[i]) + eps);
    }

    // b 업데이트
    for (let i = 0; i < this.b.length; i++) {
      m_b[i] = beta1 * m_b[i] + (1 - beta1) * db[i];
      v_b[i] = beta2 * v_b[i] + (1 - beta2) * db[i] * db[i];
      this.b[i] -= (lr_t * m_b[i]) / (Math.sqrt(v_b[i]) + eps);
    }
  }

  /**
   * L2 정규화 (weight decay)
   */
  regularize_l2(lambda: number): void {
    // W := W * (1 - lambda)
    for (let i = 0; i < this.W.length; i++) {
      this.W[i] *= 1 - lambda;
    }
  }

  /**
   * L1 정규화 (LASSO)
   */
  regularize_l1(lambda: number): void {
    for (let i = 0; i < this.W.length; i++) {
      const sign = this.W[i] > 0 ? 1 : -1;
      this.W[i] -= sign * lambda;
    }
  }

  /**
   * 기울기 클리핑 (gradient clipping)
   */
  clip_gradient(dW: Matrix, db: Tensor, max_norm: number): void {
    let norm_W = TensorOps.l2_norm(dW);
    if (norm_W > max_norm) {
      const scale = max_norm / norm_W;
      for (let i = 0; i < dW.length; i++) {
        dW[i] *= scale;
      }
    }

    let norm_b = TensorOps.l2_norm(db);
    if (norm_b > max_norm) {
      const scale = max_norm / norm_b;
      for (let i = 0; i < db.length; i++) {
        db[i] *= scale;
      }
    }
  }

  /**
   * 현재 가중치 노름
   */
  weight_norm(): number {
    const norm_W = TensorOps.l2_norm(this.W);
    const norm_b = TensorOps.l2_norm(this.b);
    return Math.sqrt(norm_W * norm_W + norm_b * norm_b);
  }

  /**
   * 인코더 상태 저장
   */
  serialize(): {
    W: number[];
    b: number[];
    input_dim: number;
    output_dim: number;
  } {
    return {
      W: Array.from(this.W),
      b: Array.from(this.b),
      input_dim: this.input_dim,
      output_dim: this.output_dim,
    };
  }

  /**
   * 인코더 상태 복원
   */
  static deserialize(data: {
    W: number[];
    b: number[];
    input_dim: number;
    output_dim: number;
  }): QueryEncoder {
    const encoder = new QueryEncoder(data.input_dim, data.output_dim);
    encoder.W = new Float64Array(data.W);
    encoder.b = new Float64Array(data.b);
    return encoder;
  }

  /**
   * 디버깅용 상태 출력
   */
  debug_info(): string {
    const w_norm = TensorOps.l2_norm(this.W);
    const b_norm = TensorOps.l2_norm(this.b);
    return (
      `QueryEncoder(${this.input_dim}→${this.output_dim}): ` +
      `||W||=${w_norm.toFixed(4)}, ||b||=${b_norm.toFixed(4)}`
    );
  }
}

/**
 * 다층 인코더
 * 여러 층의 선형 변환을 이용한 깊은 인코딩
 */
export class DeepQueryEncoder {
  layers: QueryEncoder[];
  num_layers: number;
  private cached_inputs: Tensor[] = [];
  private cached_pre_relu: Tensor[] = [];

  constructor(dimensions: number[]) {
    if (dimensions.length < 2) {
      throw new Error("Need at least input and output dimensions");
    }

    this.num_layers = dimensions.length - 1;
    this.layers = [];

    for (let i = 0; i < this.num_layers; i++) {
      const input_dim = dimensions[i];
      const output_dim = dimensions[i + 1];
      this.layers.push(new QueryEncoder(input_dim, output_dim));
    }
  }

  /**
   * 순전파 (활성화 캐시 포함)
   */
  forward(q: Tensor): Tensor {
    this.cached_inputs = [];
    this.cached_pre_relu = [];
    let x = q;
    for (let i = 0; i < this.num_layers; i++) {
      this.cached_inputs.push(TensorOps.copy(x));  // 각 층의 입력 캐시
      x = this.layers[i].encode(x);
      // 마지막 층 제외 ReLU 적용
      if (i < this.num_layers - 1) {
        this.cached_pre_relu.push(TensorOps.copy(x));  // ReLU 이전 값 캐시
        x = TensorOps.relu(x);
      }
    }
    return x;
  }

  /**
   * 역전파 (캐시된 활성화 값을 이용한 올바른 ReLU 그래디언트)
   */
  backward(grad_output: Tensor): Tensor {
    let grad = grad_output;
    for (let i = this.num_layers - 1; i >= 0; i--) {
      const input = this.cached_inputs[i] !== undefined
        ? this.cached_inputs[i]
        : grad;  // fallback: forward() 미호출 시
      const { dW, db, dq } = this.layers[i].gradient(grad, input);
      grad = dq;

      // 비마지막 층: ReLU 그래디언트 적용 (pre-relu 캐시 사용)
      if (i > 0 && this.cached_pre_relu[i - 1] !== undefined) {
        grad = TensorOps.grad_relu(grad, this.cached_pre_relu[i - 1]);
      }
    }
    return grad;
  }

  /**
   * 디버깅용 정보
   */
  debug_info(): string {
    return this.layers.map((l) => l.debug_info()).join("\n");
  }
}
