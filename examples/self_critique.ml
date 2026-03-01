(* MindLang Example: Self-Critique Loop
   Demonstrates iterative refinement through self-critique

   This example shows:
   - Problem specification
   - Initial solution generation
   - Critique feedback loop
   - Iterative refinement
   - Confidence-based convergence
   - Final output
*)

program self_critique {
  (* Input problem *)
  query problem_statement -> problem

  (* Encode problem *)
  encode problem -> z

  (* Generate initial solution *)
  initial_solve z -> result

  (* Initialize loop counter *)
  iteration = 0
  max_iterations = 5

  (* Critique loop *)
  loop {
    (* Apply self-critique *)
    critique result -> delta

    (* Extract confidence from critique *)
    confidence = extract_confidence(delta)

    (* Check if confident enough *)
    if confidence > 0.9 || iteration >= max_iterations {
      (* Break loop if confident or max iterations reached *)
      break
    }

    (* Retry with feedback *)
    feedback = extract_feedback(delta)
    result = retry_with_feedback(result, feedback)

    (* Increment counter *)
    iteration = iteration + 1
  }

  (* Detokenize final result *)
  detokenize result -> output

  (* Return with metadata *)
  return {
    output: output,
    iterations: iteration,
    confidence: confidence,
    improved: confidence > 0.9
  }
}

(* Initial problem solving *)
fn initial_solve(z: LatentVector) -> Solution {
  (* First pass: generate solution *)
  direct_solution = generate_solution(z)

  return direct_solution
}

(* Critique a solution *)
fn critique(solution: Solution) -> Critique {
  (* Analyze solution *)
  analysis = analyze_solution(solution)

  (* Generate critique *)
  {
    strengths: analysis["strengths"],
    weaknesses: analysis["weaknesses"],
    confidence: analysis["confidence"],
    suggestions: analysis["suggestions"],
    needs_revision: analysis["confidence"] < 0.9
  }
}

(* Extract confidence score from critique *)
fn extract_confidence(critique: Critique) -> Float {
  if is_map(critique) && has_key(critique, "confidence") {
    return critique["confidence"]
  } else {
    return 0.5
  }
}

(* Extract feedback from critique *)
fn extract_feedback(critique: Critique) -> Feedback {
  if is_map(critique) && has_key(critique, "suggestions") {
    return critique["suggestions"]
  } else {
    return []
  }
}

(* Retry with feedback *)
fn retry_with_feedback(current_solution: Solution, feedback: Feedback) -> Solution {
  (* Enhance solution based on feedback *)
  enhanced = enhance_solution(current_solution, feedback)

  (* Generate improved solution *)
  improved = generate_solution_from_enhanced(enhanced)

  return improved
}

(* Generate initial solution *)
fn generate_solution(z: LatentVector) -> Solution {
  (* Apply problem-specific reasoning *)
  reasoning_layers = []

  (* Layer 1: Understanding *)
  understanding = apply_understanding_layer(z)
  reasoning_layers = append(reasoning_layers, understanding)

  (* Layer 2: Planning *)
  planning = apply_planning_layer(understanding)
  reasoning_layers = append(reasoning_layers, planning)

  (* Layer 3: Execution *)
  execution = apply_execution_layer(planning)
  reasoning_layers = append(reasoning_layers, execution)

  (* Layer 4: Verification *)
  verification = apply_verification_layer(execution)
  reasoning_layers = append(reasoning_layers, verification)

  return execution
}

(* Analyze solution quality *)
fn analyze_solution(solution: Solution) -> Map {
  let scores = {}

  (* Check for logical consistency *)
  consistency = check_consistency(solution)
  scores["consistency"] = consistency

  (* Check for completeness *)
  completeness = check_completeness(solution)
  scores["completeness"] = completeness

  (* Check for clarity *)
  clarity = check_clarity(solution)
  scores["clarity"] = clarity

  (* Compute overall confidence *)
  avg_score = (consistency + completeness + clarity) / 3.0
  scores["confidence"] = avg_score

  (* Identify strengths and weaknesses *)
  scores["strengths"] = identify_strengths(scores)
  scores["weaknesses"] = identify_weaknesses(scores)
  scores["suggestions"] = generate_suggestions(scores)

  return scores
}

(* Check logical consistency *)
fn check_consistency(solution: Solution) -> Float {
  (* Verify that solution components don't contradict *)
  contradictions = find_contradictions(solution)
  consistency = 1.0 - (to_float(length(contradictions)) / 10.0)
  return max(0.0, min(1.0, consistency))
}

(* Check completeness *)
fn check_completeness(solution: Solution) -> Float {
  (* Check if solution addresses all requirements *)
  coverage = compute_coverage(solution)
  return coverage
}

(* Check clarity *)
fn check_clarity(solution: Solution) -> Float {
  (* Check if solution is clearly explained *)
  clarity = measure_clarity(solution)
  return clarity
}

(* Identify strengths *)
fn identify_strengths(scores: Map) -> Vector {
  let strengths = []

  if scores["consistency"] > 0.8 {
    strengths = append(strengths, "Logically consistent")
  }
  if scores["completeness"] > 0.8 {
    strengths = append(strengths, "Addresses all points")
  }
  if scores["clarity"] > 0.8 {
    strengths = append(strengths, "Clearly explained")
  }

  return strengths
}

(* Identify weaknesses *)
fn identify_weaknesses(scores: Map) -> Vector {
  let weaknesses = []

  if scores["consistency"] < 0.7 {
    weaknesses = append(weaknesses, "Some logical inconsistencies")
  }
  if scores["completeness"] < 0.7 {
    weaknesses = append(weaknesses, "Missing some details")
  }
  if scores["clarity"] < 0.7 {
    weaknesses = append(weaknesses, "Could be clearer")
  }

  return weaknesses
}

(* Generate improvement suggestions *)
fn generate_suggestions(scores: Map) -> Vector {
  let suggestions = []

  if scores["consistency"] < 0.8 {
    suggestions = append(suggestions, "Review for logical consistency")
  }
  if scores["completeness"] < 0.8 {
    suggestions = append(suggestions, "Add missing details")
  }
  if scores["clarity"] < 0.8 {
    suggestions = append(suggestions, "Improve explanations")
  }

  return suggestions
}

(* Enhance solution based on feedback *)
fn enhance_solution(solution: Solution, feedback: Feedback) -> Solution {
  let enhanced = solution

  for i in range(length(feedback)) {
    let suggestion = feedback[i]
    enhanced = apply_suggestion(enhanced, suggestion)
  }

  return enhanced
}

(* Generate improved solution *)
fn generate_solution_from_enhanced(enhanced: Solution) -> Solution {
  (* Reconstruct and improve solution *)
  return enhanced
}

(* Stub implementations *)
fn apply_understanding_layer(z: LatentVector) -> Layer {
  return z
}

fn apply_planning_layer(understanding: Layer) -> Layer {
  return understanding
}

fn apply_execution_layer(planning: Layer) -> Layer {
  return planning
}

fn apply_verification_layer(execution: Layer) -> Layer {
  return execution
}

fn find_contradictions(solution: Solution) -> Vector {
  return []
}

fn compute_coverage(solution: Solution) -> Float {
  return 0.8
}

fn measure_clarity(solution: Solution) -> Float {
  return 0.7
}

fn apply_suggestion(solution: Solution, suggestion: String) -> Solution {
  return solution
}
