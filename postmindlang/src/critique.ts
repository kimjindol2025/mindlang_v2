/**
 * PostMindLang Runtime: Critique Module
 * 자가 비판 (∇L 계산)
 * 손실 함수의 그래디언트를 통한 신뢰도 측정
 */

import { Tensor, TensorOps } from "./tensor";

/**
 * 손실 함수 타입
 */
export type LossFn = (ensemble: Tensor, query: Tensor) => number;

/**
 * 그래디언트 함수 타입
 */
export type GradientFn = (ensemble: Tensor, query: Tensor) => Tensor;

/**
 * 비판 모듈
 * 출력 품질을 평가하고 개선 여부를 결정
 */
export class CritiqueModule {
  /**
   * 손실 함수
   */
  loss_fn: LossFn;

  /**
   * 손실 함수의 그래디언트
   */
  grad_fn: GradientFn;

  /**
   * 신뢰도 임계값
   */
  confidence_threshold: number;

  /**
   * 그래디언트 정규화 인수
   */
  grad_normalization: number;

  constructor(
    loss_fn: LossFn,
    grad_fn: GradientFn,
    confidence_threshold: number = 0.8,
    grad_normalization: number = 10.0
  ) {
    this.loss_fn = loss_fn;
    this.grad_fn = grad_fn;
    this.confidence_threshold = confidence_threshold;
    this.grad_normalization = grad_normalization;
  }

  /**
   * 비판 수행: ∇L 계산 및 신뢰도 측정
   */
  critique(ensemble: Tensor, query: Tensor): {
    grad: Tensor;
    confidence: number;
    loss: number;
  } {
    // 손실값 계산
    const loss = this.loss_fn(ensemble, query);

    // 그래디언트 계산: δ = ∇_ensemble L
    const grad = this.grad_fn(ensemble, query);

    // 신뢰도 계산
    // confidence = max(0, 1 - ||grad||_2 / normalization_factor)
    const grad_norm = TensorOps.l2_norm(grad);
    const confidence = Math.max(
      0,
      1 - grad_norm / this.grad_normalization
    );

    return { grad, confidence, loss };
  }

  /**
   * 배치 비판
   */
  critique_batch(
    ensembles: Float64Array,
    queries: Float64Array,
    batch_size: number,
    ensemble_dim: number,
    query_dim: number
  ): {
    grads: Float64Array;
    confidences: number[];
    losses: number[];
  } {
    const grads = new Float64Array(batch_size * ensemble_dim);
    const confidences: number[] = [];
    const losses: number[] = [];

    for (let b = 0; b < batch_size; b++) {
      const e_start = b * ensemble_dim;
      const q_start = b * query_dim;

      const e = ensembles.slice(e_start, e_start + ensemble_dim);
      const q = queries.slice(q_start, q_start + query_dim);

      const { grad, confidence, loss } = this.critique(e, q);

      for (let i = 0; i < ensemble_dim; i++) {
        grads[e_start + i] = grad[i];
      }
      confidences.push(confidence);
      losses.push(loss);
    }

    return { grads, confidences, losses };
  }

  /**
   * 신뢰도 기반 의사결정
   */
  should_refine(confidence: number): boolean {
    return confidence < this.confidence_threshold;
  }

  /**
   * 개선 필요도 점수 (0: 완벽, 1: 완전히 잘못됨)
   */
  refinement_score(confidence: number): number {
    return Math.max(0, 1 - confidence);
  }

  /**
   * 그래디언트 기반 우려도 (concern score)
   * 그래디언트 크기가 클수록 모델이 불확실
   */
  concern_score(grad: Tensor): number {
    const norm = TensorOps.l2_norm(grad);
    return Math.min(1, norm / this.grad_normalization);
  }

  /**
   * 그래디언트 방향 (개선 방향)
   */
  improvement_direction(grad: Tensor): Tensor {
    return TensorOps.scale(grad, -1); // -∇L 방향으로 개선
  }

  /**
   * 최대 그래디언트 요소
   */
  max_gradient_component(grad: Tensor): number {
    return TensorOps.max_norm(grad);
  }

  /**
   * 그래디언트 분포 통계
   */
  gradient_stats(grad: Tensor): {
    mean: number;
    std: number;
    max: number;
    min: number;
  } {
    const abs_grad = TensorOps.abs(grad);
    const mean = TensorOps.mean(abs_grad);
    const std = TensorOps.std(abs_grad);
    const max = TensorOps.max(abs_grad);
    let min = abs_grad[0];
    for (let i = 1; i < abs_grad.length; i++) {
      min = Math.min(min, abs_grad[i]);
    }

    return { mean, std, max, min };
  }
}

/**
 * 고급 비판 모듈
 */
export class AdvancedCritiqueModule extends CritiqueModule {
  /**
   * 예측 불확실성 추정 (ensemble 표준편차)
   */
  predict_uncertainty(ensemble: Tensor): number {
    return TensorOps.std(ensemble);
  }

  /**
   * 신뢰도 재계산 (다중 기준)
   */
  critique_advanced(ensemble: Tensor, query: Tensor): {
    grad: Tensor;
    confidence: number;
    loss: number;
    uncertainty: number;
    concern: number;
  } {
    const { grad, confidence, loss } = this.critique(ensemble, query);
    const uncertainty = this.predict_uncertainty(ensemble);
    const concern = this.concern_score(grad);

    return { grad, confidence, loss, uncertainty, concern };
  }

  /**
   * 다중 손실 함수 결합
   */
  combined_critique(
    ensemble: Tensor,
    query: Tensor,
    loss_fns: { fn: LossFn; weight: number }[]
  ): {
    grad: Tensor;
    confidence: number;
    combined_loss: number;
  } {
    let combined_loss = 0;
    let combined_grad = TensorOps.zeros(ensemble.length);

    for (const { fn: loss_fn, weight } of loss_fns) {
      combined_loss += weight * loss_fn(ensemble, query);
    }

    // 수치 미분으로 그래디언트 추정
    const eps = 1e-5;
    for (let i = 0; i < ensemble.length; i++) {
      const e_plus = TensorOps.copy(ensemble);
      const e_minus = TensorOps.copy(ensemble);
      e_plus[i] += eps;
      e_minus[i] -= eps;

      let loss_plus = 0;
      let loss_minus = 0;

      for (const { fn: loss_fn, weight } of loss_fns) {
        loss_plus += weight * loss_fn(e_plus, query);
        loss_minus += weight * loss_fn(e_minus, query);
      }

      combined_grad[i] = (loss_plus - loss_minus) / (2 * eps);
    }

    const grad_norm = TensorOps.l2_norm(combined_grad);
    const confidence = Math.max(
      0,
      1 - grad_norm / this.grad_normalization
    );

    return { grad: combined_grad, confidence, combined_loss };
  }
}

/**
 * 기본 손실 함수들
 */
export class StandardLosses {
  /**
   * MSE 손실: L = ||ensemble - target||^2 / n
   */
  static mse_loss(target: Tensor): LossFn {
    return (ensemble: Tensor, query: Tensor) => {
      let loss = 0;
      for (let i = 0; i < ensemble.length; i++) {
        const diff = ensemble[i] - target[i];
        loss += diff * diff;
      }
      return loss / ensemble.length;
    };
  }

  /**
   * MSE 손실의 그래디언트
   */
  static mse_grad(target: Tensor): GradientFn {
    return (ensemble: Tensor, query: Tensor) => {
      const grad = new Float64Array(ensemble.length);
      for (let i = 0; i < ensemble.length; i++) {
        grad[i] = 2 * (ensemble[i] - target[i]) / ensemble.length;
      }
      return grad;
    };
  }

  /**
   * L1 손실: L = Σ |ensemble - target| / n
   */
  static l1_loss(target: Tensor): LossFn {
    return (ensemble: Tensor, query: Tensor) => {
      let loss = 0;
      for (let i = 0; i < ensemble.length; i++) {
        loss += Math.abs(ensemble[i] - target[i]);
      }
      return loss / ensemble.length;
    };
  }

  /**
   * L1 손실의 그래디언트
   */
  static l1_grad(target: Tensor): GradientFn {
    return (ensemble: Tensor, query: Tensor) => {
      const grad = new Float64Array(ensemble.length);
      for (let i = 0; i < ensemble.length; i++) {
        const diff = ensemble[i] - target[i];
        grad[i] =
          (diff > 0 ? 1 : diff < 0 ? -1 : 0) / ensemble.length;
      }
      return grad;
    };
  }

  /**
   * Cross-Entropy 손실 (분류)
   */
  static cross_entropy_loss(target: Tensor): LossFn {
    return (ensemble: Tensor, query: Tensor) => {
      let loss = 0;
      for (let i = 0; i < ensemble.length; i++) {
        // softmax 확률로 해석
        const p = Math.max(1e-10, Math.min(1 - 1e-10, ensemble[i]));
        loss -= target[i] * Math.log(p) + (1 - target[i]) * Math.log(1 - p);
      }
      return loss / ensemble.length;
    };
  }

  /**
   * Cross-Entropy 손실의 그래디언트
   */
  static cross_entropy_grad(target: Tensor): GradientFn {
    return (ensemble: Tensor, query: Tensor) => {
      const grad = new Float64Array(ensemble.length);
      for (let i = 0; i < ensemble.length; i++) {
        const p = Math.max(1e-10, Math.min(1 - 1e-10, ensemble[i]));
        grad[i] =
          (p - target[i]) / (p * (1 - p)) / ensemble.length;
      }
      return grad;
    };
  }

  /**
   * Huber 손실 (로버스트한 손실)
   */
  static huber_loss(target: Tensor, delta: number = 1.0): LossFn {
    return (ensemble: Tensor, query: Tensor) => {
      let loss = 0;
      for (let i = 0; i < ensemble.length; i++) {
        const diff = Math.abs(ensemble[i] - target[i]);
        if (diff <= delta) {
          loss += 0.5 * diff * diff;
        } else {
          loss += delta * (diff - 0.5 * delta);
        }
      }
      return loss / ensemble.length;
    };
  }

  /**
   * Huber 손실의 그래디언트
   */
  static huber_grad(target: Tensor, delta: number = 1.0): GradientFn {
    return (ensemble: Tensor, query: Tensor) => {
      const grad = new Float64Array(ensemble.length);
      for (let i = 0; i < ensemble.length; i++) {
        const diff = ensemble[i] - target[i];
        if (Math.abs(diff) <= delta) {
          grad[i] = diff;
        } else {
          grad[i] = delta * (diff > 0 ? 1 : -1);
        }
      }
      return grad;
    };
  }
}
