/**
 * MindLang Agent Framework - Main Export
 * Central entry point for all agent framework components
 */

// Core Framework
export { MindLangAgent } from './agent-framework';
export { MindLangAgentCompiler } from './agent-compiler';
export { AgentExecutor } from './agent-executor';
export { AgentIntegration } from './agent-integrations';
export { AgentDebugger } from './agent-debug';

// Type System
export * from './types';

// Re-exports for convenience
export type {
  AgentResponse,
  AgentState,
  Weights,
  Critique,
  ParallelResults,
  CompiledAgent,
  ExecutionMetrics,
  QueryAnalysis,
  DebugSession,
  ProfileResult,
} from './types';

// Integration Classes
export {
  CodeValidator,
  DatabaseManager,
  CacheManager,
  APIManager,
} from './agent-integrations';

// Debugger Classes
export type { ExecutionFlowTrace } from './agent-debug';

/**
 * Create a complete MindLang agent system
 */
export async function createMindLangAgentSystem(config: any) {
  const { MindLangAgent } = await import('./agent-framework');
  const { MindLangAgentCompiler } = await import('./agent-compiler');
  const { AgentExecutor } = await import('./agent-executor');
  const { AgentIntegration } = await import('./agent-integrations');
  const { AgentDebugger } = await import('./agent-debug');
  const { VirtualMachine } = await import('../src/vm');

  return {
    Agent: MindLangAgent,
    Compiler: MindLangAgentCompiler,
    Executor: AgentExecutor,
    Integration: AgentIntegration,
    Debugger: AgentDebugger,
    VM: VirtualMachine,
  };
}
