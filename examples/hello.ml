(* MindLang Example: Hello World
   A simple introductory example demonstrating basic MindLang operations

   This example shows:
   - Query specification
   - Encoding (query to latent representation)
   - Sampling from distribution
   - Detokenization (latent to output text)
*)

(* Define the main computation *)
program hello {
  (* Input query *)
  query "Hello world" -> q

  (* Encode query to latent representation *)
  encode q -> z

  (* Sample from the latent representation with temperature 0.5 *)
  sample z 0.5 -> output

  (* Detokenize to Korean output *)
  detokenize output -> result

  (* Return result *)
  return result
}
