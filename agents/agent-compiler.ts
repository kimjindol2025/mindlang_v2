/**
 * MindLang Agent Compiler
 * Compiles agent specifications to executable bytecode
 * Approximately 300 lines
 */

import { ASTNode, Program } from '../src/ast';
import {
  CompiledAgent,
  BytecodeProgram,
  WeightConfig,
  CritiqueConfig,
  AgentMetadata,
  CompilationError,
  Instruction,
} from './types';

// ============================================================================
// Type Definitions for Compilation
// ============================================================================

interface PathDefinition {
  name: 'analytical' | 'creative' | 'empirical';
  instructions: Instruction[];
  constants: Map<number, any>;
  entryPoint: number;
  exitPoint: number;
}

interface CompilationContext {
  pathDefinitions: Map<string, PathDefinition>;
  constants: Map<number, any>;
  currentPath: string;
  constantCounter: number;
  instructionCounter: number;
  symbolTable: Map<string, SymbolInfo>;
  errors: string[];
}

interface SymbolInfo {
  name: string;
  type: string;
  scope: string;
  defined: boolean;
  used: boolean;
}

// ============================================================================
// MindLang Agent Compiler
// ============================================================================

export class MindLangAgentCompiler {
  private context: CompilationContext;

  constructor() {
    this.context = {
      pathDefinitions: new Map(),
      constants: new Map(),
      currentPath: 'main',
      constantCounter: 0,
      instructionCounter: 0,
      symbolTable: new Map(),
      errors: [],
    };
  }

  /**
   * Main compilation entry point
   */
  compile(agentCode: string): CompiledAgent {
    try {
      // Step 1: Parse MindLang agent code
      const ast = this.parseMindLang(agentCode);

      // Step 2: Type check AST
      this.typeCheck(ast);

      // Step 3: Extract three reasoning paths
      const analyticalPath = this.extractPath(ast, 'analytical');
      const creativePath = this.extractPath(ast, 'creative');
      const empiricalPath = this.extractPath(ast, 'empirical');

      // Step 4: Compile each path to bytecode
      const analyticalBC = this.compilePath(analyticalPath, 'analytical');
      const creativeBC = this.compilePath(creativePath, 'creative');
      const empiricalBC = this.compilePath(empiricalPath, 'empirical');

      // Step 5: Extract configuration
      const weights = this.extractWeights(ast);
      const critique = this.extractCritique(ast);
      const metadata = this.extractMetadata(ast);

      // Step 6: Validate compilation
      if (this.context.errors.length > 0) {
        throw new CompilationError(
          `Compilation failed with ${this.context.errors.length} errors:\n${this.context.errors.join('\n')}`,
          { errors: this.context.errors }
        );
      }

      return {
        analytical: analyticalBC,
        creative: creativeBC,
        empirical: empiricalBC,
        weights,
        critique,
        metadata,
      };
    } catch (error) {
      if (error instanceof CompilationError) {
        throw error;
      }
      throw new CompilationError(`Unexpected compilation error: ${error}`, { error });
    }
  }

  /**
   * Parse MindLang agent syntax
   */
  private parseMindLang(code: string): any {
    // Simplified parsing - extract agent structure
    const analyticalMatch = code.match(/analytical\s*:\s*{([^}]*)}/s);
    const creativeMatch = code.match(/creative\s*:\s*{([^}]*)}/s);
    const empiricalMatch = code.match(/empirical\s*:\s*{([^}]*)}/s);
    const weightsMatch = code.match(/weights\s*:\s*({[^}]*)}/s);

    return {
      analytical: analyticalMatch ? analyticalMatch[1] : '',
      creative: creativeMatch ? creativeMatch[1] : '',
      empirical: empiricalMatch ? empiricalMatch[1] : '',
      weights: weightsMatch ? weightsMatch[1] : '{}',
      raw: code,
    };
  }

  /**
   * Type check the AST
   */
  private typeCheck(ast: any): void {
    // Verify paths exist
    if (!ast.analytical || ast.analytical.trim().length === 0) {
      this.context.errors.push('Missing analytical path');
    }
    if (!ast.creative || ast.creative.trim().length === 0) {
      this.context.errors.push('Missing creative path');
    }
    if (!ast.empirical || ast.empirical.trim().length === 0) {
      this.context.errors.push('Missing empirical path');
    }

    // Check for required variables
    const requiredVars = ['query', 'z', 'z_a', 'z_b', 'z_c', 'weights', 'ensemble'];
    for (const varName of requiredVars) {
      if (!ast.raw.includes(varName)) {
        // Only warn, don't error
        console.warn(`Variable '${varName}' not found in agent code`);
      }
    }
  }

  /**
   * Extract specific path from AST
   */
  private extractPath(ast: any, pathType: 'analytical' | 'creative' | 'empirical'): string {
    const pathCode = ast[pathType];
    if (!pathCode) {
      this.context.errors.push(`Path '${pathType}' not found`);
      return '';
    }
    return pathCode;
  }

  /**
   * Compile a path to bytecode
   */
  private compilePath(pathCode: string, pathType: 'analytical' | 'creative' | 'empirical'): BytecodeProgram {
    const instructions: Instruction[] = [];
    const constants = new Map<number, any>();

    // Simulate bytecode generation based on path type
    const entryPoint = 0;

    // Add standard prologue instructions
    instructions.push({
      opcode: 0x01, // LOAD_LOCAL (z)
      operands: [0],
    });

    // Path-specific operations
    switch (pathType) {
      case 'analytical':
        // z_a = ReLU(W_a · z + b_a)
        instructions.push({
          opcode: 0x20, // MATMUL
          operands: [0],
        });
        instructions.push({
          opcode: 0x05, // RELU
          operands: [],
        });
        instructions.push({
          opcode: 0x02, // PROJECT_A
          operands: [],
        });
        break;

      case 'creative':
        // z_b = TANH(W_b · z + b_b + ε)
        instructions.push({
          opcode: 0x20, // MATMUL
          operands: [0],
        });
        instructions.push({
          opcode: 0x04, // DROPOUT
          operands: [0.1],
        });
        instructions.push({
          opcode: 0x06, // TANH
          operands: [],
        });
        instructions.push({
          opcode: 0x03, // PROJECT_B
          operands: [],
        });
        break;

      case 'empirical':
        // z_c = SIGMOID(W_c · z + b_c)
        instructions.push({
          opcode: 0x20, // MATMUL
          operands: [0],
        });
        instructions.push({
          opcode: 0x07, // SIGMOID
          operands: [],
        });
        instructions.push({
          opcode: 0x04, // PROJECT_C
          operands: [],
        });
        break;
    }

    // Add standard epilogue
    instructions.push({
      opcode: 0xff, // HALT
      operands: [],
    });

    return {
      instructions,
      constants,
      entryPoint,
      exitPoint: instructions.length - 1,
    };
  }

  /**
   * Extract weight configuration from AST
   */
  private extractWeights(ast: any): WeightConfig {
    const weightsStr = ast.weights || '{}';

    // Parse weights configuration
    const adaptiveMatch = weightsStr.match(/adaptive\s*:\s*(true|false)/);
    const strategyMatch = weightsStr.match(/strategy\s*:\s*["']([^"']+)["']/);
    const learningRateMatch = weightsStr.match(/learningRate\s*:\s*([0-9.]+)/);

    return {
      adaptiveMode: adaptiveMatch ? adaptiveMatch[1] === 'true' : true,
      initialWeights: [0.33, 0.33, 0.34],
      updateStrategy: (strategyMatch ? strategyMatch[1] : 'softmax') as 'softmax' | 'temperature' | 'dynamic',
      learningRate: learningRateMatch ? parseFloat(learningRateMatch[1]) : 0.1,
    };
  }

  /**
   * Extract critique configuration from AST
   */
  private extractCritique(ast: any): CritiqueConfig {
    const confidenceThresholdMatch = ast.raw.match(/confidenceThreshold\s*:\s*([0-9.]+)/);
    const retryLimitMatch = ast.raw.match(/retryLimit\s*:\s*(\d+)/);

    return {
      confidenceThreshold: confidenceThresholdMatch ? parseFloat(confidenceThresholdMatch[1]) : 0.8,
      retryLimit: retryLimitMatch ? parseInt(retryLimitMatch[1]) : 3,
      refinementStrategies: ['expand', 'clarify', 'verify'],
      selfCheckEnabled: true,
    };
  }

  /**
   * Extract metadata from AST
   */
  private extractMetadata(ast: any): AgentMetadata {
    const nameMatch = ast.raw.match(/name\s*:\s*["']([^"']+)["']/);
    const versionMatch = ast.raw.match(/version\s*:\s*["']([^"']+)["']/);
    const authorMatch = ast.raw.match(/author\s*:\s*["']([^"']+)["']/);
    const descriptionMatch = ast.raw.match(/description\s*:\s*["']([^"'"]+)["']/);

    return {
      name: nameMatch ? nameMatch[1] : 'MindLangAgent',
      version: versionMatch ? versionMatch[1] : '1.0.0',
      author: authorMatch ? authorMatch[1] : 'MindLang',
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      description: descriptionMatch ? descriptionMatch[1] : 'MindLang agent',
    };
  }

  /**
   * Add constant to compilation context
   */
  private addConstant(value: any): number {
    const id = this.context.constantCounter++;
    this.context.constants.set(id, value);
    return id;
  }

  /**
   * Register symbol in symbol table
   */
  private registerSymbol(name: string, type: string, scope: string): void {
    this.context.symbolTable.set(name, {
      name,
      type,
      scope,
      defined: true,
      used: false,
    });
  }

  /**
   * Validate that all used symbols are defined
   */
  private validateSymbols(): void {
    for (const [name, info] of this.context.symbolTable) {
      if (!info.defined) {
        this.context.errors.push(`Undefined symbol: ${name}`);
      }
    }
  }

  /**
   * Generate optimization hints
   */
  private generateOptimizations(ast: any): Map<string, any> {
    const optimizations = new Map<string, any>();

    // Detect SIMD opportunities
    const simdOps = ast.raw.match(/parallel|batch|simd/g);
    if (simdOps) {
      optimizations.set('simd_friendly', true);
    }

    // Detect memory reuse patterns
    const reuseOps = ast.raw.match(/cache|memo|store/g);
    if (reuseOps) {
      optimizations.set('memory_reuse', true);
    }

    return optimizations;
  }

  /**
   * Get compilation errors
   */
  getErrors(): string[] {
    return [...this.context.errors];
  }

  /**
   * Get compilation context (for debugging)
   */
  getContext(): CompilationContext {
    return {
      ...this.context,
      pathDefinitions: new Map(this.context.pathDefinitions),
      constants: new Map(this.context.constants),
      symbolTable: new Map(this.context.symbolTable),
    };
  }
}

export default MindLangAgentCompiler;
