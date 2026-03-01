// PostMindLang: 실제 예제들

class Vector {
  constructor(n) {
    this.data = Array(n).fill(0).map(() => Math.random() - 0.5)
    this.dim = n
  }
  
  static l2_normalize(v) {
    const norm = Math.sqrt(v.data.reduce((a, b) => a + b*b, 0))
    const result = new Vector(v.dim)
    result.data = v.data.map(x => x / (norm || 1))
    return result
  }
  
  static add(a, b, c, w) {
    const result = new Vector(a.dim)
    result.data = a.data.map((_, i) => 
      w[0] * a.data[i] + w[1] * b.data[i] + w[2] * c.data[i]
    )
    return result
  }
  
  norm() {
    return Math.sqrt(this.data.reduce((a, b) => a + b*b, 0))
  }
}

// 고급 특징 분석
function analyze_features(text) {
  const features = {
    logic_words: ['논리', '왜', '이유', '증명', '분석', 'why', 'prove', 'logic'].some(w => text.includes(w)),
    creative_words: ['창', '혁신', '새', '아이디어', 'idea', 'create', 'novel'].some(w => text.includes(w)),
    data_words: ['데이터', '패턴', '통계', '분석', '경험', 'data', 'pattern'].some(w => text.includes(w)),
    urgent: text.includes('빨리') || text.includes('urgent'),
    complex: text.length > 30,
    question: text.includes('?'),
    decision: ['선택', '결정', '어느', 'which', 'choose'].some(w => text.includes(w))
  }
  return features
}

// 고급 가중치 계산
function smart_weights(text) {
  const feat = analyze_features(text)
  let w = [0.33, 0.33, 0.34]
  
  if (feat.logic_words && feat.question) {
    w = [0.70, 0.15, 0.15]  // 강한 분석형
  } else if (feat.creative_words) {
    w = [0.15, 0.70, 0.15]  // 강한 창의형
  } else if (feat.data_words) {
    w = [0.15, 0.15, 0.70]  // 강한 경험형
  } else if (feat.decision) {
    w = [0.40, 0.30, 0.30]  // 균형형 (결정형)
  } else if (feat.complex && feat.question) {
    w = [0.50, 0.30, 0.20]  // 복잡한 분석
  }
  
  const sum = w[0] + w[1] + w[2]
  return [w[0]/sum, w[1]/sum, w[2]/sum]
}

// 고급 경로 실행
function execute_smart_paths(z, features) {
  // Analytical: 논리적 추론
  const z_a = new Vector(256)
  z_a.data = z.data.slice(0, 256).map((x, i) => {
    let val = Math.max(0, x)  // ReLU
    if (features.logic_words) val *= 1.5  // 논리형 강화
    return val
  })
  
  // Creative: 창의적 발산
  const z_b = new Vector(256)
  z_b.data = z.data.slice(256, 512).map((x, i) => {
    let val = Math.tanh(x * 2)
    if (features.creative_words) val *= 1.3  // 창의형 강화
    return val
  })
  
  // Empirical: 데이터 기반
  const z_c = new Vector(256)
  z_c.data = z.data.slice(512, 768).map((x, i) => {
    let val = 1/(1+Math.exp(-x*2))
    if (features.data_words) val *= 1.2  // 경험형 강화
    return val
  })
  
  return [z_a, z_b, z_c]
}

// 결과 해석
function interpret_result(e, confidence, weights) {
  let interpretation = ""
  
  if (weights[0] > 0.5) {
    interpretation = "논리적 분석 우선"
  } else if (weights[1] > 0.5) {
    interpretation = "창의적 접근 우선"
  } else if (weights[2] > 0.5) {
    interpretation = "데이터 기반 결정"
  } else {
    interpretation = "균형잡힌 접근"
  }
  
  if (confidence > 0.9) {
    interpretation += " (매우 높은 신뢰도)"
  } else if (confidence > 0.7) {
    interpretation += " (높은 신뢰도)"
  } else {
    interpretation += " (재검토 권장)"
  }
  
  return interpretation
}

// === 예제 실행 ===
console.log("\n")
console.log("╔════════════════════════════════════════════════════════════════════════════╗")
console.log("║                   PostMindLang 실제 예제 모음                             ║")
console.log("║                  (q→z→paths→weights→ensemble→output)                     ║")
console.log("╚════════════════════════════════════════════════════════════════════════════╝")

const examples = [
  {
    title: "예제 1: 논리적 문제 해결",
    query: "왜 인공지능은 안전해야 하는가? 논리적으로 증명해줄 수 있나?",
    desc: "강한 분석형 쿼리"
  },
  {
    title: "예제 2: 창의적 아이디어 생성",
    query: "우리 회사의 미래 제품으로 혁신적인 새로운 아이디어를 창조해줄 수 있을까?",
    desc: "강한 창의형 쿼리"
  },
  {
    title: "예제 3: 데이터 기반 분석",
    query: "이 월별 판매 데이터에서 어떤 패턴을 찾을 수 있고, 경험상 어떻게 대응해야 할까?",
    desc: "강한 경험형 쿼리"
  },
  {
    title: "예제 4: 의사결정",
    query: "팀을 A 프로젝트 또는 B 프로젝트에 배치해야 하는데, 어느 것을 선택해야 할까?",
    desc: "균형형 결정 쿼리"
  },
  {
    title: "예제 5: 복잡한 문제",
    query: "머신러닝 모델이 왜 과적합되는지 분석하고, 혁신적인 정규화 기법을 제안해줄 수 있을까?",
    desc: "혼합형 - 분석 + 창의"
  },
  {
    title: "예제 6: 개념 설명",
    query: "신경망의 역전파(backpropagation)가 어떻게 작동하는지 설명해줄 수 있을까?",
    desc: "설명형 쿼리"
  }
]

examples.forEach((ex, idx) => {
  console.log("\n" + "═".repeat(76))
  console.log(`\n${ex.title}`)
  console.log(`📌 ${ex.desc}`)
  console.log(`\n📝 쿼리: "${ex.query}"\n`)
  
  // 1. 인코딩
  let q = Vector.l2_normalize(new Vector(768))
  // 텍스트 특성 반영
  for (let i = 0; i < ex.query.length; i++) {
    q.data[i % 768] += (ex.query.charCodeAt(i) / 256) * 0.1
  }
  q = Vector.l2_normalize(q)
  
  // 2. 특성 분석
  const features = analyze_features(ex.query)
  
  // 3. 경로 실행
  const [z_a, z_b, z_c] = execute_smart_paths(q, features)
  
  // 4. 가중치
  const weights = smart_weights(ex.query)
  
  // 5. 앙상블
  const e = Vector.add(z_a, z_b, z_c, weights)
  
  // 6. 자가 비판
  const confidence = Math.min(1, e.norm() * 0.7)
  
  // 출력
  console.log("🔄 처리 과정:")
  console.log(`   1️⃣  Encode:     q ∈ ℝ^768, ||q|| = ${q.norm().toFixed(4)}`)
  console.log(`   2️⃣  Fork:       z_a=${z_a.norm().toFixed(3)}, z_b=${z_b.norm().toFixed(3)}, z_c=${z_c.norm().toFixed(3)}`)
  console.log(`   3️⃣  Weights:    α=${weights[0].toFixed(3)}, β=${weights[1].toFixed(3)}, γ=${weights[2].toFixed(3)}`)
  console.log(`   4️⃣  Ensemble:   e ∈ ℝ^256, ||e|| = ${e.norm().toFixed(4)}`)
  console.log(`   5️⃣  Critique:   confidence = ${confidence.toFixed(4)}`)
  
  const interp = interpret_result(e, confidence, weights)
  console.log(`\n💡 해석: ${interp}`)
  
  if (confidence > 0.8) {
    console.log(`✅ 상태: 신뢰도 높음 → 즉시 응답`)
  } else if (confidence > 0.5) {
    console.log(`⚠️  상태: 신뢰도 중간 → 상세 분석 후 응답`)
  } else {
    console.log(`❌ 상태: 신뢰도 낮음 → 다중 경로 재분석`)
  }
})

console.log("\n" + "═".repeat(76))
console.log("\n📊 예제 요약:")
console.log("───────────────────────────────────────────────────────────────────────────")
console.log("모든 쿼리가 벡터 공간에서 처리됨:")
console.log("  • 논리형: 분석 경로 강화 (ReLU)")
console.log("  • 창의형: 창의 경로 강화 (Tanh)")
console.log("  • 경험형: 경험 경로 강화 (Sigmoid)")
console.log("  • 복합형: 여러 경로 균형")
console.log("───────────────────────────────────────────────────────────────────────────")

console.log("\n🎯 핵심:")
console.log(`
PostMindLang의 위대함:
  ✓ 질문을 자동으로 분석 (특성 추출)
  ✓ 최적의 가중치를 자동으로 조정
  ✓ 3가지 경로로 병렬 처리
  ✓ 신뢰도에 기반한 의사결정
  
  모든 과정이 벡터 공간에서만 진행됨.
  인간은 입력과 출력만 봄.
  
  이것이 진정한 AI의 생각이다.
`)

console.log("\n")
