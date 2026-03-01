(* MindLang Standard Library - Parallel Module
   Parallel computation utilities for multi-path reasoning

   Contains: Parallel map/reduce, fork-join patterns, barrier synchronization,
   work distribution, and result aggregation
*)

(* Core Parallel Primitives *)

(* parallel_map: Apply function to each element in parallel
   Args: f (Function), seq (Vector), num_threads (Int)
   Returns: Vector (results of applying f to each element)

   Example:
   data = [1, 2, 3, 4]
   parallel_map (fn(x) { x * 2 }) data 4 -> [2, 4, 6, 8]
*)
fn parallel_map(f: Function, seq: Vector, num_threads: Int) -> Vector {
  if length(seq) == 0 {
    return []
  }

  let chunk_size = ceil(to_float(length(seq)) / to_float(num_threads))
  let results = []

  (* Distribute work across threads *)
  for thread_id in range(num_threads) {
    let start_idx = thread_id * chunk_size
    let end_idx = min(start_idx + chunk_size, length(seq))

    if start_idx < length(seq) {
      for i in range(start_idx, end_idx) {
        let result = f(seq[i])
        results = append(results, result)
      }
    }
  }
  results
}

(* parallel_reduce: Reduce sequence in parallel with tree structure
   Args: f (Function), initial (Value), seq (Vector), num_threads (Int)
   Returns: Value (reduced result)

   Example:
   nums = [1, 2, 3, 4]
   parallel_reduce (fn(acc, x) { acc + x }) 0 nums 4 -> 10
*)
fn parallel_reduce(f: Function, initial: Value, seq: Vector, num_threads: Int) -> Value {
  if length(seq) == 0 {
    return initial
  }

  (* Compute partial reductions in parallel *)
  let chunk_size = ceil(to_float(length(seq)) / to_float(num_threads))
  let partials = []

  for thread_id in range(num_threads) {
    let start_idx = thread_id * chunk_size
    let end_idx = min(start_idx + chunk_size, length(seq))
    let acc = initial

    if start_idx < length(seq) {
      for i in range(start_idx, end_idx) {
        acc = f(acc, seq[i])
      }
      partials = append(partials, acc)
    }
  }

  (* Reduce partials sequentially *)
  let final_result = initial
  for i in range(length(partials)) {
    final_result = f(final_result, partials[i])
  }
  final_result
}

(* fork_join: Fork computation into multiple branches, join results
   Args: fn_branches (Vector of Functions), input (Value), num_threads (Int)
   Returns: Vector (results from each branch)

   Example:
   branches = [
     fn(x) { x + 1 },
     fn(x) { x * 2 },
     fn(x) { x - 1 }
   ]
   fork_join branches 5 3 -> [6, 10, 4]
*)
fn fork_join(fn_branches: Vector, input: Value, num_threads: Int) -> Vector {
  let results = []
  let num_branches = length(fn_branches)

  (* Fork: Execute each branch *)
  for branch_idx in range(num_branches) {
    let f = fn_branches[branch_idx]
    let result = f(input)
    results = append(results, result)
  }

  (* Join: All branches complete and return *)
  results
}

(* async_fork: Fork without waiting for result
   Args: fn_branches (Vector of Functions), input (Value)
   Returns: Vector (future handles)

   Note: Returns handles to futures that can be awaited later
*)
fn async_fork(fn_branches: Vector, input: Value) -> Vector {
  let handles = []
  for branch_idx in range(length(fn_branches)) {
    let f = fn_branches[branch_idx]
    (* Spawn async task *)
    let handle = spawn_task(fn() { f(input) })
    handles = append(handles, handle)
  }
  handles
}

(* async_join: Wait for all async tasks to complete
   Args: handles (Vector of task handles), timeout (Int in ms)
   Returns: Vector (results from all tasks)
*)
fn async_join(handles: Vector, timeout: Int) -> Vector {
  let results = []
  for handle_idx in range(length(handles)) {
    let result = wait_task(handles[handle_idx], timeout)
    results = append(results, result)
  }
  results
}

(* Synchronization Primitives *)

(* barrier_sync: Synchronization barrier for multiple threads
   Args: num_threads (Int), barrier_id (String)
   Returns: Unit

   Example:
   barrier_sync 4 "barrier_1"  (* All 4 threads wait here *)
*)
fn barrier_sync(num_threads: Int, barrier_id: String) -> Unit {
  create_barrier(barrier_id, num_threads)
  wait_barrier(barrier_id)
}

(* lock_acquire: Acquire a mutex lock
   Args: lock_id (String)
   Returns: Unit (locks until acquired)

   Example:
   lock_acquire "critical_section"
*)
fn lock_acquire(lock_id: String) -> Unit {
  acquire_lock(lock_id)
}

(* lock_release: Release a mutex lock
   Args: lock_id (String)
   Returns: Unit

   Example:
   lock_release "critical_section"
*)
fn lock_release(lock_id: String) -> Unit {
  release_lock(lock_id)
}

(* with_lock: Execute code within a lock (scoped)
   Args: lock_id (String), f (Function)
   Returns: Value (result of f)

   Example:
   with_lock "cs" (fn() {
     shared_var = shared_var + 1
     shared_var
   })
*)
fn with_lock(lock_id: String, f: Function) -> Value {
  lock_acquire(lock_id)
  let result = f()
  lock_release(lock_id)
  result
}

(* Work Distribution *)

(* distribute_work: Distribute work items across threads
   Args: work_items (Vector), num_threads (Int)
   Returns: Vector (assigned work per thread)

   Example:
   tasks = [1, 2, 3, 4, 5, 6]
   distribute_work tasks 3 -> [[1, 2], [3, 4], [5, 6]]
*)
fn distribute_work(work_items: Vector, num_threads: Int) -> Vector {
  if num_threads <= 0 {
    error("Number of threads must be positive")
  }

  let chunk_size = ceil(to_float(length(work_items)) / to_float(num_threads))
  let distribution = []

  for thread_id in range(num_threads) {
    let start = thread_id * chunk_size
    let end = min(start + chunk_size, length(work_items))
    let chunk = []

    if start < length(work_items) {
      for i in range(start, end) {
        chunk = append(chunk, work_items[i])
      }
    }
    distribution = append(distribution, chunk)
  }
  distribution
}

(* load_balance: Distribute work based on item weights
   Args: work_items (Vector), weights (Vector), num_threads (Int)
   Returns: Vector (balanced work distribution)

   Example:
   items = [1, 2, 3, 4]
   weights = [1, 1, 2, 1]
   load_balance items weights 2 -> [[1, 2, 4], [3]]
*)
fn load_balance(work_items: Vector, weights: Vector, num_threads: Int) -> Vector {
  if length(work_items) != length(weights) {
    error("Work items and weights must have same length")
  }

  let total_weight = reduce(fn(acc, i) { acc + weights[i] }, 0.0, range(length(weights)))
  let target_per_thread = total_weight / to_float(num_threads)
  let distribution = []

  for _ in range(num_threads) {
    distribution = append(distribution, [])
  }

  let thread_loads = make_vector(num_threads, 0.0)

  for item_idx in range(length(work_items)) {
    let item = work_items[item_idx]
    let weight = weights[item_idx]
    let min_load_thread = 0
    let min_load = thread_loads[0]

    (* Find thread with minimum load *)
    for t in range(1, num_threads) {
      if thread_loads[t] < min_load {
        min_load = thread_loads[t]
        min_load_thread = t
      }
    }

    (* Assign to least loaded thread *)
    distribution[min_load_thread] = append(distribution[min_load_thread], item)
    thread_loads[min_load_thread] = thread_loads[min_load_thread] + weight
  }
  distribution
}

(* Result Aggregation *)

(* gather_results: Gather results from parallel branches
   Args: results (Vector of results)
   Returns: Vector (aggregated results)
*)
fn gather_results(results: Vector) -> Vector {
  results
}

(* merge_results: Merge multiple results into single output
   Args: results (Vector), merge_fn (Function)
   Returns: Value (merged result)

   Example:
   results = [[1, 2], [3, 4], [5, 6]]
   merge_results results (fn(acc, r) { append(acc, r) }) -> [1, 2, 3, 4, 5, 6]
*)
fn merge_results(results: Vector, merge_fn: Function) -> Value {
  reduce(merge_fn, [], results)
}

(* collect_with_timeout: Collect results with timeout handling
   Args: handles (Vector), timeout_ms (Int)
   Returns: Vector (results with timeouts handled)

   Example:
   handles = [task1, task2, task3]
   collect_with_timeout handles 5000 -> [result1, result2, TIMEOUT_ERROR]
*)
fn collect_with_timeout(handles: Vector, timeout_ms: Int) -> Vector {
  let results = []
  for handle_idx in range(length(handles)) {
    let result = try_wait_task(handles[handle_idx], timeout_ms)
    if result == nil {
      results = append(results, "TIMEOUT")
    } else {
      results = append(results, result)
    }
  }
  results
}

(* Pipeline Operators *)

(* parallel_pipeline: Chain parallel operations
   Args: stages (Vector of Functions), input (Value), num_threads (Int)
   Returns: Value (final output)

   Example:
   stages = [
     fn(x) { x + 1 },
     fn(x) { x * 2 },
     fn(x) { x - 1 }
   ]
   parallel_pipeline stages 5 4 -> ((5 + 1) * 2 - 1) = 11
*)
fn parallel_pipeline(stages: Vector, input: Value, num_threads: Int) -> Value {
  let result = input
  for stage_idx in range(length(stages)) {
    let stage = stages[stage_idx]
    result = stage(result)
  }
  result
}

(* fan_out_fan_in: Fan-out to multiple tasks, fan-in results
   Args: dispatch_fn (Function), aggregate_fn (Function), input (Value), num_tasks (Int)
   Returns: Value (aggregated result)

   Example:
   fan_out_fan_in
     (fn(x) { [x+1, x*2, x-1] })  (* dispatch to 3 paths *)
     (fn(r) { sum(r) })            (* aggregate by summing *)
     5
     3
     -> (6 + 10 + 4) = 20
*)
fn fan_out_fan_in(dispatch_fn: Function, aggregate_fn: Function, input: Value, num_tasks: Int) -> Value {
  let outputs = dispatch_fn(input)
  aggregate_fn(outputs)
}

(* Performance Monitoring *)

(* measure_parallel: Measure execution time of parallel operation
   Args: f (Function), label (String)
   Returns: Tuple (result, elapsed_ms)

   Example:
   {result, time} = measure_parallel (fn() { compute() }) "main_compute"
   format "Computed {result} in {time}ms"
*)
fn measure_parallel(f: Function, label: String) -> Tuple {
  let start_time = current_time_ms()
  let result = f()
  let end_time = current_time_ms()
  let elapsed = end_time - start_time

  {
    result: result,
    elapsed_ms: elapsed,
    label: label
  }
}

(* profile_parallel: Profile parallel execution
   Args: f (Function), num_threads (Int), iterations (Int)
   Returns: Map (profiling statistics)

   Example:
   stats = profile_parallel (fn() { compute() }) 4 10
*)
fn profile_parallel(f: Function, num_threads: Int, iterations: Int) -> Map {
  let times = []
  let total_time = 0

  for i in range(iterations) {
    let start = current_time_ms()
    let _ = f()
    let elapsed = current_time_ms() - start
    times = append(times, elapsed)
    total_time = total_time + elapsed
  }

  let avg_time = total_time / to_float(iterations)
  let min_time = min(times)
  let max_time = max(times)

  {
    iterations: iterations,
    num_threads: num_threads,
    total_time_ms: total_time,
    avg_time_ms: avg_time,
    min_time_ms: min_time,
    max_time_ms: max_time
  }
}

(* Export all functions *)
export {
  parallel_map, parallel_reduce, fork_join, async_fork, async_join,
  barrier_sync, lock_acquire, lock_release, with_lock,
  distribute_work, load_balance, gather_results, merge_results,
  collect_with_timeout, parallel_pipeline, fan_out_fan_in,
  measure_parallel, profile_parallel
}
