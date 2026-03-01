/**
 * PostMindLang Runtime: Sampler Module
 * 토큰 샘플링 (softmax + 임계값)
 */

import { Tensor, Matrix, TensorOps } from "./tensor";

/**
 * 샘플링 결과
 */
export interface SampleResult {
  token: number;
  prob: number;
  logit: number;
}

/**
 * 샘플러 모듈
 */
export class Sampler {
  /**
   * 출력 가중치: W_out ∈ ℝ^(256×vocab_size)
   */
  W_out: Matrix;

  /**
   * 출력 편향: b_out ∈ ℝ^vocab_size
   */
  b_out: Tensor;

  /**
   * 어휘 크기
   */
  vocab_size: number;

  /**
   * 입력 차원
   */
  input_dim: number;

  constructor(input_dim: number = 256, vocab_size: number = 50257) {
    // GPT-2 기본 어휘 크기: 50257
    this.input_dim = input_dim;
    this.vocab_size = vocab_size;

    // 출력층 초기화 (Xavier)
    const scale = Math.sqrt(2.0 / (input_dim + vocab_size));
    this.W_out = TensorOps.randn(input_dim * vocab_size);
    for (let i = 0; i < this.W_out.length; i++) {
      this.W_out[i] *= scale;
    }

    this.b_out = TensorOps.zeros(vocab_size);
  }

  /**
   * Logits 계산: logits = W_out @ ensemble + b_out
   */
  compute_logits(ensemble: Tensor): Tensor {
    const logits = TensorOps.matvec(
      this.W_out,
      ensemble,
      this.vocab_size,
      this.input_dim
    );
    return TensorOps.add(logits, this.b_out);
  }

  /**
   * 기본 샘플링 (greedy + 임계값)
   */
  sample(
    ensemble: Tensor,
    tau: number = 0.8,
    threshold: number = 0.9
  ): SampleResult {
    // 1. Logits 계산
    const logits = this.compute_logits(ensemble);

    // 2. Softmax: p = softmax(logits / τ)
    const probs = TensorOps.softmax(logits, tau);

    // 3. 최댓값 확률
    const max_prob = TensorOps.max(probs);
    const max_idx = TensorOps.argmax(probs);

    // 4. 임계값 기반 의사결정
    if (max_prob > threshold) {
      // 높은 신뢰도: greedy 선택
      return {
        token: max_idx,
        prob: max_prob,
        logit: logits[max_idx],
      };
    } else {
      // 낮은 신뢰도: 확률 분포에서 샘플
      const sampled_idx = this.multinomial_sample(probs);
      return {
        token: sampled_idx,
        prob: probs[sampled_idx],
        logit: logits[sampled_idx],
      };
    }
  }

  /**
   * 다항 분포 샘플링
   */
  private multinomial_sample(probs: Tensor): number {
    const cum_probs = new Float64Array(probs.length);
    cum_probs[0] = probs[0];
    for (let i = 1; i < probs.length; i++) {
      cum_probs[i] = cum_probs[i - 1] + probs[i];
    }

    const r = Math.random();
    for (let i = 0; i < cum_probs.length; i++) {
      if (r < cum_probs[i]) {
        return i;
      }
    }
    return probs.length - 1;
  }

  /**
   * Top-K 샘플링
   * 확률이 높은 K개 토큰만 고려
   */
  sample_top_k(
    ensemble: Tensor,
    k: number,
    tau: number = 0.8
  ): SampleResult {
    const logits = this.compute_logits(ensemble);
    const probs = TensorOps.softmax(logits, tau);

    // Top-K 토큰 찾기
    const indices: { idx: number; prob: number }[] = [];
    for (let i = 0; i < probs.length; i++) {
      indices.push({ idx: i, prob: probs[i] });
    }
    indices.sort((a, b) => b.prob - a.prob);

    // Top-K 확률만 유지
    let top_k_sum = 0;
    for (let i = 0; i < Math.min(k, indices.length); i++) {
      top_k_sum += indices[i].prob;
    }

    const top_k_probs = new Float64Array(probs.length);
    for (let i = 0; i < Math.min(k, indices.length); i++) {
      top_k_probs[indices[i].idx] = indices[i].prob / top_k_sum;
    }

    // 샘플링
    const sampled_idx = this.multinomial_sample(top_k_probs);
    return {
      token: sampled_idx,
      prob: probs[sampled_idx],
      logit: logits[sampled_idx],
    };
  }

  /**
   * Top-P (nucleus) 샘플링
   * 누적 확률이 P를 초과하지 않을 때까지의 토큰만 고려
   */
  sample_top_p(
    ensemble: Tensor,
    p: number = 0.9,
    tau: number = 0.8
  ): SampleResult {
    const logits = this.compute_logits(ensemble);
    const probs = TensorOps.softmax(logits, tau);

    // 확률 내림차순 정렬
    const indices: { idx: number; prob: number }[] = [];
    for (let i = 0; i < probs.length; i++) {
      indices.push({ idx: i, prob: probs[i] });
    }
    indices.sort((a, b) => b.prob - a.prob);

    // 누적 확률이 p를 초과할 때까지의 토큰만 유지
    let cum_prob = 0;
    const top_p_indices: number[] = [];
    for (const { idx, prob } of indices) {
      cum_prob += prob;
      top_p_indices.push(idx);
      if (cum_prob >= p) {
        break;
      }
    }

    const top_p_probs = new Float64Array(probs.length);
    let top_p_sum = 0;
    for (const idx of top_p_indices) {
      top_p_probs[idx] = probs[idx];
      top_p_sum += probs[idx];
    }

    // 정규화
    for (const idx of top_p_indices) {
      top_p_probs[idx] /= top_p_sum;
    }

    // 샘플링
    const sampled_idx = this.multinomial_sample(top_p_probs);
    return {
      token: sampled_idx,
      prob: probs[sampled_idx],
      logit: logits[sampled_idx],
    };
  }

  /**
   * 온도 기반 샘플링
   * τ > 1: 더 다양한 샘플
   * τ < 1: 더 결정론적
   * τ = 1: 기본
   */
  sample_with_temperature(
    ensemble: Tensor,
    tau: number = 1.0
  ): SampleResult {
    const logits = this.compute_logits(ensemble);
    const probs = TensorOps.softmax(logits, tau);

    const sampled_idx = this.multinomial_sample(probs);
    return {
      token: sampled_idx,
      prob: probs[sampled_idx],
      logit: logits[sampled_idx],
    };
  }

  /**
   * 그래디언트 계산
   */
  gradient(
    sample_result: SampleResult,
    ensemble: Tensor
  ): {
    dW_out: Matrix;
    db_out: Tensor;
    densemble: Tensor;
  } {
    // Cross-entropy 손실 그래디언트
    const logits = this.compute_logits(ensemble);
    const probs = TensorOps.softmax(logits, 1.0);

    // ∂L/∂logit_i = p_i - target_i
    // target_i = 1 if i == sample_result.token else 0
    const grad_logits = new Float64Array(this.vocab_size);
    for (let i = 0; i < this.vocab_size; i++) {
      grad_logits[i] =
        probs[i] - (i === sample_result.token ? 1 : 0);
    }

    // ∂L/∂W_out = grad_logits ⊗ ensemble
    const dW_out = TensorOps.outer(ensemble, grad_logits);

    // ∂L/∂b_out = grad_logits
    const db_out = TensorOps.copy(grad_logits);

    // ∂L/∂ensemble = W_out^T @ grad_logits
    const W_out_T = TensorOps.transpose(
      this.W_out,
      this.input_dim,
      this.vocab_size
    );
    const densemble = TensorOps.matvec(
      W_out_T,
      grad_logits,
      this.input_dim,
      this.vocab_size
    );

    return { dW_out, db_out, densemble };
  }

  /**
   * 배치 그래디언트
   */
  gradient_batch(
    samples: number[],
    ensembles: Float64Array,
    batch_size: number
  ): {
    dW_out: Matrix;
    db_out: Tensor;
    densembles: Float64Array;
  } {
    const dW_out = TensorOps.zeros(
      this.input_dim * this.vocab_size
    );
    const db_out = TensorOps.zeros(this.vocab_size);
    const densembles = TensorOps.zeros(
      batch_size * this.input_dim
    );

    for (let b = 0; b < batch_size; b++) {
      const e_start = b * this.input_dim;
      const ensemble = ensembles.slice(
        e_start,
        e_start + this.input_dim
      );

      const logits = this.compute_logits(ensemble);
      const probs = TensorOps.softmax(logits, 1.0);

      const grad_logits = new Float64Array(this.vocab_size);
      for (let i = 0; i < this.vocab_size; i++) {
        grad_logits[i] =
          probs[i] - (i === samples[b] ? 1 : 0);
      }

      // 누적 그래디언트
      const outer_prod = TensorOps.outer(ensemble, grad_logits);
      for (let i = 0; i < dW_out.length; i++) {
        dW_out[i] += outer_prod[i];
      }

      for (let i = 0; i < this.vocab_size; i++) {
        db_out[i] += grad_logits[i];
      }

      const W_out_T = TensorOps.transpose(
        this.W_out,
        this.input_dim,
        this.vocab_size
      );
      const densemble = TensorOps.matvec(
        W_out_T,
        grad_logits,
        this.input_dim,
        this.vocab_size
      );

      for (let i = 0; i < this.input_dim; i++) {
        densembles[e_start + i] = densemble[i];
      }
    }

    return { dW_out, db_out, densembles };
  }

  /**
   * 가중치 업데이트
   */
  update(
    dW_out: Matrix,
    db_out: Tensor,
    learning_rate: number
  ): void {
    for (let i = 0; i < this.W_out.length; i++) {
      this.W_out[i] -= learning_rate * dW_out[i];
    }

    for (let i = 0; i < this.b_out.length; i++) {
      this.b_out[i] -= learning_rate * db_out[i];
    }
  }

  /**
   * 상위 확률 토큰 조회
   */
  top_tokens(ensemble: Tensor, k: number = 10): {
    token: number;
    prob: number;
  }[] {
    const logits = this.compute_logits(ensemble);
    const probs = TensorOps.softmax(logits, 1.0);

    const tokens: { token: number; prob: number }[] = [];
    for (let i = 0; i < probs.length; i++) {
      tokens.push({ token: i, prob: probs[i] });
    }

    tokens.sort((a, b) => b.prob - a.prob);
    return tokens.slice(0, Math.min(k, tokens.length));
  }

  /**
   * 엔트로피 계산 (샘플링 다양성 측정)
   */
  entropy(ensemble: Tensor): number {
    const logits = this.compute_logits(ensemble);
    const probs = TensorOps.softmax(logits, 1.0);

    let entropy = 0;
    for (let i = 0; i < probs.length; i++) {
      if (probs[i] > 1e-10) {
        entropy -= probs[i] * Math.log(probs[i]);
      }
    }

    return entropy;
  }

  /**
   * 직렬화
   */
  serialize(): {
    W_out: number[];
    b_out: number[];
    vocab_size: number;
    input_dim: number;
  } {
    return {
      W_out: Array.from(this.W_out),
      b_out: Array.from(this.b_out),
      vocab_size: this.vocab_size,
      input_dim: this.input_dim,
    };
  }

  /**
   * 역직렬화
   */
  static deserialize(data: {
    W_out: number[];
    b_out: number[];
    vocab_size: number;
    input_dim: number;
  }): Sampler {
    const sampler = new Sampler(data.input_dim, data.vocab_size);
    sampler.W_out = new Float64Array(data.W_out);
    sampler.b_out = new Float64Array(data.b_out);
    return sampler;
  }

  /**
   * 디버깅 정보
   */
  debug_info(): string {
    const w_norm = TensorOps.l2_norm(this.W_out);
    const b_norm = TensorOps.l2_norm(this.b_out);
    return (
      `Sampler(${this.input_dim}→${this.vocab_size}): ` +
      `||W_out||=${w_norm.toFixed(4)}, ||b_out||=${b_norm.toFixed(4)}`
    );
  }
}
