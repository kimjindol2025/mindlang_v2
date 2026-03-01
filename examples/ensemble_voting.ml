(* MindLang Example: Ensemble Voting
   Demonstrates multi-path reasoning with consensus voting

   This example shows:
   - Query specification
   - Three independent reasoning paths
   - Parallel execution with fork
   - Consensus voting among paths
   - Confidence-based result selection
   - Output formatting
*)

program ensemble_voting {
  (* Input query *)
  query "What is the capital of France?" -> input

  (* Encode query *)
  encode input -> z

  (* Fork into three independent reasoning branches *)
  fork z -> {z_path_a, z_path_b, z_path_c}

  (* Execute three reasoning paths in parallel *)
  path_a = solve_with_path_a(z_path_a)
  path_b = solve_with_path_b(z_path_b)
  path_c = solve_with_path_c(z_path_c)

  (* Collect all results *)
  results = [path_a, path_b, path_c]

  (* Compute confidence scores for each result *)
  conf_a = confidence_score(path_a)
  conf_b = confidence_score(path_b)
  conf_c = confidence_score(path_c)
  confidences = [conf_a, conf_b, conf_c]

  (* Apply weighted voting consensus *)
  consensus_result = weighted_vote results confidences

  (* Calculate overall agreement level *)
  agreement = compute_agreement_level results

  (* If agreement is high, return consensus *)
  if agreement > 0.8 {
    detokenize consensus_result -> output
    return output
  } else {
    (* If agreement is low, select highest confidence result *)
    ranked = rank_results confidences
    best_idx = ranked[0]
    best_result = results[best_idx]
    detokenize best_result -> output
    return output
  }
}

(* First reasoning path: Rule-based *)
fn solve_with_path_a(z: LatentVector) -> Output {
  (* Apply rule-based reasoning *)
  rules = load_reasoning_rules("rule_based")

  (* Match query against rules *)
  matched = match_against_rules z rules

  (* Extract result *)
  result = extract_rule_result matched

  return result
}

(* Second reasoning path: Statistical *)
fn solve_with_path_b(z: LatentVector) -> Output {
  (* Apply statistical pattern matching *)
  patterns = load_patterns("statistical")

  (* Score against learned patterns *)
  scores = score_against_patterns z patterns

  (* Select best matching pattern *)
  best_pattern_idx = argmax(scores)
  result = patterns[best_pattern_idx]

  return result
}

(* Third reasoning path: Semantic *)
fn solve_with_path_c(z: LatentVector) -> Output {
  (* Apply semantic similarity *)
  knowledge_graph = load_knowledge_graph()

  (* Find semantically similar entries *)
  similar = find_semantic_matches z knowledge_graph

  (* Aggregate similar results *)
  result = aggregate_semantic_matches similar

  return result
}

(* Compute confidence score for a result *)
fn confidence_score(result: Output) -> Float {
  (* Extract confidence from result structure *)
  if is_map(result) && has_key(result, "confidence") {
    return result["confidence"]
  } else if is_vector(result) {
    (* For probability distributions, take max *)
    return max(result)
  } else {
    (* Default confidence *)
    return 0.5
  }
}

(* Rank results by confidence *)
fn rank_results(confidences: Vector) -> Vector {
  let indexed = []

  for i in range(length(confidences)) {
    indexed = append(indexed, {idx: i, conf: confidences[i]})
  }

  (* Sort by confidence descending *)
  sorted = sort_by(indexed, fn(a, b) { b["conf"] - a["conf"] })

  map(fn(i) { sorted[i]["idx"] }, range(length(sorted)))
}

(* Compute agreement level among results *)
fn compute_agreement_level(results: Vector) -> Float {
  if length(results) <= 1 {
    return 1.0
  }

  let vote_counts = {}

  for i in range(length(results)) {
    let result = to_string(results[i])
    let count = get_count(vote_counts, result, 0)
    vote_counts[result] = count + 1
  }

  let max_count = 0
  for key in keys(vote_counts) {
    if vote_counts[key] > max_count {
      max_count = vote_counts[key]
    }
  }

  return to_float(max_count) / to_float(length(results))
}

(* Weighted vote among results *)
fn weighted_vote(results: Vector, confidences: Vector) -> Output {
  if length(results) != length(confidences) {
    error("Results and confidences must have same length")
  }

  let best_result = results[0]
  let best_confidence = confidences[0]

  for i in range(1, length(results)) {
    if confidences[i] > best_confidence {
      best_result = results[i]
      best_confidence = confidences[i]
    }
  }

  return best_result
}

(* Helper: Get count from map *)
fn get_count(m: Map, key: String, default: Int) -> Int {
  if has_key(m, key) {
    return m[key]
  } else {
    return default
  }
}
