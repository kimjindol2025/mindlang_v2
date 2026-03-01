(* MindLang Standard Library - Ensemble Module
   Ensemble learning and aggregation utilities

   Contains: Weighted ensemble combination, adaptive weighting, voting consensus,
   confidence estimation, and result ranking
*)

(* Ensemble Combination *)

(* weighted_ensemble: Combine multiple results with weights
   Args: weights (Vector), results (Vector), combine_fn (Function)
   Returns: Value (weighted combination)

   Example:
   weights = [0.7, 0.2, 0.1]
   results = [result_a, result_b, result_c]
   weighted_ensemble weights results (fn(w, r) { w * r }) -> combined
*)
fn weighted_ensemble(weights: Vector, results: Vector, combine_fn: Function) -> Value {
  if length(weights) != length(results) {
    error("Weights and results must have same length")
  }

  let sum_weights = reduce(fn(acc, i) { acc + weights[i] }, 0.0, range(length(weights)))
  if sum_weights == 0.0 {
    error("Sum of weights cannot be zero")
  }

  let normalized_weights = map(
    fn(i) { weights[i] / sum_weights },
    range(length(weights))
  )

  let combined = nil
  for i in range(length(results)) {
    let weighted_result = combine_fn(normalized_weights[i], results[i])
    if combined == nil {
      combined = weighted_result
    } else {
      combined = add_weighted_results(combined, weighted_result)
    }
  }
  combined
}

(* simple_ensemble: Simple average of results
   Args: results (Vector of numeric values)
   Returns: Float (average)

   Example:
   results = [0.8, 0.85, 0.75]
   simple_ensemble results -> 0.8
*)
fn simple_ensemble(results: Vector) -> Float {
  if length(results) == 0 {
    error("Cannot ensemble empty results")
  }

  let sum = reduce(fn(acc, i) { acc + results[i] }, 0.0, range(length(results)))
  sum / to_float(length(results))
}

(* weighted_average: Weighted average of numeric results
   Args: weights (Vector), results (Vector)
   Returns: Float (weighted average)

   Example:
   weights = [0.6, 0.4]
   results = [100.0, 80.0]
   weighted_average weights results -> 92.0
*)
fn weighted_average(weights: Vector, results: Vector) -> Float {
  if length(weights) != length(results) {
    error("Weights and results must have same length")
  }

  let sum_weights = reduce(fn(acc, i) { acc + weights[i] }, 0.0, range(length(weights)))
  let weighted_sum = 0.0

  for i in range(length(weights)) {
    weighted_sum = weighted_sum + (weights[i] * results[i])
  }

  weighted_sum / sum_weights
}

(* Power Mean Ensemble *)

(* power_mean_ensemble: Compute power mean of results
   Args: results (Vector), power (Float)
   Returns: Float

   Example:
   results = [2.0, 4.0, 8.0]
   power_mean_ensemble results 2.0 -> (2^2 + 4^2 + 8^2) / 3 ^ (1/2)
*)
fn power_mean_ensemble(results: Vector, power: Float) -> Float {
  if length(results) == 0 {
    error("Cannot ensemble empty results")
  }

  let n = to_float(length(results))
  let sum = reduce(
    fn(acc, i) { acc + pow(results[i], power) },
    0.0,
    range(length(results))
  )

  pow(sum / n, 1.0 / power)
}

(* Voting and Consensus *)

(* majority_vote: Simple majority voting
   Args: votes (Vector of categorical values)
   Returns: Value (most frequent vote)

   Example:
   votes = ["A", "B", "A", "A", "C"]
   majority_vote votes -> "A"
*)
fn majority_vote(votes: Vector) -> Value {
  if length(votes) == 0 {
    error("Cannot vote on empty votes")
  }

  let vote_counts = {}
  for vote_idx in range(length(votes)) {
    let vote = votes[vote_idx]
    let current_count = get_or_default(vote_counts, vote, 0)
    vote_counts[vote] = current_count + 1
  }

  let max_vote = nil
  let max_count = 0
  for vote_idx in range(length(votes)) {
    let vote = votes[vote_idx]
    if vote_counts[vote] > max_count {
      max_count = vote_counts[vote]
      max_vote = vote
    }
  }
  max_vote
}

(* weighted_vote: Weighted voting with confidence scores
   Args: votes (Vector), confidences (Vector)
   Returns: Value (highest confidence winner)

   Example:
   votes = ["A", "B", "A"]
   confidences = [0.9, 0.7, 0.6]
   weighted_vote votes confidences -> "A"  (sum 1.5 vs 0.7)
*)
fn weighted_vote(votes: Vector, confidences: Vector) -> Value {
  if length(votes) != length(confidences) {
    error("Votes and confidences must have same length")
  }

  let vote_weights = {}
  for i in range(length(votes)) {
    let vote = votes[i]
    let confidence = confidences[i]
    let current_weight = get_or_default(vote_weights, vote, 0.0)
    vote_weights[vote] = current_weight + confidence
  }

  let winning_vote = nil
  let max_weight = 0.0
  for i in range(length(votes)) {
    let vote = votes[i]
    if vote_weights[vote] > max_weight {
      max_weight = vote_weights[vote]
      winning_vote = vote
    }
  }
  winning_vote
}

(* consensus: Find consensus among multiple results
   Args: results (Vector), threshold (Float in 0-1)
   Returns: Tuple (consensus_value, agreement_level)

   Example:
   results = ["A", "A", "B", "A"]
   {winner, agreement} = consensus results 0.6
   -> {winner: "A", agreement: 0.75}
*)
fn consensus(results: Vector, threshold: Float) -> Tuple {
  let winner = majority_vote(results)
  let count = 0

  for i in range(length(results)) {
    if results[i] == winner {
      count = count + 1
    }
  }

  let agreement = to_float(count) / to_float(length(results))

  if agreement < threshold {
    {
      consensus: nil,
      agreement: agreement,
      confidence: 0.0
    }
  } else {
    {
      consensus: winner,
      agreement: agreement,
      confidence: agreement
    }
  }
}

(* Adaptive Weighting *)

(* compute_adaptive_weights: Compute weights based on results
   Args: results (Vector), method (String: "entropy", "variance", "confidence")
   Returns: Vector (adaptive weights)

   Example:
   results = [[0.9, 0.1], [0.5, 0.5], [0.95, 0.05]]
   compute_adaptive_weights results "entropy" -> [0.4, 0.1, 0.5]
*)
fn compute_adaptive_weights(results: Vector, method: String) -> Vector {
  if length(results) == 0 {
    error("Cannot compute weights for empty results")
  }

  if method == "entropy" {
    compute_entropy_weights(results)
  } else if method == "variance" {
    compute_variance_weights(results)
  } else if method == "confidence" {
    compute_confidence_weights(results)
  } else {
    error("Unknown weighting method: " + method)
  }
}

(* compute_entropy_weights: Weight by inverse entropy (low entropy = high weight)
   Args: results (Vector of probability distributions)
   Returns: Vector (weights)
*)
fn compute_entropy_weights(results: Vector) -> Vector {
  let entropies = []
  for i in range(length(results)) {
    let result = results[i]
    let ent = 0.0
    for j in range(length(result)) {
      let p = result[j]
      if p > 0.0 {
        ent = ent - (p * log(p))
      }
    }
    entropies = append(entropies, ent)
  }

  (* Invert and normalize: high entropy -> low weight *)
  let max_entropy = max(entropies)
  let inverted = map(fn(i) { max_entropy - entropies[i] }, range(length(entropies)))
  let sum = reduce(fn(acc, i) { acc + inverted[i] }, 0.0, range(length(inverted)))

  map(fn(i) { inverted[i] / sum }, range(length(inverted)))
}

(* compute_variance_weights: Weight by inverse variance
   Args: results (Vector)
   Returns: Vector (weights)
*)
fn compute_variance_weights(results: Vector) -> Vector {
  let variances = []
  for i in range(length(results)) {
    let values = results[i]
    let mean = simple_ensemble(values)
    let var = 0.0
    for j in range(length(values)) {
      var = var + pow(values[j] - mean, 2.0)
    }
    var = var / to_float(length(values))
    variances = append(variances, var)
  }

  (* Invert and normalize *)
  let inverted = map(fn(i) { 1.0 / (variances[i] + 1e-10) }, range(length(variances)))
  let sum = reduce(fn(acc, i) { acc + inverted[i] }, 0.0, range(length(inverted)))

  map(fn(i) { inverted[i] / sum }, range(length(inverted)))
}

(* compute_confidence_weights: Weight by confidence scores
   Args: results (Vector of {value, confidence} tuples)
   Returns: Vector (normalized confidence weights)
*)
fn compute_confidence_weights(results: Vector) -> Vector {
  let confidences = []
  for i in range(length(results)) {
    let result = results[i]
    (* Extract confidence - could be result.confidence or max(result) for distributions *)
    let conf = 0.0
    if is_map(result) {
      conf = result["confidence"]
    } else if is_vector(result) {
      conf = max(result)
    } else {
      conf = to_float(result)
    }
    confidences = append(confidences, conf)
  }

  let sum = reduce(fn(acc, i) { acc + confidences[i] }, 0.0, range(length(confidences)))
  map(fn(i) { confidences[i] / sum }, range(length(confidences)))
}

(* Ranking and Selection *)

(* rank_results: Rank results by score
   Args: results (Vector of {value, score} or numeric scores)
   Returns: Vector (sorted indices)

   Example:
   results = [0.6, 0.9, 0.7]
   rank_results results -> [1, 2, 0]  (indices sorted by score descending)
*)
fn rank_results(results: Vector) -> Vector {
  let indexed = []
  for i in range(length(results)) {
    indexed = append(indexed, {index: i, score: results[i]})
  }

  (* Sort by score descending *)
  let sorted = sort_by(indexed, fn(a, b) { b["score"] - a["score"] })

  map(fn(i) { sorted[i]["index"] }, range(length(sorted)))
}

(* select_top_k: Select top K results
   Args: results (Vector), k (Int)
   Returns: Vector (top k results)

   Example:
   results = [0.5, 0.8, 0.6, 0.9, 0.7]
   select_top_k results 3 -> [0.9, 0.8, 0.7]
*)
fn select_top_k(results: Vector, k: Int) -> Vector {
  let ranked = rank_results(results)
  let top_k = []
  for i in range(min(k, length(ranked))) {
    let idx = ranked[i]
    top_k = append(top_k, results[idx])
  }
  top_k
}

(* Conflict Resolution *)

(* resolve_conflicting_results: Resolve disagreements in ensemble
   Args: results (Vector), conflict_fn (Function)
   Returns: Value (resolved result)

   Example:
   resolve_conflicting_results ["A", "B", "A"] majority_vote -> "A"
*)
fn resolve_conflicting_results(results: Vector, conflict_fn: Function) -> Value {
  conflict_fn(results)
}

(* compute_agreement_level: Measure agreement among ensemble members
   Args: results (Vector)
   Returns: Float (0 = no agreement, 1 = perfect agreement)

   Example:
   results = ["A", "A", "A"]
   compute_agreement_level results -> 1.0
*)
fn compute_agreement_level(results: Vector) -> Float {
  if length(results) <= 1 {
    return 1.0
  }

  let vote_counts = {}
  for i in range(length(results)) {
    let result = results[i]
    let count = get_or_default(vote_counts, result, 0)
    vote_counts[result] = count + 1
  }

  let max_count = 0
  for i in range(length(results)) {
    let result = results[i]
    if vote_counts[result] > max_count {
      max_count = vote_counts[result]
    }
  }

  to_float(max_count) / to_float(length(results))
}

(* Meta-Ensemble *)

(* stacking: Stack multiple ensemble methods
   Args: results (Vector), ensemble_fns (Vector of ensemble functions)
   Returns: Value (meta-ensemble result)

   Example:
   stacking results [simple_ensemble, weighted_average, power_mean_ensemble]
*)
fn stacking(results: Vector, ensemble_fns: Vector) -> Value {
  let meta_results = []
  for fn_idx in range(length(ensemble_fns)) {
    let ensemble_fn = ensemble_fns[fn_idx]
    let result = ensemble_fn(results)
    meta_results = append(meta_results, result)
  }

  (* Apply final ensemble to meta results *)
  simple_ensemble(meta_results)
}

(* boosting: Sequentially improve ensemble by upweighting errors
   Args: results (Vector), targets (Vector), iterations (Int)
   Returns: Tuple (final_ensemble, weights)
*)
fn boosting(results: Vector, targets: Vector, iterations: Int) -> Tuple {
  let n = length(results)
  let weights = make_vector(n, 1.0 / to_float(n))

  for iter in range(iterations) {
    let errors = []
    for i in range(n) {
      let error = abs(results[i] - targets[i])
      errors = append(errors, error)
    }

    let max_error = max(errors)
    for i in range(n) {
      if errors[i] == max_error {
        weights[i] = weights[i] * 1.5
      }
    }

    let sum = reduce(fn(acc, i) { acc + weights[i] }, 0.0, range(n))
    weights = map(fn(i) { weights[i] / sum }, range(n))
  }

  let final = weighted_average(weights, results)

  {
    ensemble: final,
    weights: weights
  }
}

(* Helper Functions *)

(* add_weighted_results: Add two weighted results
   Args: a (Value), b (Value)
   Returns: Value (combined result)
*)
fn add_weighted_results(a: Value, b: Value) -> Value {
  if is_vector(a) {
    vector_add(a, b)
  } else if is_number(a) {
    a + b
  } else {
    a  (* Fallback *)
  }
}

(* get_or_default: Get value from map with default
   Args: map (Map), key (String), default (Value)
   Returns: Value
*)
fn get_or_default(m: Map, key: String, default: Value) -> Value {
  if has_key(m, key) {
    m[key]
  } else {
    default
  }
}

(* Export all functions *)
export {
  weighted_ensemble, simple_ensemble, weighted_average, power_mean_ensemble,
  majority_vote, weighted_vote, consensus, compute_adaptive_weights,
  compute_entropy_weights, compute_variance_weights, compute_confidence_weights,
  rank_results, select_top_k, resolve_conflicting_results,
  compute_agreement_level, stacking, boosting
}
