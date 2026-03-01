/**
 * PostMindLang Runtime: Ensemble Module
 * 3개 경로의 앙상블 (가중 합)
 * 가중치는 쿼리 기반으로 동적으로 결정됨
 */

import { Tensor, Matrix, TensorOps } from "./tensor";
import { QueryEncoder } from "./encoding";

/**
 * 앙상블 모듈
 * 가중 합: e = w_a * z_a + w_b * z_b + w_c * z_c
 * 가중치: w = softmax(W_weight @ q)
 */
export class EnsembleModule {
  /**
   * 가중치 함수를 위한 인코더
   * f_weight: ℝ^768 → ℝ^3
   */
  weight_encoder: QueryEncoder;

  /**
   * 온도 파라미터 (softmax temperature)
   */
  tau: number;

  constructor(query_dim: number = 768, temperature: number = 0.8) {
    // 간단한 구현: 1층 인코더 (768 → 3)
    this.weight_encoder = new QueryEncoder(query_dim, 3);
    this.tau = temperature;
  }

  /**
   * 가중치 계산: w = softmax(W_weight @ q / τ)
   * 결과: w ∈ Δ^2 (simplex - 확률 분포)
   */
  compute_weights(q: Tensor): Tensor {
    // f_weight(q) ∈ ℝ^3
    const logits = this.weight_encoder.encode(q);

    // softmax(logits / τ)
    const weights = TensorOps.softmax(logits, this.tau);

    return weights;
  }

  /**
   * 배치 가중치 계산
   */
  compute_weights_batch(Q: Matrix, batch_size: number): Matrix {
    const logits = this.weight_encoder.encode_batch(Q, batch_size);
    const weights = TensorOps.softmax(logits, this.tau);
    return weights;
  }

  /**
   * 앙상블 결합
   * e = w[0] * z_a + w[1] * z_b + w[2] * z_c
   */
  combine(
    w: Tensor,
    z_a: Tensor,
    z_b: Tensor,
    z_c: Tensor
  ): Tensor {
    if (w.length !== 3) {
      throw new Error(`Weights dimension must be 3, got ${w.length}`);
    }

    // 각 경로를 가중치로 스케일
    const scaled_a = TensorOps.scale(z_a, w[0]);
    const scaled_b = TensorOps.scale(z_b, w[1]);
    const scaled_c = TensorOps.scale(z_c, w[2]);

    // 합산
    const e = TensorOps.add(scaled_a, TensorOps.add(scaled_b, scaled_c));

    return e;
  }

  /**
   * 배치 앙상블 결합
   */
  combine_batch(
    W: Matrix,
    Z_a: Matrix,
    Z_b: Matrix,
    Z_c: Matrix,
    batch_size: number,
    path_dim: number
  ): Matrix {
    const E = TensorOps.zeros(batch_size * path_dim);

    for (let b = 0; b < batch_size; b++) {
      const w_start = b * 3;
      const z_start = b * path_dim;

      const w_a = W[w_start];
      const w_b = W[w_start + 1];
      const w_c = W[w_start + 2];

      for (let j = 0; j < path_dim; j++) {
        E[z_start + j] =
          w_a * Z_a[z_start + j] +
          w_b * Z_b[z_start + j] +
          w_c * Z_c[z_start + j];
      }
    }

    return E;
  }

  /**
   * 앙상블 그래디언트
   * ∂L/∂w, ∂L/∂z_a, ∂L/∂z_b, ∂L/∂z_c 계산
   */
  gradient(
    grad_e: Tensor,
    w: Tensor,
    z_a: Tensor,
    z_b: Tensor,
    z_c: Tensor
  ): {
    grad_w: Tensor;
    grad_z_a: Tensor;
    grad_z_b: Tensor;
    grad_z_c: Tensor;
  } {
    // ∂L/∂z_a = w[0] * grad_e
    const grad_z_a = TensorOps.scale(grad_e, w[0]);

    // ∂L/∂z_b = w[1] * grad_e
    const grad_z_b = TensorOps.scale(grad_e, w[1]);

    // ∂L/∂z_c = w[2] * grad_e
    const grad_z_c = TensorOps.scale(grad_e, w[2]);

    // ∂L/∂w = [dot(grad_e, z_a), dot(grad_e, z_b), dot(grad_e, z_c)]
    const grad_w_pre = new Float64Array(3);
    grad_w_pre[0] = TensorOps.dot(grad_e, z_a);
    grad_w_pre[1] = TensorOps.dot(grad_e, z_b);
    grad_w_pre[2] = TensorOps.dot(grad_e, z_c);

    // softmax 역전파
    // ∂L/∂logits = ∂L/∂w ⊙ (w - w·w^T)
    // 단순화: softmax 그래디언트 적용
    const grad_w = TensorOps.grad_softmax(grad_w_pre, w);

    return { grad_w, grad_z_a, grad_z_b, grad_z_c };
  }

  /**
   * 가중치 함수의 그래디언트
   */
  gradient_weight_fn(grad_w: Tensor, q: Tensor): {
    dW_weight: Matrix;
    db_weight: Tensor;
    dq: Tensor;
  } {
    return this.weight_encoder.gradient(grad_w, q);
  }

  /**
   * 배치 가중치 함수 그래디언트
   */
  gradient_weight_fn_batch(
    grad_W: Matrix,
    Q: Matrix,
    batch_size: number
  ): {
    dW_weight: Matrix;
    db_weight: Tensor;
    dQ: Matrix;
  } {
    return this.weight_encoder.gradient_batch(grad_W, Q, batch_size);
  }

  /**
   * 가중치 균형도 (weight balance)
   * 값이 클수록 가중치가 균등하게 분포
   */
  weight_balance(w: Tensor): number {
    // 엔트로피: -Σ w_i * log(w_i)
    // 최대값: log(3) ≈ 1.099
    let entropy = 0;
    for (let i = 0; i < 3; i++) {
      if (w[i] > 1e-10) {
        entropy -= w[i] * Math.log(w[i]);
      }
    }
    return entropy / Math.log(3);
  }

  /**
   * 우세 경로 선택
   * 가장 높은 가중치를 가진 경로
   */
  dominant_path(w: Tensor): { path: "a" | "b" | "c"; weight: number } {
    let max_weight = w[0];
    let max_idx = 0;

    for (let i = 1; i < 3; i++) {
      if (w[i] > max_weight) {
        max_weight = w[i];
        max_idx = i;
      }
    }

    const path_names: ("a" | "b" | "c")[] = ["a", "b", "c"];
    return { path: path_names[max_idx], weight: max_weight };
  }

  /**
   * 가중치 업데이트
   */
  update(dW: Matrix, db: Tensor, learning_rate: number): void {
    this.weight_encoder.update(dW, db, learning_rate);
  }

  /**
   * 온도 스케줄링 (temperature scheduling)
   * 훈련 진행에 따라 온도 감소
   */
  set_temperature(t: number, total_steps: number, current_step: number): void {
    // 선형 감소
    this.tau = t * (1 - current_step / total_steps);
  }

  /**
   * 가중치 정규화 (weight regularization)
   * 가중치 간 차이를 최소화하여 경로 균형 유지
   */
  regularize_balance(weight_lambda: number): Tensor {
    // ∂L_reg/∂w = λ * (w - 1/3)
    // 모든 가중치를 1/3으로 유도하는 정규화
    const reg = new Float64Array(3);
    for (let i = 0; i < 3; i++) {
      reg[i] = weight_lambda * (-1.0 / 3.0); // 목표: 1/3
    }
    return reg;
  }

  /**
   * 경로 혼합도 (path mixing)
   * 단일 경로에 의존하는 정도 측정 (0: 균등, 1: 완전히 한 경로)
   */
  path_concentration(w: Tensor): number {
    // Herfindahl index: Σ w_i^2
    // 범위: [1/3, 1]
    let concentration = 0;
    for (let i = 0; i < 3; i++) {
      concentration += w[i] * w[i];
    }
    return (concentration - 1.0 / 3.0) / (1.0 - 1.0 / 3.0);
  }

  /**
   * 직렬화
   */
  serialize(): {
    weight_encoder: ReturnType<typeof QueryEncoder.prototype.serialize>;
    tau: number;
  } {
    return {
      weight_encoder: this.weight_encoder.serialize(),
      tau: this.tau,
    };
  }

  /**
   * 역직렬화
   */
  static deserialize(data: {
    weight_encoder: ReturnType<typeof QueryEncoder.prototype.serialize>;
    tau: number;
  }): EnsembleModule {
    const module = new EnsembleModule();
    module.weight_encoder = QueryEncoder.deserialize(data.weight_encoder);
    module.tau = data.tau;
    return module;
  }

  /**
   * 디버깅 정보
   */
  debug_info(): string {
    return (
      `EnsembleModule (τ=${this.tau.toFixed(3)}): ` +
      `${this.weight_encoder.debug_info()}`
    );
  }
}

/**
 * 고급 앙상블: 동적 가중치 조정
 */
export class AdaptiveEnsembleModule extends EnsembleModule {
  /**
   * 신뢰도 기반 가중치 조정
   * confidence 값이 높을수록 현재 가중치를 유지
   */
  adjust_weights_by_confidence(
    w: Tensor,
    confidence: number
  ): Tensor {
    // w' = confidence * w + (1 - confidence) * uniform
    const uniform = new Float64Array(3);
    uniform.fill(1.0 / 3.0);

    const w_adjusted = new Float64Array(3);
    for (let i = 0; i < 3; i++) {
      w_adjusted[i] = confidence * w[i] + (1 - confidence) * uniform[i];
    }

    return TensorOps.softmax(w_adjusted);
  }

  /**
   * 그래디언트 크기에 따른 가중치 조정
   */
  adjust_weights_by_gradient(
    w: Tensor,
    grad_z_a: Tensor,
    grad_z_b: Tensor,
    grad_z_c: Tensor
  ): Tensor {
    // 그래디언트 크기 계산
    const mag_a = TensorOps.l2_norm(grad_z_a);
    const mag_b = TensorOps.l2_norm(grad_z_b);
    const mag_c = TensorOps.l2_norm(grad_z_c);

    // 크기에 반비례하는 가중치 (학습 속도 균형)
    const inv_mag = new Float64Array(3);
    const total_inv = 1 / mag_a + 1 / mag_b + 1 / mag_c;
    inv_mag[0] = (1 / mag_a) / total_inv;
    inv_mag[1] = (1 / mag_b) / total_inv;
    inv_mag[2] = (1 / mag_c) / total_inv;

    // 현재 가중치와 혼합
    const blend_factor = 0.9; // 현재 가중치 유지 정도
    const w_blended = new Float64Array(3);
    for (let i = 0; i < 3; i++) {
      w_blended[i] = blend_factor * w[i] + (1 - blend_factor) * inv_mag[i];
    }

    return TensorOps.softmax(w_blended);
  }
}
