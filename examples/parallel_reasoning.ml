(* MindLang Example: Parallel Reasoning
   Demonstrates parallel multi-path reasoning using fork-join patterns

   This example shows:
   - Query specification
   - Forking into multiple reasoning branches
   - Parallel analytical, creative, and empirical paths
   - Ensemble combination of results
   - Critique and feedback
   - Korean text output
*)

program parallel_reasoning {
  (* Input query *)
  query "What is 2+2?" -> q

  (* Encode query to latent representation *)
  encode q -> z

  (* Fork into three parallel reasoning paths *)
  fork z -> {z_analytical, z_creative, z_empirical}

  (* Execute three reasoning paths in parallel *)
  path_analytical = analytical_reasoning(z_analytical)
  path_creative = creative_reasoning(z_creative)
  path_empirical = empirical_reasoning(z_empirical)

  (* Ensemble the three results with custom weights *)
  (* Analytical: 70%, Creative: 20%, Empirical: 10% *)
  ensemble [0.7, 0.2, 0.1] [path_analytical, path_creative, path_empirical] -> combined

  (* Apply critique to the combined result *)
  critique combined -> delta

  (* Sample the critiqued result with high temperature for exploration *)
  sample delta 0.9 -> output

  (* Detokenize and format with Korean locale *)
  detokenize output -> korean_text

  (* Return the final result *)
  return korean_text
}

(* Analytical reasoning path *)
fn analytical_reasoning(z: LatentVector) -> Output {
  (* Apply analytical lens to latent representation *)
  (* Focus on logical deduction and mathematical operations *)
  apply_reasoning_lens z "analytical" 0.95 -> result
  return result
}

(* Creative reasoning path *)
fn creative_reasoning(z: LatentVector) -> Output {
  (* Apply creative lens to latent representation *)
  (* Allow for association and lateral thinking *)
  apply_reasoning_lens z "creative" 0.75 -> result
  return result
}

(* Empirical reasoning path *)
fn empirical_reasoning(z: LatentVector) -> Output {
  (* Apply empirical lens to latent representation *)
  (* Focus on observable patterns and evidence *)
  apply_reasoning_lens z "empirical" 0.85 -> result
  return result
}

(* Generic reasoning lens application *)
fn apply_reasoning_lens(z: LatentVector, lens_type: String, intensity: Float) -> Output {
  (* Scale latent vector by lens intensity *)
  scaled = vector_scale z intensity

  (* Apply lens-specific transformation *)
  match lens_type {
    "analytical" => analytical_transform(scaled),
    "creative" => creative_transform(scaled),
    "empirical" => empirical_transform(scaled)
  }
}

(* Analytical transformation *)
fn analytical_transform(z: LatentVector) -> Output {
  (* Apply logical constraints and mathematical operations *)
  constrained = apply_constraints z
  return constrained
}

(* Creative transformation *)
fn creative_transform(z: LatentVector) -> Output {
  (* Apply noise and association boosting *)
  noisy = add_creative_noise z
  return noisy
}

(* Empirical transformation *)
fn empirical_transform(z: LatentVector) -> Output {
  (* Apply evidence weighting *)
  weighted = apply_evidence_weighting z
  return weighted
}
