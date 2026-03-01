/**
 * MindLang Agent Debugger and Profiler
 * Debugging, tracing, and performance profiling for agents
 * Approximately 200 lines
 */

import { MindLangAgent } from './agent-framework';
import { AgentExecutor } from './agent-executor';
import {
  ExecutionTrace,
  DebugSession,
  ProfileResult,
  Vector,
  ExecutionMetrics,
} from './types';

// ============================================================================
// Debugger Configuration
// ============================================================================

export interface DebugConfig {
  enableTracing: boolean;
  enableBreakpoints: boolean;
  enableWatches: boolean;
  traceLevel: 'verbose' | 'normal' | 'minimal';
  maxTraceSize: number;
}

// ============================================================================
// Agent Debugger
// ============================================================================

export class AgentDebugger {
  private sessions: Map<string, DebugSession> = new Map();
  private config: DebugConfig;
  private traces: ExecutionTrace[] = [];
  private breakpoints: Map<string, boolean> = new Map();

  constructor(config: Partial<DebugConfig> = {}) {
    this.config = {
      enableTracing: config.enableTracing ?? true,
      enableBreakpoints: config.enableBreakpoints ?? true,
      enableWatches: config.enableWatches ?? true,
      traceLevel: config.traceLevel ?? 'normal',
      maxTraceSize: config.maxTraceSize ?? 10000,
    };
  }

  /**
   * Start debug session
   */
  startSession(agentId: string, query: string): DebugSession {
    const session: DebugSession = {
      agentId,
      query,
      traces: [],
      breakpoints: new Map(),
      watchedVariables: new Map(),
    };

    this.sessions.set(agentId, session);
    return session;
  }

  /**
   * End debug session
   */
  endSession(agentId: string): DebugSession | null {
    return this.sessions.get(agentId) || null;
  }

  /**
   * Record execution trace
   */
  recordTrace(agentId: string, trace: ExecutionTrace): void {
    if (!this.config.enableTracing) {
      return;
    }

    const session = this.sessions.get(agentId);
    if (session) {
      session.traces.push(trace);

      // Limit trace size
      if (session.traces.length > this.config.maxTraceSize) {
        session.traces.shift();
      }
    }

    this.traces.push(trace);
    if (this.traces.length > this.config.maxTraceSize) {
      this.traces.shift();
    }
  }

  /**
   * Set breakpoint
   */
  setBreakpoint(agentId: string, stage: string): void {
    if (!this.config.enableBreakpoints) {
      return;
    }

    const session = this.sessions.get(agentId);
    if (session) {
      session.breakpoints.set(stage, true);
    }
  }

  /**
   * Remove breakpoint
   */
  removeBreakpoint(agentId: string, stage: string): void {
    const session = this.sessions.get(agentId);
    if (session) {
      session.breakpoints.delete(stage);
    }
  }

  /**
   * Check if breakpoint is set
   */
  hasBreakpoint(agentId: string, stage: string): boolean {
    if (!this.config.enableBreakpoints) {
      return false;
    }

    const session = this.sessions.get(agentId);
    return session?.breakpoints.get(stage) ?? false;
  }

  /**
   * Watch variable
   */
  watchVariable(agentId: string, varName: string, value: Vector): void {
    if (!this.config.enableWatches) {
      return;
    }

    const session = this.sessions.get(agentId);
    if (session) {
      session.watchedVariables.set(varName, [...value]);
    }
  }

  /**
   * Get watched variables
   */
  getWatchedVariables(agentId: string): Map<string, Vector> {
    const session = this.sessions.get(agentId);
    return session?.watchedVariables || new Map();
  }

  /**
   * Trace agent execution flow
   */
  traceExecution(agent: MindLangAgent, query: string): ExecutionFlowTrace {
    const traces = agent.getTraces();

    // Reconstruct execution flow
    const flow: ExecutionFlowTrace = {
      query,
      stages: [],
      totalTime: 0,
      stageTimings: new Map(),
    };

    let prevTime = 0;
    for (const trace of traces) {
      flow.stages.push({
        name: trace.stage,
        timestamp: trace.timestamp,
        duration: trace.duration,
        dataSize: this.estimateDataSize(trace.data),
      });

      const stageName = trace.stage;
      const duration = trace.duration || (trace.timestamp - prevTime);
      flow.stageTimings.set(stageName, (flow.stageTimings.get(stageName) || 0) + duration);
      flow.totalTime += duration;
      prevTime = trace.timestamp;
    }

    return flow;
  }

  /**
   * Profile agent performance across queries
   */
  profileAgent(
    agent: MindLangAgent,
    queries: string[],
    executor?: AgentExecutor
  ): ProfileResult {
    const timings = {
      analytical: [] as number[],
      creative: [] as number[],
      empirical: [] as number[],
    };

    const startMemory = this.estimateMemoryUsage();

    for (const query of queries) {
      const traces = agent.getTraces();

      for (const trace of traces) {
        if (trace.stage.includes('analytical')) {
          timings.analytical.push(trace.duration);
        } else if (trace.stage.includes('creative')) {
          timings.creative.push(trace.duration);
        } else if (trace.stage.includes('empirical')) {
          timings.empirical.push(trace.duration);
        }
      }
    }

    const endMemory = this.estimateMemoryUsage();

    // Calculate statistics
    const analyticalAvg = this.average(timings.analytical);
    const creativeAvg = this.average(timings.creative);
    const empiricalAvg = this.average(timings.empirical);
    const totalAvg = analyticalAvg + creativeAvg + empiricalAvg;
    const parallelSpeed = totalAvg / Math.max(analyticalAvg, creativeAvg, empiricalAvg);

    // Identify bottlenecks
    const bottlenecks: string[] = [];
    const maxTime = Math.max(analyticalAvg, creativeAvg, empiricalAvg);

    if (analyticalAvg === maxTime) {
      bottlenecks.push('Analytical path is slower than others');
    }
    if (creativeAvg === maxTime) {
      bottlenecks.push('Creative path is slower than others');
    }
    if (empiricalAvg === maxTime) {
      bottlenecks.push('Empirical path is slower than others');
    }

    return {
      analyticalTime: analyticalAvg,
      creativeTime: creativeAvg,
      empiricalTime: empiricalAvg,
      parallelizationEfficiency: Math.min(3, parallelSpeed) / 3,
      memoryUsage: {
        peak: endMemory,
        average: (startMemory + endMemory) / 2,
      },
      bottlenecks,
    };
  }

  /**
   * Visualize agent execution flow
   */
  visualizeAgentFlow(execution: ExecutionFlowTrace): string {
    let visualization = '';

    visualization += '┌─ Execution Flow Trace\n';
    visualization += `│  Query: ${execution.query.slice(0, 50)}...\n`;
    visualization += `│  Total Time: ${execution.totalTime}ms\n`;
    visualization += '├─ Stages:\n';

    for (const stage of execution.stages) {
      const bar = '█'.repeat(Math.ceil((stage.duration / execution.totalTime) * 20));
      const percent = ((stage.duration / execution.totalTime) * 100).toFixed(1);
      visualization += `│  ├─ ${stage.name.padEnd(20)} ${bar.padEnd(20)} ${percent}%\n`;
    }

    visualization += '└─ Timings:\n';
    for (const [stage, time] of execution.stageTimings) {
      visualization += `   ├─ ${stage}: ${time}ms\n`;
    }

    return visualization;
  }

  /**
   * Visualize weights over time
   */
  visualizeWeights(traces: ExecutionTrace[]): string {
    let visualization = '';

    visualization += '┌─ Weight Evolution\n';

    // Filter weight traces
    const weightTraces = traces.filter((t) =>
      t.stage.includes('weight') || t.stage.includes('adaptive')
    );

    for (const trace of weightTraces) {
      if (trace.data && typeof trace.data === 'object') {
        const { alpha, beta, gamma } = trace.data;
        if (alpha !== undefined && beta !== undefined && gamma !== undefined) {
          const alphaBar = '█'.repeat(Math.ceil(alpha * 30));
          const betaBar = '▓'.repeat(Math.ceil(beta * 30));
          const gammaBar = '░'.repeat(Math.ceil(gamma * 30));

          visualization += `│  α: ${alphaBar.padEnd(30)} ${(alpha * 100).toFixed(1)}%\n`;
          visualization += `│  β: ${betaBar.padEnd(30)} ${(beta * 100).toFixed(1)}%\n`;
          visualization += `│  γ: ${gammaBar.padEnd(30)} ${(gamma * 100).toFixed(1)}%\n`;
          visualization += '│\n';
        }
      }
    }

    visualization += '└─ End\n';

    return visualization;
  }

  /**
   * Visualize confidence trends
   */
  visualizeConfidenceTrends(traces: ExecutionTrace[]): string {
    let visualization = '';

    visualization += '┌─ Confidence Trends\n';

    const confidenceValues: number[] = [];

    for (const trace of traces) {
      if (trace.data && typeof trace.data === 'object' && 'confidence' in trace.data) {
        confidenceValues.push(trace.data.confidence as number);
      }
    }

    // Visualize as ASCII chart
    if (confidenceValues.length > 0) {
      const maxConf = Math.max(...confidenceValues);
      const minConf = Math.min(...confidenceValues);
      const range = maxConf - minConf || 1;

      for (let i = 0; i < confidenceValues.length; i++) {
        const normalized = (confidenceValues[i] - minConf) / range;
        const height = Math.round(normalized * 10);
        const bar = '▁'.repeat(height) + '▔'.repeat(10 - height);
        visualization += `│  Step ${i}: ${bar} ${(confidenceValues[i] * 100).toFixed(1)}%\n`;
      }
    }

    visualization += '└─ End\n';

    return visualization;
  }

  /**
   * Export debug report
   */
  exportDebugReport(agentId: string): string {
    const session = this.sessions.get(agentId);
    if (!session) {
      return 'No session found';
    }

    let report = '# Debug Report\n\n';
    report += `## Session: ${agentId}\n`;
    report += `### Query: ${session.query}\n\n`;

    report += `### Traces (${session.traces.length} entries)\n`;
    for (const trace of session.traces) {
      report += `- **${trace.stage}**: ${trace.duration}ms (${new Date(trace.timestamp).toISOString()})\n`;
    }

    report += `\n### Breakpoints (${session.breakpoints.size} set)\n`;
    for (const [stage] of session.breakpoints) {
      report += `- ${stage}\n`;
    }

    report += `\n### Watched Variables (${session.watchedVariables.size} entries)\n`;
    for (const [varName, values] of session.watchedVariables) {
      const summary = `[${values.slice(0, 3).map((v) => v.toFixed(2)).join(', ')}...]`;
      report += `- **${varName}**: ${summary} (length: ${values.length})\n`;
    }

    return report;
  }

  /**
   * Get all traces
   */
  getAllTraces(): ExecutionTrace[] {
    return [...this.traces];
  }

  /**
   * Clear all traces
   */
  clearTraces(): void {
    this.traces = [];
    for (const session of this.sessions.values()) {
      session.traces = [];
    }
  }

  /**
   * Utility: Estimate data size
   */
  private estimateDataSize(data: any): number {
    if (!data) return 0;
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'object') return Object.keys(data).length;
    return 1;
  }

  /**
   * Utility: Estimate memory usage (simplified)
   */
  private estimateMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Utility: Calculate average
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

export interface ExecutionFlowTrace {
  query: string;
  stages: Array<{
    name: string;
    timestamp: number;
    duration: number;
    dataSize: number;
  }>;
  totalTime: number;
  stageTimings: Map<string, number>;
}

export default AgentDebugger;
