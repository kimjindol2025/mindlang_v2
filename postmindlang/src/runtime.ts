/**
 * PostMindLang Runtime: Main Execution Engine
 * PostMindLang 런타임 구현
 */

import { Tensor, TensorOps } from "./tensor";
import { QueryEncoder } from "./encoding";
import { PathExecutor } from "./paths";
import { EnsembleModule } from "./ensemble";
import { CritiqueModule, StandardLosses } from "./critique";
import { Sampler, SampleResult } from "./sampler";

/**
 * 런타임 구성 옵션
 */
export interface RuntimeConfig {
  query_dim: number;
  encoder_dim: number;
  path_dim: number;
  vocab_size: number;
  temperature: number;
  confidence_threshold: number;
  max_iterations: number;
}

/**
 * 실행 결과
 */
export interface ExecutionResult {
  token: number;
  confidence: number;
  iterations: number;
  refined: boolean;
  tokens: number[];
  probabilities: number[];
  path_weights: { a: number; b: number; c: number };
  timing: {
    encode: number;
    paths: number;
    ensemble: number;
    critique: number;
    sample: number;
    refine: number;
  };
}

/**
 * 훈련 상태
 */
export interface TrainingState {
  loss: number;
  accuracy: number;
  iteration: number;
  learning_rate: number;
}

/**
 * PostMindLang 런타임 (코어)
 * 완전히 미분 가능한 신경망 기반 텍스트 생성
 */
export class PostMindLangRuntimeCore {
  /**
   * 모듈 구성
   */
  encoder: QueryEncoder;
  paths: PathExecutor;
  ensemble: EnsembleModule;
  critique: CritiqueModule;
  sampler: Sampler;

  /**
   * 설정
   */
  config: RuntimeConfig;

  /**
   * 통계
   */
  stats: {
    total_executions: number;
    total_refinements: number;
    avg_confidence: number;
    avg_iterations: number;
  };

  constructor(config?: Partial<RuntimeConfig>) {
    this.config = {
      query_dim: 768,
      encoder_dim: 512,
      path_dim: 256,
      vocab_size: 50257,
      temperature: 0.8,
      confidence_threshold: 0.8,
      max_iterations: 3,
      ...config,
    };

    // 모듈 초기화
    this.encoder = new QueryEncoder(
      this.config.query_dim,
      this.config.encoder_dim
    );

    this.paths = new PathExecutor(
      this.config.encoder_dim,
      this.config.path_dim
    );

    this.ensemble = new EnsembleModule(
      this.config.query_dim,
      this.config.temperature
    );

    // 기본 손실 함수 (MSE)
    const target = TensorOps.zeros(this.config.path_dim);
    const loss_fn = StandardLosses.mse_loss(target);
    const grad_fn = StandardLosses.mse_grad(target);

    this.critique = new CritiqueModule(
      loss_fn,
      grad_fn,
      this.config.confidence_threshold
    );

    this.sampler = new Sampler(
      this.config.path_dim,
      this.config.vocab_size
    );

    // 통계 초기화
    this.stats = {
      total_executions: 0,
      total_refinements: 0,
      avg_confidence: 0,
      avg_iterations: 0,
    };
  }

  /**
   * 단일 토큰 생성 (메인 실행 루프)
   */
  async execute(query: Tensor): Promise<ExecutionResult> {
    const timing: any = {};
    const tokens: number[] = [];
    const probabilities: number[] = [];

    // 1. 쿼리 인코딩
    const t_start = performance.now();
    const z = this.encoder.encode(query);
    timing.encode = performance.now() - t_start;

    // 2. 3개 경로 병렬 실행
    const t_paths_start = performance.now();
    const { z_a, z_b, z_c } = this.paths.execute_parallel(z);
    timing.paths = performance.now() - t_paths_start;

    // 3. 적응형 가중치 계산
    const t_ensemble_start = performance.now();
    const w = this.ensemble.compute_weights(query);
    const path_weights = { a: w[0], b: w[1], c: w[2] };

    // 4. 앙상블 결합
    const e = this.ensemble.combine(w, z_a, z_b, z_c);
    timing.ensemble = performance.now() - t_ensemble_start;

    // 5. 자가 비판
    const t_critique_start = performance.now();
    const { grad, confidence } = this.critique.critique(e, query);
    timing.critique = performance.now() - t_critique_start;

    // 6. 샘플링 또는 개선
    let refined = false;
    let iterations = 1;
    let current_e = e;
    let current_confidence = confidence;

    const t_sample_start = performance.now();
    if (current_confidence > this.config.confidence_threshold) {
      // 신뢰도가 높음: 그리디 샘플링
      const sample = this.sampler.sample(
        current_e,
        this.config.temperature,
        0.9
      );
      tokens.push(sample.token);
      probabilities.push(sample.prob);
    } else {
      // 신뢰도가 낮음: 개선 필요
      refined = true;
      const t_refine_start = performance.now();

      // 반복적 개선 (그래디언트 상승)
      for (let iter = 0; iter < this.config.max_iterations; iter++) {
        // e' = e - α * ∇L (그래디언트 감소)
        const alpha = 0.1 * (1 - iter / this.config.max_iterations);
        const grad_scaled = TensorOps.scale(grad, -alpha);
        current_e = TensorOps.add(current_e, grad_scaled);

        // 업데이트된 신뢰도 계산
        const { confidence: new_conf } = this.critique.critique(
          current_e,
          query
        );
        current_confidence = new_conf;
        iterations = iter + 2;

        // 충분히 개선되었으면 중단
        if (current_confidence > this.config.confidence_threshold) {
          break;
        }
      }

      timing.refine = performance.now() - t_refine_start;

      // 최종 샘플링
      const sample = this.sampler.sample(
        current_e,
        this.config.temperature,
        0.8
      );
      tokens.push(sample.token);
      probabilities.push(sample.prob);
    }
    timing.sample = performance.now() - t_sample_start;

    // 통계 업데이트
    this.stats.total_executions++;
    this.stats.total_refinements += refined ? 1 : 0;
    this.stats.avg_confidence =
      (this.stats.avg_confidence * (this.stats.total_executions - 1) +
        current_confidence) /
      this.stats.total_executions;
    this.stats.avg_iterations =
      (this.stats.avg_iterations * (this.stats.total_executions - 1) +
        iterations) /
      this.stats.total_executions;

    return {
      token: tokens[0],
      confidence: current_confidence,
      iterations,
      refined,
      tokens,
      probabilities,
      path_weights,
      timing,
    };
  }

  /**
   * 시퀀스 생성
   */
  async generate(
    query: Tensor,
    max_length: number = 10
  ): Promise<{
    tokens: number[];
    confidences: number[];
    results: ExecutionResult[];
  }> {
    const tokens: number[] = [];
    const confidences: number[] = [];
    const results: ExecutionResult[] = [];

    for (let i = 0; i < max_length; i++) {
      const result = await this.execute(query);
      tokens.push(result.token);
      confidences.push(result.confidence);
      results.push(result);

      // 신뢰도가 너무 낮으면 생성 중단
      if (result.confidence < 0.2) {
        break;
      }
    }

    return { tokens, confidences, results };
  }

  /**
   * 배치 추론
   */
  async infer_batch(
    queries: Float64Array,
    batch_size: number
  ): Promise<{
    tokens: number[];
    confidences: number[];
  }> {
    const tokens: number[] = [];
    const confidences: number[] = [];

    const query_dim = this.config.query_dim;

    for (let b = 0; b < batch_size; b++) {
      const q_start = b * query_dim;
      const q = queries.slice(q_start, q_start + query_dim);
      const result = await this.execute(q);

      tokens.push(result.token);
      confidences.push(result.confidence);
    }

    return { tokens, confidences };
  }

  /**
   * 전체 그래디언트 계산 (훈련용)
   */
  backward(
    sample_token: number,
    ensemble: Tensor,
    query: Tensor,
    z: Tensor,
    z_a: Tensor,
    z_b: Tensor,
    z_c: Tensor,
    w: Tensor
  ): {
    encoder_grads: any;
    path_grads: any;
    ensemble_grads: any;
    sampler_grads: any;
  } {
    // 1. 샘플러 그래디언트
    const sample_result: SampleResult = {
      token: sample_token,
      prob: 0.5,
      logit: 0,
    };
    const {
      dW_out,
      db_out,
      densemble: grad_ensemble,
    } = this.sampler.gradient(sample_result, ensemble);

    // 2. 앙상블 그래디언트
    const { grad_w, grad_z_a, grad_z_b, grad_z_c } =
      this.ensemble.gradient(grad_ensemble, w, z_a, z_b, z_c);

    // 3. 경로 그래디언트
    const path_grads = this.paths.gradient_all(
      grad_z_a,
      grad_z_b,
      grad_z_c,
      z
    );

    // 4. 가중치 함수 그래디언트
    const { dW_weight, db_weight, dq: grad_q_weight } =
      this.ensemble.gradient_weight_fn(grad_w, query);

    // 5. 인코더 그래디언트
    const { dW: dW_enc, db: db_enc, dq: grad_q_enc } =
      this.encoder.gradient(path_grads.dz, query);

    // 최종 쿼리 그래디언트
    const grad_q = TensorOps.add(grad_q_weight, grad_q_enc);

    return {
      encoder_grads: { dW: dW_enc, db: db_enc, dq: grad_q },
      path_grads,
      ensemble_grads: { dW_weight, db_weight },
      sampler_grads: { dW_out, db_out },
    };
  }

  /**
   * 훈련 스텝
   */
  train_step(
    query: Tensor,
    target_token: number,
    learning_rate: number = 0.001
  ): TrainingState {
    // 순전파
    const z = this.encoder.encode(query);
    const { z_a, z_b, z_c } = this.paths.execute_parallel(z);
    const w = this.ensemble.compute_weights(query);
    const ensemble = this.ensemble.combine(w, z_a, z_b, z_c);

    // 역전파
    const grads = this.backward(
      target_token,
      ensemble,
      query,
      z,
      z_a,
      z_b,
      z_c,
      w
    );

    // 가중치 업데이트
    this.encoder.update(
      grads.encoder_grads.dW,
      grads.encoder_grads.db,
      learning_rate
    );

    this.paths.update(
      grads.path_grads.dP_a,
      grads.path_grads.db_a,
      grads.path_grads.dP_b,
      grads.path_grads.db_b,
      grads.path_grads.dP_c,
      grads.path_grads.db_c,
      learning_rate
    );

    this.ensemble.update(
      grads.ensemble_grads.dW_weight,
      grads.ensemble_grads.db_weight,
      learning_rate
    );

    this.sampler.update(
      grads.sampler_grads.dW_out,
      grads.sampler_grads.db_out,
      learning_rate
    );

    // 손실 계산 (간단히: 표준편차의 역함수)
    const loss = TensorOps.std(ensemble);

    return {
      loss,
      accuracy: 0.5, // 플레이스홀더
      iteration: this.stats.total_executions,
      learning_rate,
    };
  }

  /**
   * 에포크 훈련
   */
  train_epoch(
    queries: Float64Array,
    targets: number[],
    batch_size: number,
    learning_rate: number = 0.001
  ): {
    avg_loss: number;
    iterations: number;
  } {
    let total_loss = 0;
    const num_batches = Math.ceil(targets.length / batch_size);
    const query_dim = this.config.query_dim;

    for (let batch = 0; batch < num_batches; batch++) {
      const start_idx = batch * batch_size;
      const end_idx = Math.min(start_idx + batch_size, targets.length);

      for (let i = start_idx; i < end_idx; i++) {
        const q_start = i * query_dim;
        const q = queries.slice(q_start, q_start + query_dim);

        const state = this.train_step(q, targets[i], learning_rate);
        total_loss += state.loss;
      }
    }

    return {
      avg_loss: total_loss / targets.length,
      iterations: targets.length,
    };
  }

  /**
   * 모델 저장
   */
  save(): {
    encoder: ReturnType<typeof QueryEncoder.prototype.serialize>;
    paths: ReturnType<typeof PathExecutor.prototype.serialize>;
    ensemble: ReturnType<typeof EnsembleModule.prototype.serialize>;
    sampler: ReturnType<typeof Sampler.prototype.serialize>;
  } {
    return {
      encoder: this.encoder.serialize(),
      paths: this.paths.serialize(),
      ensemble: this.ensemble.serialize(),
      sampler: this.sampler.serialize(),
    };
  }

  /**
   * 모델 복원
   */
  static load(
    data: ReturnType<typeof PostMindLangRuntimeCore.prototype.save>,
    config?: Partial<RuntimeConfig>
  ): PostMindLangRuntimeCore {
    const runtime = new PostMindLangRuntimeCore(config);
    runtime.encoder = QueryEncoder.deserialize(data.encoder);
    runtime.paths = PathExecutor.deserialize(data.paths);
    runtime.ensemble = EnsembleModule.deserialize(data.ensemble);
    runtime.sampler = Sampler.deserialize(data.sampler);
    return runtime;
  }

  /**
   * 디버깅 정보
   */
  debug_info(): string {
    return (
      `PostMindLangRuntime:\n` +
      `  ${this.encoder.debug_info()}\n` +
      `  ${this.paths.debug_info()}\n` +
      `  ${this.ensemble.debug_info()}\n` +
      `  ${this.sampler.debug_info()}\n` +
      `Stats:\n` +
      `  Total Executions: ${this.stats.total_executions}\n` +
      `  Total Refinements: ${this.stats.total_refinements}\n` +
      `  Avg Confidence: ${this.stats.avg_confidence.toFixed(4)}\n` +
      `  Avg Iterations: ${this.stats.avg_iterations.toFixed(2)}`
    );
  }

  /**
   * 런타임 상태 확인
   */
  health_check(): {
    encoder: boolean;
    paths: boolean;
    ensemble: boolean;
    sampler: boolean;
    overall: boolean;
  } {
    const tests = {
      encoder: true,
      paths: true,
      ensemble: true,
      sampler: true,
    };

    try {
      // 인코더 테스트
      const q = TensorOps.randn(this.config.query_dim);
      const z = this.encoder.encode(q);
      tests.encoder = z.length === this.config.encoder_dim;

      // 경로 테스트
      const { z_a, z_b, z_c } = this.paths.execute_parallel(z);
      tests.paths =
        z_a.length === this.config.path_dim &&
        z_b.length === this.config.path_dim &&
        z_c.length === this.config.path_dim;

      // 앙상블 테스트
      const w = this.ensemble.compute_weights(q);
      tests.ensemble =
        w.length === 3 && Math.abs(TensorOps.sum(w) - 1.0) < 1e-6;

      // 샘플러 테스트
      const e = this.ensemble.combine(w, z_a, z_b, z_c);
      const sample = this.sampler.sample(e);
      tests.sampler =
        sample.token >= 0 && sample.token < this.config.vocab_size;
    } catch (e) {
      return {
        encoder: false,
        paths: false,
        ensemble: false,
        sampler: false,
        overall: false,
      };
    }

    return {
      ...tests,
      overall: Object.values(tests).every((v) => v),
    };
  }
}
