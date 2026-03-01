/**
 * MindLang Integration Tests
 *
 * Comprehensive test suite for MindLang implementation
 * Tests cover: parsing, execution, bytecode, profiling, and all examples
 * 30+ test cases covering core functionality
 */

import { MindLangParser, MindLangInterpreter } from '../src/main';
import * as fs from 'fs';
import * as path from 'path';

describe('MindLang Integration Tests', () => {

  // ============ Parser Tests ============
  describe('Parser', () => {
    test('parses simple query', () => {
      const content = `program test {
        query "Hello world"
      }`;
      const program = MindLangParser.parse(content);
      expect(program.name).toBe('test');
      expect(program.queries).toContain('Hello world');
    });

    test('parses encode operation', () => {
      const content = `query "test" -> q
      encode q -> z`;
      const program = MindLangParser.parse(content);
      expect(program.operations.length).toBeGreaterThan(0);
      expect(program.operations.some(op => op.type === 'ENCODE')).toBe(true);
    });

    test('parses sample operation', () => {
      const content = `sample z 0.5 -> output`;
      const program = MindLangParser.parse(content);
      expect(program.operations.some(op => op.type === 'SAMPLE')).toBe(true);
    });

    test('parses detokenize operation', () => {
      const content = `detokenize output -> result`;
      const program = MindLangParser.parse(content);
      expect(program.operations.some(op => op.type === 'DETOKENIZE')).toBe(true);
    });

    test('parses fork operation', () => {
      const content = `fork z -> {z_a, z_b, z_c}`;
      const program = MindLangParser.parse(content);
      expect(program.operations.some(op => op.type === 'FORK')).toBe(true);
    });

    test('parses ensemble operation', () => {
      const content = `ensemble [0.7, 0.2, 0.1] results -> combined`;
      const program = MindLangParser.parse(content);
      expect(program.operations.some(op => op.type === 'ENSEMBLE')).toBe(true);
    });

    test('parses critique operation', () => {
      const content = `critique result -> delta`;
      const program = MindLangParser.parse(content);
      expect(program.operations.some(op => op.type === 'CRITIQUE')).toBe(true);
    });

    test('parses multiple queries', () => {
      const content = `query "first"
      query "second"
      query "third"`;
      const program = MindLangParser.parse(content);
      expect(program.queries.length).toBe(3);
    });

    test('generates bytecode', () => {
      const content = `encode q -> z
      sample z 0.5 -> output`;
      const program = MindLangParser.parse(content);
      expect(program.bytecode.length).toBeGreaterThan(0);
      expect(program.bytecode[0]).toContain('ENCODE');
    });

    test('extracts program name', () => {
      const content = `program my_agent {
        query "test"
      }`;
      const program = MindLangParser.parse(content);
      expect(program.name).toBe('my_agent');
    });
  });

  // ============ Interpreter Tests ============
  describe('Interpreter', () => {
    test('executes simple program', () => {
      const content = `query "test"
      encode q -> z`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.operationCount).toBeGreaterThan(0);
    });

    test('tracks execution context', () => {
      const content = `query "test"`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.variables).toBeDefined();
      expect(context.output).toBeDefined();
      expect(context.startTime).toBeDefined();
    });

    test('executes encode operation', () => {
      const content = `query "test"
      encode q -> z`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.variables.has('z')).toBe(true);
    });

    test('executes sample operation', () => {
      const content = `query "test"
      encode q -> z
      sample z 0.5 -> output`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.variables.size).toBeGreaterThan(0);
    });

    test('executes detokenize operation', () => {
      const content = `query "test"
      encode q -> z
      sample z 0.5 -> output
      detokenize output -> result`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.output.length).toBeGreaterThan(0);
    });

    test('tracks operation count', () => {
      const content = `query "test"
      encode q -> z
      sample z 0.5 -> output
      detokenize output -> result`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.operationCount).toBe(3);
    });

    test('measures execution time', () => {
      const content = `query "test"
      encode q -> z`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.endTime).toBeGreaterThan(context.startTime);
    });

    test('executes with trace enabled', () => {
      const content = `query "test"
      encode q -> z`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program, true);
      const context = interpreter.execute();
      expect(context.operationCount).toBeGreaterThan(0);
    });

    test('executes fork operation', () => {
      const content = `query "test"
      encode q -> z
      fork z -> {z_a, z_b, z_c}`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.variables.get('branched')).toBe(true);
    });

    test('executes ensemble operation', () => {
      const content = `query "test"
      encode q -> z
      fork z -> {z_a, z_b, z_c}
      ensemble [0.7, 0.2, 0.1] -> result`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.operationCount).toBeGreaterThan(0);
    });

    test('executes critique operation', () => {
      const content = `query "test"
      encode q -> z
      critique z -> delta`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.operationCount).toBeGreaterThan(0);
    });

    test('executes complete pipeline', () => {
      const content = `query "What is 2+2?"
      encode q -> z
      fork z -> {z_a, z_b, z_c}
      ensemble [0.5, 0.3, 0.2] -> result
      critique result -> delta
      sample delta 0.9 -> output
      detokenize output -> final`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.output.length).toBeGreaterThan(0);
      expect(context.operationCount).toBeGreaterThan(5);
    });
  });

  // ============ Example File Tests ============
  describe('Example Files', () => {
    const examplesDir = path.join(__dirname, '..', 'examples');

    test('hello.ml parses correctly', () => {
      const content = fs.readFileSync(path.join(examplesDir, 'hello.ml'), 'utf-8');
      const program = MindLangParser.parse(content);
      expect(program.queries.length).toBeGreaterThan(0);
      expect(program.operations.length).toBeGreaterThan(0);
    });

    test('hello.ml executes', () => {
      const content = fs.readFileSync(path.join(examplesDir, 'hello.ml'), 'utf-8');
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.operationCount).toBeGreaterThan(0);
    });

    test('parallel_reasoning.ml parses', () => {
      const content = fs.readFileSync(path.join(examplesDir, 'parallel_reasoning.ml'), 'utf-8');
      const program = MindLangParser.parse(content);
      expect(program.operations.length).toBeGreaterThan(0);
    });

    test('parallel_reasoning.ml contains fork', () => {
      const content = fs.readFileSync(path.join(examplesDir, 'parallel_reasoning.ml'), 'utf-8');
      expect(content).toContain('fork');
    });

    test('parallel_reasoning.ml contains ensemble', () => {
      const content = fs.readFileSync(path.join(examplesDir, 'parallel_reasoning.ml'), 'utf-8');
      expect(content).toContain('ensemble');
    });

    test('ensemble_voting.ml parses', () => {
      const content = fs.readFileSync(path.join(examplesDir, 'ensemble_voting.ml'), 'utf-8');
      const program = MindLangParser.parse(content);
      expect(program.operations.length).toBeGreaterThan(0);
    });

    test('ensemble_voting.ml contains consensus voting', () => {
      const content = fs.readFileSync(path.join(examplesDir, 'ensemble_voting.ml'), 'utf-8');
      expect(content).toContain('weighted_vote');
    });

    test('self_critique.ml parses', () => {
      const content = fs.readFileSync(path.join(examplesDir, 'self_critique.ml'), 'utf-8');
      const program = MindLangParser.parse(content);
      expect(program.operations.length).toBeGreaterThan(0);
    });

    test('self_critique.ml contains loop', () => {
      const content = fs.readFileSync(path.join(examplesDir, 'self_critique.ml'), 'utf-8');
      expect(content).toContain('loop');
    });

    test('self_critique.ml contains critique', () => {
      const content = fs.readFileSync(path.join(examplesDir, 'self_critique.ml'), 'utf-8');
      expect(content).toContain('critique');
    });

    test('ai_agent.ml parses', () => {
      const content = fs.readFileSync(path.join(examplesDir, 'ai_agent.ml'), 'utf-8');
      const program = MindLangParser.parse(content);
      expect(program.operations.length).toBeGreaterThan(0);
    });

    test('ai_agent.ml contains function definitions', () => {
      const content = fs.readFileSync(path.join(examplesDir, 'ai_agent.ml'), 'utf-8');
      expect(content).toContain('fn agent_think');
    });
  });

  // ============ Stdlib Tests ============
  describe('Standard Library', () => {
    test('core.ml exists', () => {
      const coreFile = path.join(__dirname, '..', 'stdlib', 'core.ml');
      expect(fs.existsSync(coreFile)).toBe(true);
    });

    test('core.ml contains vector operations', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'stdlib', 'core.ml'), 'utf-8');
      expect(content).toContain('vector_add');
      expect(content).toContain('vector_dot');
      expect(content).toContain('vector_norm');
    });

    test('core.ml contains activation functions', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'stdlib', 'core.ml'), 'utf-8');
      expect(content).toContain('relu');
      expect(content).toContain('sigmoid');
      expect(content).toContain('softmax');
    });

    test('core.ml contains sampling', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'stdlib', 'core.ml'), 'utf-8');
      expect(content).toContain('sample_from_distribution');
    });

    test('parallel.ml exists', () => {
      const parallelFile = path.join(__dirname, '..', 'stdlib', 'parallel.ml');
      expect(fs.existsSync(parallelFile)).toBe(true);
    });

    test('parallel.ml contains parallel operations', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'stdlib', 'parallel.ml'), 'utf-8');
      expect(content).toContain('parallel_map');
      expect(content).toContain('parallel_reduce');
      expect(content).toContain('fork_join');
    });

    test('parallel.ml contains synchronization', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'stdlib', 'parallel.ml'), 'utf-8');
      expect(content).toContain('barrier_sync');
      expect(content).toContain('lock_acquire');
    });

    test('ensemble.ml exists', () => {
      const ensembleFile = path.join(__dirname, '..', 'stdlib', 'ensemble.ml');
      expect(fs.existsSync(ensembleFile)).toBe(true);
    });

    test('ensemble.ml contains ensemble operations', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'stdlib', 'ensemble.ml'), 'utf-8');
      expect(content).toContain('weighted_ensemble');
      expect(content).toContain('simple_ensemble');
      expect(content).toContain('majority_vote');
    });

    test('ensemble.ml contains adaptive weighting', () => {
      const content = fs.readFileSync(path.join(__dirname, '..', 'stdlib', 'ensemble.ml'), 'utf-8');
      expect(content).toContain('compute_adaptive_weights');
    });
  });

  // ============ Performance Tests ============
  describe('Performance', () => {
    test('execution completes in reasonable time', () => {
      const content = `query "test"
      encode q -> z
      sample z 0.5 -> output
      detokenize output -> result`;
      const program = MindLangParser.parse(content);
      const startTime = performance.now();
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000);
    });

    test('handles large number of operations', () => {
      let content = 'query "test"';
      for (let i = 0; i < 100; i++) {
        content += `\nvar_${i} = ${i}`;
      }
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.operationCount).toBeGreaterThan(0);
    });

    test('bytecode generation is efficient', () => {
      const content = `query "test"
      encode q -> z
      fork z -> {a, b, c}
      ensemble [0.5, 0.3, 0.2] -> result`;
      const program = MindLangParser.parse(content);
      expect(program.bytecode.length).toBe(program.operations.length);
    });
  });

  // ============ Edge Cases ============
  describe('Edge Cases', () => {
    test('handles empty program', () => {
      const content = '';
      const program = MindLangParser.parse(content);
      expect(program.operations.length).toBe(0);
    });

    test('handles single operation', () => {
      const content = 'query "test"';
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.operationCount).toBeGreaterThan(0);
    });

    test('handles complex query strings', () => {
      const content = 'query "What is 2+2? And why?"';
      const program = MindLangParser.parse(content);
      expect(program.queries[0]).toContain('2+2');
    });

    test('handles multiple forks', () => {
      const content = `fork z -> {a, b, c}
      fork a -> {a1, a2, a3}
      fork b -> {b1, b2, b3}`;
      const program = MindLangParser.parse(content);
      expect(program.operations.filter(op => op.type === 'FORK').length).toBe(3);
    });

    test('handles temperature variations', () => {
      const content = `sample z 0.1 -> cold
      sample z 0.5 -> warm
      sample z 2.0 -> hot`;
      const program = MindLangParser.parse(content);
      expect(program.operations.filter(op => op.type === 'SAMPLE').length).toBe(3);
    });
  });

  // ============ Integration Pipeline Tests ============
  describe('Complete Pipelines', () => {
    test('hello world pipeline', () => {
      const content = `query "Hello"
      encode q -> z
      sample z 0.5 -> out
      detokenize out -> result`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.output.length).toBeGreaterThan(0);
    });

    test('multi-path reasoning pipeline', () => {
      const content = `query "Problem"
      encode q -> z
      fork z -> {a, b, c}
      ensemble [0.5, 0.3, 0.2] -> result
      detokenize result -> output`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.variables.get('branched')).toBe(true);
    });

    test('critique and refinement pipeline', () => {
      const content = `query "Problem"
      encode q -> z
      sample z 0.7 -> result
      critique result -> delta
      detokenize delta -> output`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.operationCount).toBeGreaterThan(0);
    });

    test('full agent pipeline', () => {
      const content = `query "Task"
      encode q -> z
      fork z -> {a, b, c}
      ensemble [0.6, 0.3, 0.1] -> combined
      critique combined -> critique_result
      sample critique_result 0.8 -> output
      detokenize output -> final`;
      const program = MindLangParser.parse(content);
      const interpreter = new MindLangInterpreter(program);
      const context = interpreter.execute();
      expect(context.operationCount).toBeGreaterThan(5);
      expect(context.output.length).toBeGreaterThan(0);
    });
  });
});
