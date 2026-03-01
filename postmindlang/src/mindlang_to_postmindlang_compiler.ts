/**
 * MindLang → PostMindLang 컴파일러
 * MindLang 프로그램을 파싱하여 PostMindLang 벡터 연산으로 변환
 */

// ============================================================================
// AST Types
// ============================================================================

interface ASTNode {
  type: string;
}

interface Program extends ASTNode {
  type: 'program';
  name: string;
  body: Statement[];
}

interface Statement extends ASTNode {}

interface QueryStatement extends Statement {
  type: 'query';
  text: string;
  target: string;
}

interface EncodeStatement extends Statement {
  type: 'encode';
  input: string;
  output: string;
}

interface ForkStatement extends Statement {
  type: 'fork';
  input: string;
  outputs: string[];
}

interface PathAssignment extends Statement {
  type: 'path_assignment';
  name: string;
  func: string;
  args: string[];
}

interface EnsembleStatement extends Statement {
  type: 'ensemble';
  weights: number[];
  inputs: string[];
  output: string;
}

interface CritiqueStatement extends Statement {
  type: 'critique';
  input: string;
  output: string;
}

interface SampleStatement extends Statement {
  type: 'sample';
  input: string;
  temperature: number;
  output: string;
}

interface ReturnStatement extends Statement {
  type: 'return';
  value: string;
}

// ============================================================================
// MindLang Lexer
// ============================================================================

class MindLangLexer {
  private tokens: string[] = [];
  private pos = 0;

  tokenize(source: string): string[] {
    // Remove comments
    source = source.replace(/\(\*[\s\S]*?\*\)/g, '');

    // Split into tokens (-> must come before -)
    const pattern = /->|[a-zA-Z_][a-zA-Z0-9_]*|"[^"]*"|[0-9]+\.?[0-9]*|[{}()\[\],\->;=]|:/g;
    return source.match(pattern) || [];
  }
}

// ============================================================================
// MindLang Parser
// ============================================================================

class MindLangParser {
  private tokens: string[] = [];
  private pos = 0;

  parse(source: string): Program {
    const lexer = new MindLangLexer();
    this.tokens = lexer.tokenize(source);
    this.pos = 0;

    return this.parseProgram();
  }

  private parseProgram(): Program {
    this.expect('program');
    const name = this.tokens[this.pos++];
    this.expect('{');

    const body: Statement[] = [];
    while (this.current() !== '}') {
      body.push(this.parseStatement());
    }

    this.expect('}');

    return {
      type: 'program',
      name,
      body,
    };
  }

  private parseStatement(): Statement {
    const current = this.current();

    if (current === 'query') {
      return this.parseQueryStatement();
    } else if (current === 'encode') {
      return this.parseEncodeStatement();
    } else if (current === 'fork') {
      return this.parseForkStatement();
    } else if (current === 'ensemble') {
      return this.parseEnsembleStatement();
    } else if (current === 'critique') {
      return this.parseCritiqueStatement();
    } else if (current === 'sample') {
      return this.parseSampleStatement();
    } else if (current === 'return') {
      return this.parseReturnStatement();
    } else if (this.tokens[this.pos + 1] === '=') {
      return this.parsePathAssignment();
    }

    throw new Error(`Unknown statement: ${current}`);
  }

  private parseQueryStatement(): QueryStatement {
    this.expect('query');
    const text = this.parseString();
    this.expect('->');
    const target = this.tokens[this.pos++];
    return { type: 'query', text, target };
  }

  private parseEncodeStatement(): EncodeStatement {
    this.expect('encode');
    const input = this.tokens[this.pos++];
    this.expect('->');
    const output = this.tokens[this.pos++];
    return { type: 'encode', input, output };
  }

  private parseForkStatement(): ForkStatement {
    this.expect('fork');
    const input = this.tokens[this.pos++];
    this.expect('->');
    this.expect('{');
    const outputs: string[] = [];
    while (this.current() !== '}') {
      outputs.push(this.tokens[this.pos++]);
      if (this.current() === ',') this.pos++;
    }
    this.expect('}');
    return { type: 'fork', input, outputs };
  }

  private parseEnsembleStatement(): EnsembleStatement {
    this.expect('ensemble');
    this.expect('[');
    const weights: number[] = [];
    while (this.current() !== ']') {
      weights.push(parseFloat(this.tokens[this.pos++]));
      if (this.current() === ',') this.pos++;
    }
    this.expect(']');
    this.expect('[');
    const inputs: string[] = [];
    while (this.current() !== ']') {
      inputs.push(this.tokens[this.pos++]);
      if (this.current() === ',') this.pos++;
    }
    this.expect(']');
    this.expect('->');
    const output = this.tokens[this.pos++];
    return { type: 'ensemble', weights, inputs, output };
  }

  private parseCritiqueStatement(): CritiqueStatement {
    this.expect('critique');
    const input = this.tokens[this.pos++];
    this.expect('->');
    const output = this.tokens[this.pos++];
    return { type: 'critique', input, output };
  }

  private parseSampleStatement(): SampleStatement {
    this.expect('sample');
    const input = this.tokens[this.pos++];
    const temperature = parseFloat(this.tokens[this.pos++]);
    this.expect('->');
    const output = this.tokens[this.pos++];
    return { type: 'sample', input, temperature, output };
  }

  private parseReturnStatement(): ReturnStatement {
    this.expect('return');
    const value = this.tokens[this.pos++];
    return { type: 'return', value };
  }

  private parsePathAssignment(): PathAssignment {
    const name = this.tokens[this.pos++];
    this.expect('=');
    const func = this.tokens[this.pos++];
    this.expect('(');
    const args: string[] = [];
    while (this.current() !== ')') {
      args.push(this.tokens[this.pos++]);
      if (this.current() === ',') this.pos++;
    }
    this.expect(')');
    return { type: 'path_assignment', name, func, args };
  }

  private parseString(): string {
    const token = this.tokens[this.pos++];
    if (token && token.startsWith('"') && token.endsWith('"')) {
      return token.slice(1, -1);
    }
    throw new Error(`Expected string, got ${token}`);
  }

  private expect(expected: string): void {
    if (this.current() !== expected) {
      throw new Error(`Expected '${expected}', got '${this.current()}'`);
    }
    this.pos++;
  }

  private current(): string {
    return this.tokens[this.pos] || '';
  }
}

// ============================================================================
// PostMindLang Code Generator
// ============================================================================

class PostMindLangGenerator {
  private varMap: Map<string, string> = new Map();
  private dimMap: Map<string, number> = new Map();

  generate(program: Program): string {
    const lines: string[] = [
      '// PostMindLang Compiled Program',
      `// Generated from MindLang: ${program.name}`,
      '',
      'const PostMindLang = require("./postmindlang.js");',
      'const runtime = new PostMindLang.Runtime();',
      ''
    ];

    for (const stmt of program.body) {
      lines.push(...this.generateStatement(stmt));
    }

    lines.push('');
    lines.push('console.log("✅ PostMindLang Program Completed");');

    return lines.join('\n');
  }

  private generateStatement(stmt: Statement): string[] {
    switch (stmt.type) {
      case 'query':
        return this.generateQuery(stmt as QueryStatement);
      case 'encode':
        return this.generateEncode(stmt as EncodeStatement);
      case 'fork':
        return this.generateFork(stmt as ForkStatement);
      case 'path_assignment':
        return this.generatePathAssignment(stmt as PathAssignment);
      case 'ensemble':
        return this.generateEnsemble(stmt as EnsembleStatement);
      case 'critique':
        return this.generateCritique(stmt as CritiqueStatement);
      case 'sample':
        return this.generateSample(stmt as SampleStatement);
      case 'return':
        return this.generateReturn(stmt as ReturnStatement);
      default:
        return [];
    }
  }

  private generateQuery(stmt: QueryStatement): string[] {
    this.dimMap.set(stmt.target, 768);
    return [
      `// Query: "${stmt.text}"`,
      `const ${stmt.target} = encodeQuery("${stmt.text}", 768);`
    ];
  }

  private generateEncode(stmt: EncodeStatement): string[] {
    this.dimMap.set(stmt.output, 512);
    return [
      `// Encode: ${stmt.input} → ${stmt.output}`,
      `const ${stmt.output} = encodeLatent(${stmt.input}, 512);`
    ];
  }

  private generateFork(stmt: ForkStatement): string[] {
    const lines: string[] = [
      `// Fork: ${stmt.input} → {${stmt.outputs.join(', ')}}`
    ];

    for (const output of stmt.outputs) {
      this.dimMap.set(output, 256);
      lines.push(`const ${output} = ${stmt.input}.slice(0, 256);`);
    }

    return lines;
  }

  private generatePathAssignment(stmt: PathAssignment): string[] {
    const pathMap: { [key: string]: string } = {
      'analytical_reasoning': 'reluPath',
      'creative_reasoning': 'tanhPath',
      'empirical_reasoning': 'sigmoidPath'
    };

    const pathFunc = pathMap[stmt.func] || 'identityPath';
    return [
      `// Path: ${stmt.name} = ${stmt.func}(${stmt.args.join(', ')})`,
      `const ${stmt.name} = ${pathFunc}(${stmt.args.join(', ')});`
    ];
  }

  private generateEnsemble(stmt: EnsembleStatement): string[] {
    this.dimMap.set(stmt.output, 256);
    const weightsStr = `[${stmt.weights.join(', ')}]`;
    return [
      `// Ensemble with weights: ${stmt.weights.map((w, i) => `${stmt.inputs[i]}=${w}`).join(', ')}`,
      `const ${stmt.output} = ensembleVectors(${weightsStr}, [${stmt.inputs.join(', ')}]);`
    ];
  }

  private generateCritique(stmt: CritiqueStatement): string[] {
    return [
      `// Critique (Self-evaluation)`,
      `const ${stmt.output} = critiqueVector(${stmt.input});`
    ];
  }

  private generateSample(stmt: SampleStatement): string[] {
    return [
      `// Sample with temperature: ${stmt.temperature}`,
      `const ${stmt.output} = sampleVector(${stmt.input}, ${stmt.temperature});`
    ];
  }

  private generateReturn(stmt: ReturnStatement): string[] {
    return [
      `// Return final result`,
      `console.log("Result:", ${stmt.value});`
    ];
  }
}

// ============================================================================
// Main Compiler
// ============================================================================

class MindLangToPostMindLangCompiler {
  compile(source: string): string {
    // Parse MindLang
    const parser = new MindLangParser();
    const program = parser.parse(source);

    // Generate PostMindLang
    const generator = new PostMindLangGenerator();
    return generator.generate(program);
  }
}

// ============================================================================
// Runtime Helper Functions (for execution)
// ============================================================================

const encodeQuery = (text: string, dim: number) => {
  const vec = new Float64Array(dim);
  for (let i = 0; i < text.length; i++) {
    vec[i % dim] += (text.charCodeAt(i) / 256) * 0.1;
  }
  // L2 normalize
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  for (let i = 0; i < dim; i++) vec[i] /= (norm || 1);
  return vec;
};

const encodeLatent = (vec: Float64Array, newDim: number) => {
  return vec.slice(0, newDim);
};

const reluPath = (z: Float64Array) => {
  return new Float64Array(z.map(x => Math.max(0, x)));
};

const tanhPath = (z: Float64Array) => {
  return new Float64Array(z.map(x => Math.tanh(x * 2)));
};

const sigmoidPath = (z: Float64Array) => {
  return new Float64Array(z.map(x => 1 / (1 + Math.exp(-x * 2))));
};

const ensembleVectors = (weights: number[], vecs: Float64Array[]) => {
  const result = new Float64Array(vecs[0].length);
  for (let i = 0; i < vecs[0].length; i++) {
    for (let j = 0; j < vecs.length; j++) {
      result[i] += weights[j] * vecs[j][i];
    }
  }
  return result;
};

const critiqueVector = (vec: Float64Array) => {
  let norm = 0;
  for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  const confidence = Math.min(1, norm * 0.7);
  console.log(`  Confidence: ${confidence.toFixed(4)}`);
  return vec;
};

const sampleVector = (vec: Float64Array, temp: number) => {
  return vec.map(x => x * temp);
};

// ============================================================================
// Main Execution
// ============================================================================

console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
console.log('║          MindLang → PostMindLang Compiler Demo                          ║');
console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

// MindLang source code
const mindlangSource = `
program hello_analysis {
  query "What is artificial intelligence?" -> q

  encode q -> z

  fork z -> {z_a, z_b, z_c}

  path_a = analytical_reasoning(z_a)
  path_b = creative_reasoning(z_b)
  path_c = empirical_reasoning(z_c)

  ensemble [0.5, 0.25, 0.25] [path_a, path_b, path_c] -> combined

  critique combined -> delta

  sample delta 0.7 -> output

  return output
}
`;

try {
  const compiler = new MindLangToPostMindLangCompiler();
  const postmindlangCode = compiler.compile(mindlangSource);

  console.log('📝 Input MindLang Program:');
  console.log('───────────────────────────────────────────────────────────────────────────');
  console.log(mindlangSource);

  console.log('\n🔧 Generated PostMindLang Code:');
  console.log('───────────────────────────────────────────────────────────────────────────');
  console.log(postmindlangCode);

  console.log('\n✅ Compilation Successful!');
  console.log('───────────────────────────────────────────────────────────────────────────');

} catch (error) {
  console.error('❌ Compilation Error:', error);
}

console.log('\n');

// Export for use
module.exports = { MindLangToPostMindLangCompiler };
