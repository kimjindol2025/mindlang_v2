(* MindLang Agent Examples
   Practical use cases demonstrating the three-path reasoning system
   with adaptive weighting and ensemble voting

   This module shows:
   - Problem-solving example (analytical-heavy)
   - Creative design example (creative-heavy)
   - Data-driven example (empirical-heavy)
   - Real-world application scenarios
   - Adaptive path selection
*)

(* ============================================================================
   EXAMPLE 1: COMPLEX PROBLEM-SOLVING
   ============================================================================ *)

program example_problem_solving {
  query "How can I debug a complex multi-threaded application with race conditions?" -> problem

  result = solve_complex_problem(problem)

  return result
}

(* Solve complex problem with analytical focus *)
fn solve_complex_problem(problem: string) -> string {
  (* Initialize agent state *)
  z = encode_query(problem)

  (* Fork into three paths *)
  fork z -> {z_a, z_b, z_c}

  (* Execute paths - analytical will dominate *)
  analytical = execute_analytical_problem_solving(z_a, problem)
  creative = execute_creative_problem_approach(z_b, problem)
  empirical = execute_empirical_problem_method(z_c, problem)

  (* Compute weights - favor analytical for debugging *)
  weights = {
    analytical_weight: 0.6,
    creative_weight: 0.2,
    empirical_weight: 0.2,
    sum_normalized: 1.0,
    adaptation_basis: "problem_solving"
  }

  (* Combine results *)
  ensemble = combine_with_weights(analytical, creative, empirical, weights)

  (* Return final answer *)
  return ensemble
}

(* Analytical approach to problem-solving *)
fn execute_analytical_problem_solving(z: LatentVector, problem: string) -> Path {
  let steps = []

  (* Step 1: Problem decomposition *)
  steps = append(steps, "Step 1: Identify the core issue - race condition in multi-threaded code")
  steps = append(steps, "Step 2: Understand thread interaction points")
  steps = append(steps, "Step 3: Apply systematic debugging methodology")
  steps = append(steps, "Step 4: Use synchronization primitives analysis")
  steps = append(steps, "Step 5: Implement thread-safe patterns")
  steps = append(steps, "Step 6: Validate with tools like ThreadSanitizer")

  return {
    name: "analytical_debugging",
    pathway_type: "systematic_analysis",
    confidence: 0.90,
    result: z,
    quality_score: 0.90,
    reasoning_trace: steps,
    execution_time: 10.0
  }
}

(* Creative approach to problem-solving *)
fn execute_creative_problem_approach(z: LatentVector, problem: string) -> Path {
  let ideas = []

  ideas = append(ideas, "Idea 1: Use actor model to avoid shared state")
  ideas = append(ideas, "Idea 2: Implement immutable data structures")
  ideas = append(ideas, "Idea 3: Try lock-free algorithms")
  ideas = append(ideas, "Idea 4: Consider event-driven architecture")

  return {
    name: "creative_debugging",
    pathway_type: "innovative_patterns",
    confidence: 0.70,
    result: z,
    quality_score: 0.70,
    reasoning_trace: ideas,
    execution_time: 12.0
  }
}

(* Empirical approach to problem-solving *)
fn execute_empirical_problem_method(z: LatentVector, problem: string) -> Path {
  let precedents = []

  precedents = append(precedents, "Case 1: Similar issue in Java - used synchronized blocks")
  precedents = append(precedents, "Case 2: Python threading - GIL helped avoid race conditions")
  precedents = append(precedents, "Case 3: C++ - used mutex and condition variables")
  precedents = append(precedents, "Case 4: Go - used channels instead of shared memory")

  return {
    name: "empirical_debugging",
    pathway_type: "case_based",
    confidence: 0.80,
    result: z,
    quality_score: 0.80,
    reasoning_trace: precedents,
    execution_time: 11.0
  }
}

(* ============================================================================
   EXAMPLE 2: CREATIVE DESIGN CHALLENGE
   ============================================================================ *)

program example_creative_design {
  query "Design an innovative user interface for a voice-only AI assistant" -> challenge

  result = solve_creative_challenge(challenge)

  return result
}

(* Solve creative challenge with creative focus *)
fn solve_creative_challenge(challenge: string) -> string {
  (* Initialize *)
  z = encode_query(challenge)

  (* Fork *)
  fork z -> {z_a, z_b, z_c}

  (* Execute paths - creative will dominate *)
  analytical = execute_analytical_design_approach(z_a, challenge)
  creative = execute_creative_design_approach(z_b, challenge)
  empirical = execute_empirical_design_approach(z_c, challenge)

  (* Weights favor creativity *)
  weights = {
    analytical_weight: 0.25,
    creative_weight: 0.55,
    empirical_weight: 0.20,
    sum_normalized: 1.0,
    adaptation_basis: "creative_design"
  }

  (* Combine *)
  ensemble = combine_with_weights(analytical, creative, empirical, weights)

  return ensemble
}

(* Analytical design approach *)
fn execute_analytical_design_approach(z: LatentVector, challenge: string) -> Path {
  let analysis = []

  analysis = append(analysis, "Requirement 1: Hands-free operation")
  analysis = append(analysis, "Requirement 2: Natural language understanding")
  analysis = append(analysis, "Requirement 3: Clear audio feedback")
  analysis = append(analysis, "Requirement 4: Context awareness")
  analysis = append(analysis, "Constraint: No visual display available")

  return {
    name: "analytical_design",
    pathway_type: "requirement_analysis",
    confidence: 0.75,
    result: z,
    quality_score: 0.75,
    reasoning_trace: analysis,
    execution_time: 10.0
  }
}

(* Creative design approach *)
fn execute_creative_design_approach(z: LatentVector, challenge: string) -> Path {
  let innovations = []

  innovations = append(innovations, "Innovation 1: Use ambient sound as visual proxy")
  innovations = append(innovations, "Innovation 2: 3D spatial audio for spatial awareness")
  innovations = append(innovations, "Innovation 3: Multi-voice personalities for context")
  innovations = append(innovations, "Innovation 4: Haptic feedback via bone conduction")
  innovations = append(innovations, "Innovation 5: Gesture recognition with ultrasound")
  innovations = append(innovations, "Innovation 6: Background ambient soundscape for state")

  return {
    name: "creative_design",
    pathway_type: "novel_synthesis",
    confidence: 0.85,
    result: z,
    quality_score: 0.85,
    reasoning_trace: innovations,
    execution_time: 15.0
  }
}

(* Empirical design approach *)
fn execute_empirical_design_approach(z: LatentVector, challenge: string) -> Path {
  let precedents = []

  precedents = append(precedents, "Precedent 1: Amazon Alexa uses voice-only interface")
  precedents = append(precedents, "Precedent 2: Google Assistant audio cues")
  precedents = append(precedents, "Precedent 3: Apple Siri tone feedback")
  precedents = append(precedents, "Precedent 4: Accessibility features for blind users")

  return {
    name: "empirical_design",
    pathway_type: "best_practice",
    confidence: 0.78,
    result: z,
    quality_score: 0.78,
    reasoning_trace: precedents,
    execution_time: 11.0
  }
}

(* ============================================================================
   EXAMPLE 3: DATA-DRIVEN DECISION
   ============================================================================ *)

program example_data_driven_decision {
  query "What is the most efficient sorting algorithm for our specific use case?" -> question

  result = solve_data_driven_question(question)

  return result
}

(* Solve data-driven question with empirical focus *)
fn solve_data_driven_question(question: string) -> string {
  (* Initialize *)
  z = encode_query(question)

  (* Fork *)
  fork z -> {z_a, z_b, z_c}

  (* Execute paths - empirical will dominate *)
  analytical = execute_analytical_algorithm_analysis(z_a, question)
  creative = execute_creative_algorithm_design(z_b, question)
  empirical = execute_empirical_algorithm_selection(z_c, question)

  (* Weights favor empirical *)
  weights = {
    analytical_weight: 0.25,
    creative_weight: 0.15,
    empirical_weight: 0.60,
    sum_normalized: 1.0,
    adaptation_basis: "data_driven"
  }

  (* Combine *)
  ensemble = combine_with_weights(analytical, creative, empirical, weights)

  return ensemble
}

(* Analytical algorithm analysis *)
fn execute_analytical_algorithm_analysis(z: LatentVector, question: string) -> Path {
  let complexity = []

  complexity = append(complexity, "QuickSort: O(n log n) average, O(n²) worst")
  complexity = append(complexity, "MergeSort: O(n log n) guaranteed, O(n) space")
  complexity = append(complexity, "HeapSort: O(n log n) worst, O(1) space")
  complexity = append(complexity, "TimSort: O(n log n), adaptive to presorted data")

  return {
    name: "analytical_algorithm",
    pathway_type: "complexity_analysis",
    confidence: 0.88,
    result: z,
    quality_score: 0.88,
    reasoning_trace: complexity,
    execution_time: 10.0
  }
}

(* Creative algorithm design *)
fn execute_creative_algorithm_design(z: LatentVector, question: string) -> Path {
  let ideas = []

  ideas = append(ideas, "Hybrid approach: Use QuickSort for most data, MergeSort for tail")
  ideas = append(ideas, "Pattern detection: Switch algorithms based on data distribution")
  ideas = append(ideas, "Parallel sorting: Leverage multi-core for divide-and-conquer")

  return {
    name: "creative_algorithm",
    pathway_type: "hybrid_design",
    confidence: 0.72,
    result: z,
    quality_score: 0.72,
    reasoning_trace: ideas,
    execution_time: 12.0
  }
}

(* Empirical algorithm selection *)
fn execute_empirical_algorithm_selection(z: LatentVector, question: string) -> Path {
  let empirical = []

  empirical = append(empirical, "Benchmark result 1: For random data (1M elements) - QuickSort 15ms")
  empirical = append(empirical, "Benchmark result 2: For presorted data - TimSort 2ms")
  empirical = append(empirical, "Benchmark result 3: For partially sorted - MergeSort 8ms")
  empirical = append(empirical, "Real-world finding: Python's built-in sort (TimSort) best for mixed")
  empirical = append(empirical, "Recommendation: Use TimSort - proven across datasets")

  return {
    name: "empirical_algorithm",
    pathway_type: "empirical_benchmark",
    confidence: 0.92,
    result: z,
    quality_score: 0.92,
    reasoning_trace: empirical,
    execution_time: 11.0
  }
}

(* ============================================================================
   EXAMPLE 4: BALANCED REASONING
   ============================================================================ *)

program example_balanced_reasoning {
  query "How should we structure our machine learning project?" -> query_str

  result = solve_balanced_question(query_str)

  return result
}

(* Solve with balanced path weighting *)
fn solve_balanced_question(query_str: string) -> string {
  z = encode_query(query_str)

  fork z -> {z_a, z_b, z_c}

  analytical = execute_analytical_ml_structure(z_a, query_str)
  creative = execute_creative_ml_architecture(z_b, query_str)
  empirical = execute_empirical_ml_practices(z_c, query_str)

  (* Balanced weights - all three paths important *)
  weights = {
    analytical_weight: 0.35,
    creative_weight: 0.33,
    empirical_weight: 0.32,
    sum_normalized: 1.0,
    adaptation_basis: "balanced"
  }

  ensemble = combine_with_weights(analytical, creative, empirical, weights)

  return ensemble
}

(* Analytical ML structure *)
fn execute_analytical_ml_structure(z: LatentVector, query_str: string) -> Path {
  let structure = []

  structure = append(structure, "Layer 1: Data collection and preprocessing")
  structure = append(structure, "Layer 2: Feature engineering and selection")
  structure = append(structure, "Layer 3: Model selection and training")
  structure = append(structure, "Layer 4: Validation and cross-validation")
  structure = append(structure, "Layer 5: Hyperparameter optimization")
  structure = append(structure, "Layer 6: Deployment and monitoring")

  return {
    name: "analytical_ml",
    pathway_type: "systematic_structure",
    confidence: 0.86,
    result: z,
    quality_score: 0.86,
    reasoning_trace: structure,
    execution_time: 10.0
  }
}

(* Creative ML architecture *)
fn execute_creative_ml_architecture(z: LatentVector, query_str: string) -> Path {
  let innovations = []

  innovations = append(innovations, "Idea 1: Multi-task learning for related problems")
  innovations = append(innovations, "Idea 2: Federated learning for privacy")
  innovations = append(innovations, "Idea 3: Active learning to reduce labeling cost")
  innovations = append(innovations, "Idea 4: Transfer learning from pretrained models")

  return {
    name: "creative_ml",
    pathway_type: "innovative_architecture",
    confidence: 0.79,
    result: z,
    quality_score: 0.79,
    reasoning_trace: innovations,
    execution_time: 12.0
  }
}

(* Empirical ML practices *)
fn execute_empirical_ml_practices(z: LatentVector, query_str: string) -> Path {
  let practices = []

  practices = append(practices, "Best practice 1: Start with simple baseline")
  practices = append(practices, "Best practice 2: Use train/val/test split")
  practices = append(practices, "Best practice 3: Monitor for overfitting")
  practices = append(practices, "Best practice 4: Document experiments thoroughly")
  practices = append(practices, "Best practice 5: Version data and models")

  return {
    name: "empirical_ml",
    pathway_type: "proven_practices",
    confidence: 0.84,
    result: z,
    quality_score: 0.84,
    reasoning_trace: practices,
    execution_time: 11.0
  }
}

(* ============================================================================
   HELPER FUNCTIONS
   ============================================================================ *)

(* Encode query *)
fn encode_query(query: string) -> LatentVector {
  return []
}

(* Combine with weights *)
fn combine_with_weights(analytical: Path, creative: Path, empirical: Path, weights: AdaptiveWeights) -> string {
  let result = "Combined Decision Using Ensemble Voting:\n\n"

  result = result + "Analytical Path (weight=" + to_string_float(weights.analytical_weight) + "):\n"
  result = result + format_path_summary(analytical) + "\n\n"

  result = result + "Creative Path (weight=" + to_string_float(weights.creative_weight) + "):\n"
  result = result + format_path_summary(creative) + "\n\n"

  result = result + "Empirical Path (weight=" + to_string_float(weights.empirical_weight) + "):\n"
  result = result + format_path_summary(empirical) + "\n"

  return result
}

(* Format path summary *)
fn format_path_summary(path: Path) -> string {
  let summary = "  Method: " + path.pathway_type + ", Confidence: " + to_string_float(path.confidence)

  if length(path.reasoning_trace) > 0 {
    summary = summary + "\n  Reasoning:\n"
    for i in range(min(3, length(path.reasoning_trace))) {
      summary = summary + "    - " + path.reasoning_trace[i] + "\n"
    }
  }

  return summary
}

(* Helper utilities *)
fn to_string_float(f: float) -> string {
  return "0.xx"
}

fn min(a: int, b: int) -> int {
  if a < b { return a } else { return b }
}
