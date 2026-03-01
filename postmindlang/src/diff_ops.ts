/**
 * PostMindLang Runtime: Differentiable Operations
 * 미분 가능한 연산들과 역전파 구현
 */

import { Tensor, Matrix, TensorOps } from "./tensor";

/**
 * 역전파 함수 타입
 */
export type BackwardFn = (grad_output: Tensor) => {
  [key: string]: Tensor | Matrix;
};

/**
 * 계산 그래프 노드
 */
export interface ComputeNode {
  value: Tensor | Matrix;
  backward: BackwardFn;
  inputs: ComputeNode[];
  operation: string;
}

/**
 * 테이프 기반 자동 미분
 */
export class ComputationGraph {
  nodes: ComputeNode[] = [];
  tape: ComputeNode[] = [];

  /**
   * 순전파
   */
  forward_pass(
    input: Tensor,
    operations: Array<(x: Tensor) => { result: Tensor; backward: BackwardFn }>
  ): Tensor {
    let current = input;
    for (const op of operations) {
      const { result, backward } = op(current);
      const node: ComputeNode = {
        value: result,
        backward,
        inputs: [],
        operation: "custom",
      };
      this.tape.push(node);
      current = result;
    }
    return current;
  }

  /**
   * 역전파
   */
  backward(loss_gradient: Tensor): void {
    let grad = loss_gradient;
    for (let i = this.tape.length - 1; i >= 0; i--) {
      const node = this.tape[i];
      const grads = node.backward(grad);
      grad = grads.input as Tensor;
    }
  }

  /**
   * 그래프 초기화
   */
  reset(): void {
    this.nodes = [];
    this.tape = [];
  }
}

/**
 * 미분 가능한 연산 라이브러리
 */
export class DifferentiableOps {
  /**
   * ReLU: y = max(0, x), ∂y/∂x = x > 0 ? 1 : 0
   */
  static relu(x: Tensor): { result: Tensor; backward: BackwardFn } {
    const y = TensorOps.relu(x);

    const backward: BackwardFn = (grad_y: Tensor) => {
      const grad_x = TensorOps.grad_relu(grad_y, x);
      return { input: grad_x };
    };

    return { result: y, backward };
  }

  /**
   * Sigmoid: y = 1/(1+exp(-x)), ∂y/∂x = y*(1-y)
   */
  static sigmoid(x: Tensor): {
    result: Tensor;
    backward: BackwardFn;
  } {
    const y = TensorOps.sigmoid(x);

    const backward: BackwardFn = (grad_y: Tensor) => {
      const grad_x = TensorOps.grad_sigmoid(grad_y, y);
      return { input: grad_x };
    };

    return { result: y, backward };
  }

  /**
   * Softmax: y_i = exp(x_i/τ)/Σexp(x_j/τ)
   */
  static softmax(x: Tensor, tau: number = 1.0): {
    result: Tensor;
    backward: BackwardFn;
  } {
    const y = TensorOps.softmax(x, tau);

    const backward: BackwardFn = (grad_y: Tensor) => {
      // Softmax 그래디언트: ∂L/∂x_i = y_i * (∂L/∂y_i - Σ y_j * ∂L/∂y_j)
      const grad_x = TensorOps.grad_softmax(grad_y, y);
      return { input: grad_x };
    };

    return { result: y, backward };
  }

  /**
   * 행렬-벡터 곱셈: y = A @ x
   */
  static matvec(A: Matrix, x: Tensor, m: number, n: number): {
    result: Tensor;
    backward: BackwardFn;
  } {
    const y = TensorOps.matvec(A, x, m, n);

    const backward: BackwardFn = (grad_y: Tensor) => {
      // ∂L/∂A = grad_y ⊗ x
      const grad_A = TensorOps.outer(x, grad_y);

      // ∂L/∂x = A^T @ grad_y
      const A_T = TensorOps.transpose(A, m, n);
      const grad_x = TensorOps.matvec(A_T, grad_y, n, m);

      return { A: grad_A, x: grad_x };
    };

    return { result: y, backward };
  }

  /**
   * 벡터 덧셈: c = a + b
   */
  static add(a: Tensor, b: Tensor): {
    result: Tensor;
    backward: BackwardFn;
  } {
    const c = TensorOps.add(a, b);

    const backward: BackwardFn = (grad_c: Tensor) => {
      // ∂L/∂a = grad_c
      // ∂L/∂b = grad_c
      return { a: TensorOps.copy(grad_c), b: TensorOps.copy(grad_c) };
    };

    return { result: c, backward };
  }

  /**
   * 스칼라 곱셈: b = α * a
   */
  static scale(a: Tensor, alpha: number): {
    result: Tensor;
    backward: BackwardFn;
  } {
    const b = TensorOps.scale(a, alpha);

    const backward: BackwardFn = (grad_b: Tensor) => {
      // ∂L/∂a = α * grad_b
      const grad_a = TensorOps.scale(grad_b, alpha);
      return { a: grad_a, alpha: TensorOps.dot(grad_b, a) };
    };

    return { result: b, backward };
  }

  /**
   * 내적: y = <a, b>
   */
  static dot(a: Tensor, b: Tensor): {
    result: number;
    backward: BackwardFn;
  } {
    const y = TensorOps.dot(a, b);

    const backward: BackwardFn = (grad_y: number) => {
      // ∂L/∂a = grad_y * b
      const grad_a = TensorOps.scale(b, grad_y);

      // ∂L/∂b = grad_y * a
      const grad_b = TensorOps.scale(a, grad_y);

      return { a: grad_a, b: grad_b };
    };

    return {
      result: y,
      backward: backward as BackwardFn,
    };
  }

  /**
   * 외적: C = a ⊗ b
   */
  static outer(a: Tensor, b: Tensor): {
    result: Matrix;
    backward: BackwardFn;
  } {
    const C = TensorOps.outer(a, b);

    const backward: BackwardFn = (grad_C: Matrix) => {
      // ∂L/∂a_i = Σ_j grad_C_ij * b_j
      const grad_a = new Float64Array(a.length);
      for (let i = 0; i < a.length; i++) {
        let sum = 0;
        for (let j = 0; j < b.length; j++) {
          sum += grad_C[i * b.length + j] * b[j];
        }
        grad_a[i] = sum;
      }

      // ∂L/∂b_j = Σ_i grad_C_ij * a_i
      const grad_b = new Float64Array(b.length);
      for (let j = 0; j < b.length; j++) {
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
          sum += grad_C[i * b.length + j] * a[i];
        }
        grad_b[j] = sum;
      }

      return { a: grad_a, b: grad_b };
    };

    return { result: C, backward };
  }

  /**
   * 원소별 곱셈: c = a ⊙ b
   */
  static elementwise_mult(a: Tensor, b: Tensor): {
    result: Tensor;
    backward: BackwardFn;
  } {
    const c = TensorOps.elementwise_mult(a, b);

    const backward: BackwardFn = (grad_c: Tensor) => {
      // ∂L/∂a = grad_c ⊙ b
      const grad_a = TensorOps.elementwise_mult(grad_c, b);

      // ∂L/∂b = grad_c ⊙ a
      const grad_b = TensorOps.elementwise_mult(grad_c, a);

      return { a: grad_a, b: grad_b };
    };

    return { result: c, backward };
  }

  /**
   * L2 노름: y = ||x||_2
   */
  static l2_norm(x: Tensor): {
    result: number;
    backward: BackwardFn;
  } {
    const y = TensorOps.l2_norm(x);

    const backward: BackwardFn = (grad_y: number) => {
      // ∂L/∂x = (grad_y / ||x||) * x
      const grad_x = TensorOps.scale(x, grad_y / (y + 1e-10));
      return { x: grad_x };
    };

    return {
      result: y,
      backward: backward as BackwardFn,
    };
  }

  /**
   * Exp: y = exp(x)
   */
  static exp(x: Tensor): { result: Tensor; backward: BackwardFn } {
    const y = TensorOps.exp(x);

    const backward: BackwardFn = (grad_y: Tensor) => {
      // ∂L/∂x = grad_y ⊙ y
      const grad_x = TensorOps.elementwise_mult(grad_y, y);
      return { x: grad_x };
    };

    return { result: y, backward };
  }

  /**
   * Log: y = log(x)
   */
  static log(x: Tensor): { result: Tensor; backward: BackwardFn } {
    const y = TensorOps.log(x);

    const backward: BackwardFn = (grad_y: Tensor) => {
      // ∂L/∂x = grad_y ÷ x
      const grad_x = TensorOps.elementwise_div(grad_y, x);
      return { x: grad_x };
    };

    return { result: y, backward };
  }
}

/**
 * 역전파 엔진 (역모드 자동 미분)
 */
export class ReverseMode {
  /**
   * 계산 테이프
   */
  tape: ComputeNode[] = [];

  /**
   * 변수 저장소
   */
  variables: Map<string, { value: Tensor | Matrix; grad: Tensor | Matrix }> =
    new Map();

  /**
   * 변수 생성
   */
  variable(
    name: string,
    value: Tensor | Matrix
  ): string {
    this.variables.set(name, {
      value: TensorOps.copy(value),
      grad: TensorOps.zeros(value.length),
    });
    return name;
  }

  /**
   * 순전파
   */
  forward(fn: (vars: typeof this.variables) => Tensor): Tensor {
    return fn(this.variables);
  }

  /**
   * 역전파 (변수 그래디언트 누적)
   */
  backward(loss_grad: Tensor): void {
    // 테이프의 역순으로 역전파
    for (let i = this.tape.length - 1; i >= 0; i--) {
      const node = this.tape[i];
      const grads = node.backward(loss_grad);

      // 반환된 그래디언트를 변수 저장소에 누적
      for (const [varName, grad] of Object.entries(grads)) {
        if (this.variables.has(varName)) {
          const varData = this.variables.get(varName)!;
          const varGrad = varData.grad as Float64Array;
          const gradArr = grad as Float64Array;
          const len = Math.min(varGrad.length, gradArr.length);
          for (let j = 0; j < len; j++) {
            varGrad[j] += gradArr[j];
          }
        }
      }
    }
  }

  /**
   * 그래디언트 조회
   */
  get_gradient(name: string): Tensor | Matrix | undefined {
    return this.variables.get(name)?.grad;
  }

  /**
   * 그래디언트 초기화
   */
  zero_grad(): void {
    for (const [_, var_data] of this.variables) {
      var_data.grad.fill(0);
    }
  }

  /**
   * 테이프 초기화
   */
  reset(): void {
    this.tape = [];
    this.variables.clear();
  }
}

/**
 * 수치 미분을 통한 그래디언트 검증
 */
export class GradientChecker {
  /**
   * 수치 그래디언트 계산
   */
  static numerical_gradient(
    fn: (x: Tensor) => number,
    x: Tensor,
    eps: number = 1e-5
  ): Tensor {
    const grad = new Float64Array(x.length);

    for (let i = 0; i < x.length; i++) {
      const x_plus = TensorOps.copy(x);
      const x_minus = TensorOps.copy(x);

      x_plus[i] += eps;
      x_minus[i] -= eps;

      const f_plus = fn(x_plus);
      const f_minus = fn(x_minus);

      grad[i] = (f_plus - f_minus) / (2 * eps);
    }

    return grad;
  }

  /**
   * 그래디언트 검증
   */
  static check_gradient(
    fn: (x: Tensor) => number,
    grad_fn: (x: Tensor) => Tensor,
    x: Tensor,
    eps: number = 1e-5,
    tolerance: number = 1e-3
  ): {
    passed: boolean;
    max_error: number;
    errors: number[];
  } {
    const grad_analytical = grad_fn(x);
    const grad_numerical = this.numerical_gradient(fn, x, eps);

    const errors: number[] = [];
    let max_error = 0;

    for (let i = 0; i < x.length; i++) {
      const error = Math.abs(
        grad_analytical[i] - grad_numerical[i]
      ) /
        (Math.abs(grad_analytical[i]) +
          Math.abs(grad_numerical[i]) +
          1e-8);
      errors.push(error);
      max_error = Math.max(max_error, error);
    }

    return {
      passed: max_error < tolerance,
      max_error,
      errors,
    };
  }

  /**
   * 배치 그래디언트 검증
   */
  static check_batch_gradient(
    fn: (X: Float64Array) => number,
    grad_fn: (X: Float64Array) => Float64Array,
    X: Float64Array,
    batch_size: number,
    sample_size: number = 10
  ): {
    passed: boolean;
    avg_error: number;
    max_error: number;
  } {
    let total_error = 0;
    let max_error = 0;

    for (let s = 0; s < sample_size; s++) {
      const i = Math.floor(Math.random() * X.length);

      const grad_analytical = grad_fn(X);
      const grad_numerical = this.numerical_gradient(fn, X);

      const error = Math.abs(
        grad_analytical[i] - grad_numerical[i]
      ) /
        (Math.abs(grad_analytical[i]) +
          Math.abs(grad_numerical[i]) +
          1e-8);
      total_error += error;
      max_error = Math.max(max_error, error);
    }

    const avg_error = total_error / sample_size;

    return {
      passed: max_error < 1e-3,
      avg_error,
      max_error,
    };
  }
}
