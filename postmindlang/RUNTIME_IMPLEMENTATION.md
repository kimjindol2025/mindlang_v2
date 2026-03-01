# PostMindLang Runtime Implementation

## 개요

**PostMindLang 런타임**은 순수 선형대수 기반의 완전히 미분 가능한 신경망 런타임입니다.

- **총 라인 수**: 3,802줄 (8개 모듈)
- **언어**: TypeScript
- **파일 위치**: `/data/data/com.termux/files/home/kim/mindlang/postmindlang/src/`

## 아키텍처

### 핵심 구성 요소

```
Query (768D)
    ↓
[Encoder] → z (512D)
    ↓
[3 Parallel Paths]
    ├→ Path A (Analytical) → z_a (256D)
    ├→ Path B (Creative) → z_b (256D)
    └→ Path C (Empirical) → z_c (256D)
    ↓
[Ensemble Module] → weights w = softmax(query)
    ↓
[Weighted Combination] → e = w·z_a + w·z_b + w·z_c (256D)
    ↓
[Critique Module] → confidence score, gradients
    ↓
[Refinement Loop] (if confidence < threshold)
    ↓
[Sampler] → token selection
    ↓
Output (token ID, probability)
```

---

## 모듈 상세 설명

### 1. `tensor.ts` (588줄)

**순수 벡터/행렬/텐서 연산**

#### 핵심 연산
- **기본**: `dot`, `matvec`, `matmul`, `transpose`
- **활성화**: `relu`, `sigmoid`, `softmax`
- **노름**: `l2_norm`, `l1_norm`, `max_norm`
- **통계**: `mean`, `std`, `normalize`
- **미분**: `grad_relu`, `grad_sigmoid`, `grad_softmax`

#### 특징
- 모든 데이터는 `Float64Array`로 저장 (수치 정밀도)
- 메모리 효율적인 flattened 행렬 표현
- 수치적으로 안정적인 softmax 구현 (overflow 방지)
- 기울기 검사 함수 포함

```typescript
// 예시
const a = TensorOps.randn(512);  // ℝ^512
const W = TensorOps.randn(256 * 512);  // ℝ^(256×512)
const y = TensorOps.matvec(W, a, 256, 512);  // ℝ^256
const norm = TensorOps.l2_norm(y);  // ℝ
```

---

### 2. `encoding.ts` (416줄)

**쿼리 인코딩 (ℝ^768 → ℝ^512)**

#### 클래스
- `QueryEncoder`: 단일 층 선형 인코더
- `DeepQueryEncoder`: 다층 인코더 (ReLU 활성화)

#### 주요 메서드
- `encode(q)`: 단일 쿼리 인코딩
- `encode_batch(Q)`: 배치 인코딩
- `gradient(grad_z, q)`: 역전파
- `update()`: SGD, Momentum, Adam 옵션

#### 구현 세부사항
```
z = W^T @ q + b

∂L/∂W = q ⊗ grad_z (외적)
∂L/∂b = grad_z (직접 전파)
∂L/∂q = W @ grad_z (역전파)
```

#### 최적화 기능
- He 초기화
- L1/L2 정규화 (weight decay)
- 그래디언트 클리핑
- 가중치 노름 계산

---

### 3. `paths.ts` (548줄)

**3개 경로 병렬 실행 (ℝ^512 → 3 × ℝ^256)**

#### 3개 경로
- **P_a**: 분석적 사고 (Analytical)
- **P_b**: 창의적 사고 (Creative)
- **P_c**: 경험적 사고 (Empirical)

#### 각 경로는 독립적인 선형 사영
```
z_a = P_a @ z + b_a
z_b = P_b @ z + b_b
z_c = P_c @ z + b_c
```

#### 주요 기능
- `execute_parallel(z)`: 3개 경로 동시 계산
- `execute_batch(Z)`: 배치 실행
- `gradient_all()`: 전체 그래디언트
- `path_divergence()`: 경로 분산도 측정

#### 역전파
```
dP_a = z ⊗ grad_z_a
db_a = grad_z_a
dz ↑ = P_a^T @ grad_z_a (다른 경로도 동일)
```

---

### 4. `ensemble.ts` (348줄)

**앙상블 (가중 합)**

#### 핵심 연산
```
w = softmax(f_weight(q))  // 동적 가중치
e = w[0]·z_a + w[1]·z_b + w[2]·z_c
```

#### 클래스
- `EnsembleModule`: 기본 앙상블
- `AdaptiveEnsembleModule`: 적응형 가중치 조정

#### 주요 메서드
- `compute_weights(q)`: 쿼리 기반 가중치
- `combine()`: 경로 결합
- `gradient()`: 역전파
- `weight_balance()`: 가중치 엔트로피

#### 고급 기능
- 신뢰도 기반 가중치 조정
- 그래디언트 크기 기반 가중치 조정
- 온도 스케줄링

---

### 5. `critique.ts` (377줄)

**자가 비판 (∇L 계산)**

#### 신뢰도 측정
```
confidence = max(0, 1 - ||∇L||_2 / normalization_factor)
```

#### 손실 함수 제공
- MSE (Mean Squared Error)
- L1 손실
- Cross-Entropy
- Huber 손실 (로버스트)

#### 주요 기능
- `critique()`: 손실값과 신뢰도 계산
- `refinement_score()`: 개선 필요도
- `gradient_stats()`: 그래디언트 분석
- `combined_critique()`: 다중 손실 결합

#### 고급 비판
- `AdvancedCritiqueModule`: 불확실성 추정 포함
- 다중 손실 함수 지원

---

### 6. `sampler.ts` (443줄)

**토큰 샘플링**

#### 샘플링 전략
1. **Greedy**: `argmax(p)` (confidence > threshold)
2. **Sampling**: 다항 분포에서 샘플 (confidence ≤ threshold)
3. **Top-K**: 상위 K개 토큰만 고려
4. **Top-P (Nucleus)**: 누적 확률이 P 초과 X

#### 구현
```typescript
logits = W_out @ ensemble + b_out
probs = softmax(logits / τ)

if max(probs) > threshold:
    token = argmax(probs)  // greedy
else:
    token = multinomial_sample(probs)
```

#### 주요 메서드
- `sample()`: 기본 샘플링
- `sample_top_k()`: Top-K 샘플링
- `sample_top_p()`: Nucleus 샘플링
- `entropy()`: 샘플링 다양성
- `top_tokens()`: 상위 토큰 조회

---

### 7. `diff_ops.ts` (508줄)

**미분 가능한 연산 및 자동 미분**

#### 핵심 클래스
- `DifferentiableOps`: 역전파 구현 연산
- `ComputationGraph`: 테이프 기반 자동 미분
- `ReverseMode`: 역모드 자동 미분
- `GradientChecker`: 수치 미분으로 검증

#### 지원 연산
```
relu(x) → y, ∂y/∂x
sigmoid(x) → y, ∂y/∂x
softmax(x) → y, ∂y/∂x
matvec(A, x) → y, ∂y/∂A, ∂y/∂x
add(a, b) → c, ∂c/∂a, ∂c/∂b
... (더 많은 연산)
```

#### 수치 미분 검증
```typescript
const check = GradientChecker.check_gradient(
    fn, grad_fn, x, eps=1e-5, tolerance=1e-3
);
// passed: boolean, max_error: number
```

---

### 8. `runtime.ts` (574줄)

**PostMindLang 런타임 (메인)**

#### 클래스: `PostMindLangRuntimeCore`

#### 핵심 메서드
- `execute(query)`: 단일 토큰 생성
- `generate(query, max_length)`: 시퀀스 생성
- `infer_batch()`: 배치 추론
- `train_step()`: 훈련 단계
- `train_epoch()`: 에포크 훈련

#### 실행 파이프라인 (`execute`)
```
1. 쿼리 인코딩: z = encoder(q)
2. 경로 실행: z_a, z_b, z_c = paths(z)
3. 가중치: w = ensemble.compute_weights(q)
4. 결합: e = ensemble.combine(w, z_a, z_b, z_c)
5. 비판: confidence, grad = critique(e, q)
6. 개선 (if confidence < threshold):
     - 그래디언트 상승: e' = e - α·grad
     - 반복: max_iterations=3
7. 샘플링: token = sampler.sample(e)
```

#### 훈련 파이프라인 (`train_step`)
```
1. 순전파: 모든 모듈 실행
2. 역전파: backward() 호출
3. 그래디언트 누적: 모든 파라미터
4. 가중치 업데이트: learning_rate 적용
```

#### 상태 저장/복원
```typescript
// 저장
const state = runtime.save();

// 복원
const runtime2 = PostMindLangRuntimeCore.load(state, config);
```

#### 헬스 체크
```typescript
const health = runtime.health_check();
// { encoder, paths, ensemble, sampler, overall }
```

---

## 수학적 기초

### 선형대수

#### 내적 (Inner Product)
```
<a, b> = Σ a_i * b_i
```

#### 행렬-벡터 곱셈
```
y = A @ x
y_i = Σ_j A_ij * x_j
```

#### 외적 (Outer Product)
```
C = a ⊗ b
C_ij = a_i * b_j
```

#### 행렬 전치
```
(A^T)_ij = A_ji
```

### 미분 계산

#### 연쇄 법칙 (Chain Rule)
```
∂L/∂x = ∂L/∂y * ∂y/∂x
```

#### 행렬-벡터 곱셈 그래디언트
```
L = f(y), y = A @ x

∂L/∂x = A^T @ (∂L/∂y)
∂L/∂A = (∂L/∂y) ⊗ x
```

#### ReLU
```
y = max(0, x)
∂y/∂x = x > 0 ? 1 : 0
```

#### Softmax
```
y_i = exp(x_i/τ) / Σ exp(x_j/τ)
∂L/∂x_i = y_i * (∂L/∂y_i - Σ y_j * ∂L/∂y_j)
```

---

## 사용 예시

### 기본 사용

```typescript
import { PostMindLangRuntimeCore, TensorOps } from './src';

// 런타임 초기화
const runtime = new PostMindLangRuntimeCore({
  query_dim: 768,
  encoder_dim: 512,
  path_dim: 256,
  vocab_size: 50257,
  temperature: 0.8,
  confidence_threshold: 0.8,
});

// 쿼리 생성
const query = TensorOps.randn(768);

// 단일 토큰 생성
const result = await runtime.execute(query);
console.log(`Token: ${result.token}, Confidence: ${result.confidence}`);
console.log(`Refined: ${result.refined}, Iterations: ${result.iterations}`);

// 시퀀스 생성
const { tokens, confidences } = await runtime.generate(query, 10);
console.log(`Generated tokens: ${tokens}`);
```

### 훈련

```typescript
const queries = new Float64Array(1000 * 768);  // 1000개 쿼리
const targets = new Array(1000).fill(0).map(() => Math.floor(Math.random() * 50257));

for (let epoch = 0; epoch < 10; epoch++) {
  const { avg_loss } = runtime.train_epoch(queries, targets, 32, 0.001);
  console.log(`Epoch ${epoch}: Loss = ${avg_loss}`);
}

// 모델 저장
const state = runtime.save();
console.log('Model saved');
```

### 모듈별 사용

```typescript
import { TensorOps, QueryEncoder, PathExecutor } from './src';

// 텐서 연산
const a = TensorOps.randn(512);
const b = TensorOps.randn(512);
const dot = TensorOps.dot(a, b);

// 인코더
const encoder = new QueryEncoder(768, 512);
const z = encoder.encode(a);

// 경로
const paths = new PathExecutor(512, 256);
const { z_a, z_b, z_c } = paths.execute_parallel(z);
```

---

## 성능 특성

### 복잡도 분석

| 연산 | 입력 | 출력 | 시간복잡도 |
|-----|------|------|-----------|
| dot(a, b) | ℝ^n, ℝ^n | ℝ | O(n) |
| matvec(A, x) | ℝ^(m×n), ℝ^n | ℝ^m | O(mn) |
| matmul(A, B) | ℝ^(m×k), ℝ^(k×n) | ℝ^(m×n) | O(mkn) |
| softmax(x) | ℝ^n | ℝ^n | O(n) |

### 메모리 사용

```
Encoder: 768 × 512 = 393,216 params
Paths: 3 × 512 × 256 = 393,216 params
Ensemble: 768 × 3 = 2,304 params
Sampler: 256 × 50,257 = 12,865,792 params

Total: ~13.6M 파라미터
```

---

## 디버깅 및 검증

### 헬스 체크

```typescript
const health = runtime.health_check();
if (!health.overall) {
  console.error('Runtime health check failed');
  console.log(`Encoder: ${health.encoder}`);
  console.log(`Paths: ${health.paths}`);
}
```

### 기울기 검증

```typescript
import { GradientChecker } from './src';

const fn = (x) => TensorOps.dot(x, x);
const grad_fn = (x) => TensorOps.scale(x, 2);
const x = TensorOps.randn(10);

const check = GradientChecker.check_gradient(fn, grad_fn, x);
console.log(`Gradient check passed: ${check.passed}`);
console.log(`Max error: ${check.max_error}`);
```

### 디버그 정보

```typescript
console.log(runtime.debug_info());
// PostMindLangRuntimeCore 상태 출력
// - 각 모듈의 가중치 노름
// - 실행 통계
// - 평균 신뢰도
```

---

## 주요 특징

1. **완전 미분 가능**: 모든 연산에 역전파 구현
2. **선형대수 기반**: 행렬/벡터 연산만 사용
3. **수치적 안정성**: overflow 방지, 정밀한 계산
4. **유연한 샘플링**: Greedy, Sampling, Top-K, Top-P
5. **적응형 개선**: 신뢰도 기반 반복 개선
6. **훈련 지원**: SGD, Momentum, Adam 옵션
7. **배치 처리**: 병렬 처리 최적화
8. **상태 저장/복원**: 직렬화 지원

---

## 파일 구조

```
postmindlang/src/
├── tensor.ts           (588줄) - 순수 선형대수
├── encoding.ts         (416줄) - 쿼리 인코딩
├── paths.ts            (548줄) - 3개 경로
├── ensemble.ts         (348줄) - 가중 합
├── critique.ts         (377줄) - 자가 비판
├── sampler.ts          (443줄) - 토큰 샘플링
├── diff_ops.ts         (508줄) - 자동 미분
├── runtime.ts          (574줄) - 메인 런타임
└── index.ts            - 모듈 export

총: 3,802줄
```

---

## 설정 옵션

```typescript
interface RuntimeConfig {
  query_dim: number;           // 입력 쿼리 차원 (기본: 768)
  encoder_dim: number;         // 인코더 출력 (기본: 512)
  path_dim: number;            // 경로 출력 (기본: 256)
  vocab_size: number;          // 어휘 크기 (기본: 50257)
  temperature: number;         // 소프트맥스 온도 (기본: 0.8)
  confidence_threshold: number; // 신뢰도 임계값 (기본: 0.8)
  max_iterations: number;      // 최대 반복 개선 (기본: 3)
}
```

---

## 라이센스

MIT License - PostMindLang Runtime 2026

---

**작성일**: 2026-02-20
**버전**: 1.0.0
**상태**: 완료 ✓
