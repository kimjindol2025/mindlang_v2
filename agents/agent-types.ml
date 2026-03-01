(* MindLang Agent Type Definitions
   Comprehensive type system for AI agent reasoning and ensemble processing

   This module defines:
   - Core agent types and data structures
   - Path representations and reasoning results
   - Ensemble configuration and output
   - Critique and quality assessment types
   - Agent state management
*)

(* ============================================================================
   BASIC TYPES
   ============================================================================ *)

(* Query types *)
type Query = string
type QueryFeatures = {
  is_analytical: boolean,
  is_creative: boolean,
  is_empirical: boolean,
  complexity: float,
  domain: string
}

(* Latent space representations *)
type LatentVector = float[]
type LatentMatrix = float[][]

(* Reasoning results *)
type ReasoningResult = {
  output: string,
  confidence: float,
  method: string,
  reasoning_steps: string[],
  timestamp: float
}

(* ============================================================================
   PATH DEFINITIONS
   ============================================================================ *)

(* Individual reasoning path *)
type Path = {
  name: string,
  pathway_type: string,
  confidence: float,
  result: LatentVector,
  quality_score: float,
  reasoning_trace: string[],
  execution_time: float
}

(* Analytical path - structured reasoning *)
type AnalyticalPath = {
  path_name: string,
  method: string,
  logical_steps: string[],
  constraints: string[],
  solution_candidates: string[],
  selected_solution: string,
  confidence: float
}

(* Creative path - innovative reasoning *)
type CreativePath = {
  path_name: string,
  method: string,
  analogies: string[],
  novel_ideas: string[],
  pattern_combinations: string[],
  innovative_solution: string,
  confidence: float
}

(* Empirical path - experience-based reasoning *)
type EmpiricalPath = {
  path_name: string,
  method: string,
  similar_cases: string[],
  historical_precedents: string[],
  probability_estimates: float[],
  best_practice_solution: string,
  confidence: float
}

(* ============================================================================
   ENSEMBLE TYPES
   ============================================================================ *)

(* Adaptive weights for path combination *)
type AdaptiveWeights = {
  analytical_weight: float,
  creative_weight: float,
  empirical_weight: float,
  sum_normalized: float,
  adaptation_basis: string
}

(* Ensemble configuration *)
type EnsembleConfig = {
  weights: AdaptiveWeights,
  voting_strategy: string,
  confidence_threshold: float,
  aggregation_method: string,
  contradiction_resolution: string
}

(* Ensemble result *)
type EnsembleResult = {
  analytical_path: Path,
  creative_path: Path,
  empirical_path: Path,
  weights: AdaptiveWeights,
  merged_latent: LatentVector,
  consensus_score: float,
  agreement_level: float,
  final_output: string
}

(* ============================================================================
   CRITIQUE TYPES
   ============================================================================ *)

(* Quality assessment *)
type QualityScore = {
  logic_score: float,
  relevance_score: float,
  clarity_score: float,
  completeness_score: float,
  overall_quality: float
}

(* Critique feedback *)
type Critique = {
  confidence: float,
  quality_scores: QualityScore,
  strengths: string[],
  weaknesses: string[],
  feedback: string[],
  should_retry: boolean,
  retry_strategy: string,
  improvement_suggestions: string[]
}

(* Self-critique result *)
type SelfCritiqueResult = {
  original_result: string,
  critique: Critique,
  needs_refinement: boolean,
  refinement_attempts: int,
  convergence_reached: boolean
}

(* ============================================================================
   AGENT STATE TYPES
   ============================================================================ *)

(* Agent state during execution *)
type AgentState = {
  query: Query,
  query_features: QueryFeatures,
  initial_latent: LatentVector,
  paths_executed: Path[],
  weights_computed: AdaptiveWeights,
  ensemble_result: EnsembleResult,
  critique_feedback: Critique,
  iteration_count: int,
  state_phase: string,
  output_string: string,
  execution_metadata: string
}

(* Agent configuration *)
type AgentConfig = {
  max_iterations: int,
  confidence_threshold: float,
  enable_feedback_loops: boolean,
  enable_voting: boolean,
  voting_method: string,
  refinement_strategy: string,
  timeout_seconds: float
}

(* ============================================================================
   OUTPUT TYPES
   ============================================================================ *)

(* Final agent output *)
type AgentOutput = {
  response: string,
  confidence: float,
  reasoning_used: string[],
  quality_assessment: QualityScore,
  metadata: {
    iterations: int,
    execution_time: float,
    paths_used: int,
    feedback_applied: boolean,
    converged: boolean
  }
}

(* Detailed reasoning trace *)
type ReasoningTrace = {
  query: string,
  encoding_step: string,
  analytical_reasoning: string,
  creative_reasoning: string,
  empirical_reasoning: string,
  weight_computation: string,
  ensemble_step: string,
  critique_step: string,
  refinement_steps: string[],
  final_output: string
}

(* ============================================================================
   UTILITY TYPES
   ============================================================================ *)

(* Key-value storage for configuration *)
type ConfigMap = {
  learning_rate: float,
  regularization: float,
  ensemble_method: string,
  consensus_threshold: float,
  max_path_depth: int
}

(* Metric collection *)
type MetricCollection = {
  avg_confidence: float,
  path_agreement: float,
  quality_metrics: float[],
  execution_times: float[],
  convergence_rate: float
}

(* Error/warning information *)
type ExecutionInfo = {
  success: boolean,
  error_message: string,
  warnings: string[],
  recovered: boolean,
  fallback_used: boolean
}

(* ============================================================================
   HELPER FUNCTIONS
   ============================================================================ *)

(* Create default adaptive weights *)
fn default_weights() -> AdaptiveWeights {
  return {
    analytical_weight: 0.33,
    creative_weight: 0.33,
    empirical_weight: 0.34,
    sum_normalized: 1.0,
    adaptation_basis: "equal_default"
  }
}

(* Create default agent config *)
fn default_config() -> AgentConfig {
  return {
    max_iterations: 5,
    confidence_threshold: 0.8,
    enable_feedback_loops: true,
    enable_voting: true,
    voting_method: "weighted_consensus",
    refinement_strategy: "iterative",
    timeout_seconds: 30.0
  }
}

(* Create initial agent state *)
fn init_agent_state(query: Query) -> AgentState {
  return {
    query: query,
    query_features: {
      is_analytical: false,
      is_creative: false,
      is_empirical: false,
      complexity: 0.5,
      domain: "general"
    },
    initial_latent: [],
    paths_executed: [],
    weights_computed: default_weights(),
    ensemble_result: {
      analytical_path: {name: "", pathway_type: "", confidence: 0.0, result: [], quality_score: 0.0, reasoning_trace: [], execution_time: 0.0},
      creative_path: {name: "", pathway_type: "", confidence: 0.0, result: [], quality_score: 0.0, reasoning_trace: [], execution_time: 0.0},
      empirical_path: {name: "", pathway_type: "", confidence: 0.0, result: [], quality_score: 0.0, reasoning_trace: [], execution_time: 0.0},
      weights: default_weights(),
      merged_latent: [],
      consensus_score: 0.0,
      agreement_level: 0.0,
      final_output: ""
    },
    critique_feedback: {
      confidence: 0.0,
      quality_scores: {logic_score: 0.0, relevance_score: 0.0, clarity_score: 0.0, completeness_score: 0.0, overall_quality: 0.0},
      strengths: [],
      weaknesses: [],
      feedback: [],
      should_retry: false,
      retry_strategy: "none",
      improvement_suggestions: []
    },
    iteration_count: 0,
    state_phase: "initialized",
    output_string: "",
    execution_metadata: "agent_state_initialized"
  }
}

(* Create quality score *)
fn create_quality_score(logic: float, relevance: float, clarity: float, completeness: float) -> QualityScore {
  let overall = (logic + relevance + clarity + completeness) / 4.0
  return {
    logic_score: logic,
    relevance_score: relevance,
    clarity_score: clarity,
    completeness_score: completeness,
    overall_quality: overall
  }
}

(* Create path result *)
fn create_path(name: string, path_type: string, conf: float, trace: string[]) -> Path {
  return {
    name: name,
    pathway_type: path_type,
    confidence: conf,
    result: [],
    quality_score: conf,
    reasoning_trace: trace,
    execution_time: 0.0
  }
}

(* Validate quality score *)
fn is_valid_quality_score(score: QualityScore) -> boolean {
  return score.overall_quality >= 0.0 && score.overall_quality <= 1.0
}

(* Validate weights *)
fn is_valid_weights(weights: AdaptiveWeights) -> boolean {
  let sum = weights.analytical_weight + weights.creative_weight + weights.empirical_weight
  return sum > 0.99 && sum < 1.01
}
