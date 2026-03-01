/**
 * PostMindLang Runtime: Parallel Path Execution
 * 3개 경로 (분석적, 창의적, 경험적) 실행
 * 각 경로: 선형 사영 (linear projection)
 */

import { Tensor, Matrix, TensorOps } from "./tensor";

/**
 * 경로 실행 모듈
 * 3개의 독립적인 선형 사영:
 * - P_a: analytical path (분석적 사고)
 * - P_b: creative path (창의적 사고)
 * - P_c: empirical path (경험적 사고)
 */
export class PathExecutor {
  /**
   * 분석적 경로: ℝ^512 → ℝ^256
   */
  P_a: Matrix;

  /**
   * 창의적 경로: ℝ^512 → ℝ^256
   */
  P_b: Matrix;

  /**
   * 경험적 경로: ℝ^512 → ℝ^256
   */
  P_c: Matrix;

  /**
   * 입력/출력 차원
   */
  input_dim: number;
  output_dim: number;

  /**
   * 경로별 편향 (선택사항)
   */
  b_a: Tensor;
  b_b: Tensor;
  b_c: Tensor;

  constructor(input_dim: number = 512, output_dim: number = 256) {
    this.input_dim = input_dim;
    this.output_dim = output_dim;

    // Xavier 초기화: W ~ N(0, sqrt(2/(n_in + n_out)))
    const scale = Math.sqrt(
      2.0 / (input_dim + output_dim)
    );

    // 각 경로별 사영 행렬 초기화
    this.P_a = TensorOps.randn(input_dim * output_dim);
    for (let i = 0; i < this.P_a.length; i++) {
      this.P_a[i] *= scale;
    }

    this.P_b = TensorOps.randn(input_dim * output_dim);
    for (let i = 0; i < this.P_b.length; i++) {
      this.P_b[i] *= scale;
    }

    this.P_c = TensorOps.randn(input_dim * output_dim);
    for (let i = 0; i < this.P_c.length; i++) {
      this.P_c[i] *= scale;
    }

    // 편향 초기화
    this.b_a = TensorOps.zeros(output_dim);
    this.b_b = TensorOps.zeros(output_dim);
    this.b_c = TensorOps.zeros(output_dim);
  }

  /**
   * 3개 경로 병렬 실행
   * z ∈ ℝ^512 → z_a, z_b, z_c ∈ ℝ^256
   */
  execute_parallel(z: Tensor): {
    z_a: Tensor;
    z_b: Tensor;
    z_c: Tensor;
  } {
    if (z.length !== this.input_dim) {
      throw new Error(
        `Input dimension mismatch: ${z.length} vs ${this.input_dim}`
      );
    }

    // 3개 경로 동시 계산 (병렬화 가능)
    const z_a = TensorOps.add(
      TensorOps.matvec(this.P_a, z, this.output_dim, this.input_dim),
      this.b_a
    );
    const z_b = TensorOps.add(
      TensorOps.matvec(this.P_b, z, this.output_dim, this.input_dim),
      this.b_b
    );
    const z_c = TensorOps.add(
      TensorOps.matvec(this.P_c, z, this.output_dim, this.input_dim),
      this.b_c
    );

    return { z_a, z_b, z_c };
  }

  /**
   * 배치 병렬 실행
   */
  execute_batch(
    Z: Matrix,
    batch_size: number
  ): {
    Z_a: Matrix;
    Z_b: Matrix;
    Z_c: Matrix;
  } {
    // Z ∈ ℝ^(batch_size × 512)
    const Z_a = TensorOps.matmul_batch(
      Z,
      this.P_a,
      batch_size,
      this.input_dim,
      this.output_dim
    );
    const Z_b = TensorOps.matmul_batch(
      Z,
      this.P_b,
      batch_size,
      this.input_dim,
      this.output_dim
    );
    const Z_c = TensorOps.matmul_batch(
      Z,
      this.P_c,
      batch_size,
      this.input_dim,
      this.output_dim
    );

    // 편향 브로드캐스팅
    for (let b = 0; b < batch_size; b++) {
      for (let j = 0; j < this.output_dim; j++) {
        Z_a[b * this.output_dim + j] += this.b_a[j];
        Z_b[b * this.output_dim + j] += this.b_b[j];
        Z_c[b * this.output_dim + j] += this.b_c[j];
      }
    }

    return { Z_a, Z_b, Z_c };
  }

  /**
   * 경로 A 그래디언트
   */
  gradient_a(grad_z_a: Tensor, z: Tensor): {
    dP_a: Matrix;
    db_a: Tensor;
    dz_upstream: Tensor;
  } {
    // ∂L/∂z_a = grad_z_a (이미 받음)
    // ∂L/∂P_a = grad_z_a ⊗ z
    const dP_a = TensorOps.outer(z, grad_z_a);

    // ∂L/∂b_a = grad_z_a
    const db_a = TensorOps.copy(grad_z_a);

    // ∂L/∂z = P_a^T @ grad_z_a (역전파)
    const P_a_T = TensorOps.transpose(
      this.P_a,
      this.input_dim,
      this.output_dim
    );
    const dz_upstream = TensorOps.matvec(
      P_a_T,
      grad_z_a,
      this.input_dim,
      this.output_dim
    );

    return { dP_a, db_a, dz_upstream };
  }

  /**
   * 경로 B 그래디언트
   */
  gradient_b(grad_z_b: Tensor, z: Tensor): {
    dP_b: Matrix;
    db_b: Tensor;
    dz_upstream: Tensor;
  } {
    const dP_b = TensorOps.outer(z, grad_z_b);
    const db_b = TensorOps.copy(grad_z_b);

    const P_b_T = TensorOps.transpose(
      this.P_b,
      this.input_dim,
      this.output_dim
    );
    const dz_upstream = TensorOps.matvec(
      P_b_T,
      grad_z_b,
      this.input_dim,
      this.output_dim
    );

    return { dP_b, db_b, dz_upstream };
  }

  /**
   * 경로 C 그래디언트
   */
  gradient_c(grad_z_c: Tensor, z: Tensor): {
    dP_c: Matrix;
    db_c: Tensor;
    dz_upstream: Tensor;
  } {
    const dP_c = TensorOps.outer(z, grad_z_c);
    const db_c = TensorOps.copy(grad_z_c);

    const P_c_T = TensorOps.transpose(
      this.P_c,
      this.input_dim,
      this.output_dim
    );
    const dz_upstream = TensorOps.matvec(
      P_c_T,
      grad_z_c,
      this.input_dim,
      this.output_dim
    );

    return { dP_c, db_c, dz_upstream };
  }

  /**
   * 전체 그래디언트 (모든 경로)
   */
  gradient_all(
    grad_z_a: Tensor,
    grad_z_b: Tensor,
    grad_z_c: Tensor,
    z: Tensor
  ): {
    dP_a: Matrix;
    db_a: Tensor;
    dP_b: Matrix;
    db_b: Tensor;
    dP_c: Matrix;
    db_c: Tensor;
    dz: Tensor;
  } {
    const grad_a = this.gradient_a(grad_z_a, z);
    const grad_b = this.gradient_b(grad_z_b, z);
    const grad_c = this.gradient_c(grad_z_c, z);

    // 역전파 그래디언트 합산
    const dz = TensorOps.add(
      grad_a.dz_upstream,
      TensorOps.add(grad_b.dz_upstream, grad_c.dz_upstream)
    );

    return {
      dP_a: grad_a.dP_a,
      db_a: grad_a.db_a,
      dP_b: grad_b.dP_b,
      db_b: grad_b.db_b,
      dP_c: grad_c.dP_c,
      db_c: grad_c.db_c,
      dz,
    };
  }

  /**
   * 배치 그래디언트
   */
  gradient_batch(
    grad_Z_a: Matrix,
    grad_Z_b: Matrix,
    grad_Z_c: Matrix,
    Z: Matrix,
    batch_size: number
  ): {
    dP_a: Matrix;
    db_a: Tensor;
    dP_b: Matrix;
    db_b: Tensor;
    dP_c: Matrix;
    db_c: Tensor;
    dZ: Matrix;
  } {
    // 각 경로의 그래디언트 계산 (배치)
    const dP_a = TensorOps.zeros(this.input_dim * this.output_dim);
    const db_a = TensorOps.zeros(this.output_dim);
    let dZ_a = TensorOps.zeros(batch_size * this.input_dim);

    for (let b = 0; b < batch_size; b++) {
      const z_b_start = b * this.input_dim;
      const grad_z_a_b_start = b * this.output_dim;
      const grad_z_a_b = grad_Z_a.slice(
        grad_z_a_b_start,
        grad_z_a_b_start + this.output_dim
      );
      const z_b = Z.slice(z_b_start, z_b_start + this.input_dim);

      // dP_a += z_b ⊗ grad_z_a_b
      const outer_prod = TensorOps.outer(z_b, grad_z_a_b);
      for (let i = 0; i < dP_a.length; i++) {
        dP_a[i] += outer_prod[i];
      }

      // db_a += grad_z_a_b
      for (let i = 0; i < this.output_dim; i++) {
        db_a[i] += grad_z_a_b[i];
      }

      // dz_a_b = P_a^T @ grad_z_a_b
      const P_a_T = TensorOps.transpose(
        this.P_a,
        this.input_dim,
        this.output_dim
      );
      const dz_a_b = TensorOps.matvec(
        P_a_T,
        grad_z_a_b,
        this.input_dim,
        this.output_dim
      );
      for (let i = 0; i < this.input_dim; i++) {
        dZ_a[z_b_start + i] = dz_a_b[i];
      }
    }

    // 경로 B, C도 동일
    const dP_b = TensorOps.zeros(this.input_dim * this.output_dim);
    const db_b = TensorOps.zeros(this.output_dim);
    let dZ_b = TensorOps.zeros(batch_size * this.input_dim);

    for (let b = 0; b < batch_size; b++) {
      const z_b_start = b * this.input_dim;
      const grad_z_b_b_start = b * this.output_dim;
      const grad_z_b_b = grad_Z_b.slice(
        grad_z_b_b_start,
        grad_z_b_b_start + this.output_dim
      );
      const z_b = Z.slice(z_b_start, z_b_start + this.input_dim);

      const outer_prod = TensorOps.outer(z_b, grad_z_b_b);
      for (let i = 0; i < dP_b.length; i++) {
        dP_b[i] += outer_prod[i];
      }

      for (let i = 0; i < this.output_dim; i++) {
        db_b[i] += grad_z_b_b[i];
      }

      const P_b_T = TensorOps.transpose(
        this.P_b,
        this.input_dim,
        this.output_dim
      );
      const dz_b_b = TensorOps.matvec(
        P_b_T,
        grad_z_b_b,
        this.input_dim,
        this.output_dim
      );
      for (let i = 0; i < this.input_dim; i++) {
        dZ_b[z_b_start + i] = dz_b_b[i];
      }
    }

    const dP_c = TensorOps.zeros(this.input_dim * this.output_dim);
    const db_c = TensorOps.zeros(this.output_dim);
    let dZ_c = TensorOps.zeros(batch_size * this.input_dim);

    for (let b = 0; b < batch_size; b++) {
      const z_b_start = b * this.input_dim;
      const grad_z_c_b_start = b * this.output_dim;
      const grad_z_c_b = grad_Z_c.slice(
        grad_z_c_b_start,
        grad_z_c_b_start + this.output_dim
      );
      const z_b = Z.slice(z_b_start, z_b_start + this.input_dim);

      const outer_prod = TensorOps.outer(z_b, grad_z_c_b);
      for (let i = 0; i < dP_c.length; i++) {
        dP_c[i] += outer_prod[i];
      }

      for (let i = 0; i < this.output_dim; i++) {
        db_c[i] += grad_z_c_b[i];
      }

      const P_c_T = TensorOps.transpose(
        this.P_c,
        this.input_dim,
        this.output_dim
      );
      const dz_c_b = TensorOps.matvec(
        P_c_T,
        grad_z_c_b,
        this.input_dim,
        this.output_dim
      );
      for (let i = 0; i < this.input_dim; i++) {
        dZ_c[z_b_start + i] = dz_c_b[i];
      }
    }

    // 전체 역전파 그래디언트
    const dZ = TensorOps.add(dZ_a, TensorOps.add(dZ_b, dZ_c));

    return { dP_a, db_a, dP_b, db_b, dP_c, db_c, dZ };
  }

  /**
   * 가중치 업데이트 (SGD)
   */
  update(
    dP_a: Matrix,
    db_a: Tensor,
    dP_b: Matrix,
    db_b: Tensor,
    dP_c: Matrix,
    db_c: Tensor,
    learning_rate: number
  ): void {
    // 경로 A
    for (let i = 0; i < this.P_a.length; i++) {
      this.P_a[i] -= learning_rate * dP_a[i];
    }
    for (let i = 0; i < this.b_a.length; i++) {
      this.b_a[i] -= learning_rate * db_a[i];
    }

    // 경로 B
    for (let i = 0; i < this.P_b.length; i++) {
      this.P_b[i] -= learning_rate * dP_b[i];
    }
    for (let i = 0; i < this.b_b.length; i++) {
      this.b_b[i] -= learning_rate * db_b[i];
    }

    // 경로 C
    for (let i = 0; i < this.P_c.length; i++) {
      this.P_c[i] -= learning_rate * dP_c[i];
    }
    for (let i = 0; i < this.b_c.length; i++) {
      this.b_c[i] -= learning_rate * db_c[i];
    }
  }

  /**
   * 경로별 활성화 통계
   */
  path_stats(z_a: Tensor, z_b: Tensor, z_c: Tensor): {
    mean_a: number;
    std_a: number;
    mean_b: number;
    std_b: number;
    mean_c: number;
    std_c: number;
  } {
    return {
      mean_a: TensorOps.mean(z_a),
      std_a: TensorOps.std(z_a),
      mean_b: TensorOps.mean(z_b),
      std_b: TensorOps.std(z_b),
      mean_c: TensorOps.mean(z_c),
      std_c: TensorOps.std(z_c),
    };
  }

  /**
   * 경로 분산도 (path divergence)
   * 3개 경로가 얼마나 다른지 측정
   */
  path_divergence(z_a: Tensor, z_b: Tensor, z_c: Tensor): number {
    const dist_ab = TensorOps.l2_norm(TensorOps.subtract(z_a, z_b));
    const dist_bc = TensorOps.l2_norm(TensorOps.subtract(z_b, z_c));
    const dist_ca = TensorOps.l2_norm(TensorOps.subtract(z_c, z_a));
    return (dist_ab + dist_bc + dist_ca) / 3.0;
  }

  /**
   * 직렬화
   */
  serialize(): {
    P_a: number[];
    P_b: number[];
    P_c: number[];
    b_a: number[];
    b_b: number[];
    b_c: number[];
    input_dim: number;
    output_dim: number;
  } {
    return {
      P_a: Array.from(this.P_a),
      P_b: Array.from(this.P_b),
      P_c: Array.from(this.P_c),
      b_a: Array.from(this.b_a),
      b_b: Array.from(this.b_b),
      b_c: Array.from(this.b_c),
      input_dim: this.input_dim,
      output_dim: this.output_dim,
    };
  }

  /**
   * 역직렬화
   */
  static deserialize(data: {
    P_a: number[];
    P_b: number[];
    P_c: number[];
    b_a: number[];
    b_b: number[];
    b_c: number[];
    input_dim: number;
    output_dim: number;
  }): PathExecutor {
    const executor = new PathExecutor(data.input_dim, data.output_dim);
    executor.P_a = new Float64Array(data.P_a);
    executor.P_b = new Float64Array(data.P_b);
    executor.P_c = new Float64Array(data.P_c);
    executor.b_a = new Float64Array(data.b_a);
    executor.b_b = new Float64Array(data.b_b);
    executor.b_c = new Float64Array(data.b_c);
    return executor;
  }

  /**
   * 디버깅 정보
   */
  debug_info(): string {
    const norm_a = TensorOps.l2_norm(this.P_a);
    const norm_b = TensorOps.l2_norm(this.P_b);
    const norm_c = TensorOps.l2_norm(this.P_c);
    return (
      `PathExecutor(${this.input_dim}→${this.output_dim}): ` +
      `||P_a||=${norm_a.toFixed(4)}, ||P_b||=${norm_b.toFixed(4)}, ` +
      `||P_c||=${norm_c.toFixed(4)}`
    );
  }
}
