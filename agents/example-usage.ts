/**
 * MindLang Agent Framework - Example Usage
 * Demonstrates how to use the complete agent framework
 */

import MindLangAgent from './agent-framework';
import { MindLangAgentCompiler } from './agent-compiler';
import { AgentExecutor } from './agent-executor';
import { AgentIntegration } from './agent-integrations';
import { AgentDebugger } from './agent-debug';
import { VirtualMachine } from '../src/vm';
import { AgentFrameworkConfig } from './types';

// ============================================================================
// Example 1: Basic Agent Execution
// ============================================================================

export async function basicAgentExample() {
  console.log('=== Example 1: Basic Agent Execution ===\n');

  // Configure agent framework
  const config: AgentFrameworkConfig = {
    vmConfig: {
      stackSizeMB: 10,
      heapSizeMB: 500,
      maxInstructions: 10_000_000,
      maxThreads: 4,
      enableDebug: false,
      enableProfiling: true,
    },
    cachingConfig: {
      enabled: true,
      maxSize: 1000,
      defaultTTL: 3600,
    },
    parallelConfig: {
      enabled: true,
      maxWorkers: 4,
      timeout: 30000,
    },
    integrationConfig: {
      claudeAPIKey: process.env.CLAUDE_API_KEY,
      databaseURL: 'postgresql://localhost/mindlang',
    },
  };

  // Create agent
  const agent = new MindLangAgent('/path/to/agent.mlang', config);

  // Execute agent
  try {
    const response = await agent.think('What are the philosophical implications of quantum mechanics?');

    console.log('Response:', response.response);
    console.log('Confidence:', response.confidence);
    console.log('Response Type:', response.responseType);
    console.log('Execution Time:', response.metadata.executionTime, 'ms');
    console.log('\nWeights:');
    console.log('  Analytical (α):', response.reasoning.weights.alpha.toFixed(3));
    console.log('  Creative (β):', response.reasoning.weights.beta.toFixed(3));
    console.log('  Empirical (γ):', response.reasoning.weights.gamma.toFixed(3));
    console.log('\nCritique:');
    console.log('  Score:', response.reasoning.critique.score.toFixed(1));
    console.log('  Confidence:', response.reasoning.critique.confidence.toFixed(2));
    console.log('  Feedback:', response.reasoning.critique.feedback);
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Example 2: Compilation and Custom Agent
// ============================================================================

export async function compilationExample() {
  console.log('\n=== Example 2: Agent Compilation ===\n');

  const compiler = new MindLangAgentCompiler();

  // Define a custom agent
  const agentCode = `
    agent PhilosophyAnalyzer {
      analytical: {
        // Logical analysis of the question
        z_a = ReLU(W_a · z + b_a)
      }

      creative: {
        // Creative interpretations
        z_b = TANH(W_b · z + b_b + noise(0.1))
      }

      empirical: {
        // Evidence-based reasoning
        z_c = SIGMOID(W_c · z + b_c)
      }

      weights: {
        adaptive: true
        strategy: "softmax"
        learningRate: 0.1
      }

      critique: {
        confidenceThreshold: 0.8
        retryLimit: 3
      }
    }
  `;

  try {
    const compiled = compiler.compile(agentCode);

    console.log('Compilation successful!');
    console.log('  Analytical bytecode:', compiled.analytical.instructions.length, 'instructions');
    console.log('  Creative bytecode:', compiled.creative.instructions.length, 'instructions');
    console.log('  Empirical bytecode:', compiled.empirical.instructions.length, 'instructions');
    console.log('\nAgent Metadata:');
    console.log('  Name:', compiled.metadata.name);
    console.log('  Version:', compiled.metadata.version);
    console.log('  Description:', compiled.metadata.description);
    console.log('\nWeight Config:');
    console.log('  Adaptive Mode:', compiled.weights.adaptiveMode);
    console.log('  Strategy:', compiled.weights.updateStrategy);
    console.log('\nCritique Config:');
    console.log('  Confidence Threshold:', compiled.critique.confidenceThreshold);
    console.log('  Retry Limit:', compiled.critique.retryLimit);
  } catch (error) {
    console.error('Compilation error:', error);
  }
}

// ============================================================================
// Example 3: Parallel Execution with Debugging
// ============================================================================

export async function debuggingExample() {
  console.log('\n=== Example 3: Debugging and Profiling ===\n');

  const config: AgentFrameworkConfig = {
    vmConfig: {
      stackSizeMB: 10,
      heapSizeMB: 500,
      maxInstructions: 10_000_000,
      maxThreads: 4,
      enableDebug: true,
      enableProfiling: true,
    },
    cachingConfig: { enabled: true, maxSize: 1000, defaultTTL: 3600 },
    parallelConfig: { enabled: true, maxWorkers: 4, timeout: 30000 },
    integrationConfig: {},
  };

  const agent = new MindLangAgent('/path/to/agent.mlang', config);
  const debugger = new AgentDebugger({
    enableTracing: true,
    enableBreakpoints: true,
    enableWatches: true,
    traceLevel: 'verbose',
  });

  try {
    // Start debug session
    const agentId = agent.getState().id;
    debugger.startSession(agentId, 'How does machine learning impact society?');

    // Set breakpoints
    debugger.setBreakpoint(agentId, 'ensemble');
    debugger.setBreakpoint(agentId, 'critique');

    // Execute query
    const response = await agent.think('How does machine learning impact society?');

    // Collect traces
    const traces = agent.getTraces();
    const flowTrace = debugger.traceExecution(agent, 'How does machine learning impact society?');

    // Display visualizations
    console.log(debugger.visualizeAgentFlow(flowTrace));
    console.log(debugger.visualizeWeights(traces));
    console.log(debugger.visualizeConfidenceTrends(traces));

    // Export report
    const report = debugger.exportDebugReport(agentId);
    console.log('\nDebug Report:\n', report);

    // Profile agent
    const profile = debugger.profileAgent(agent, [
      'Query 1',
      'Query 2',
      'Query 3',
    ]);

    console.log('\nPerformance Profile:');
    console.log('  Analytical:', profile.analyticalTime.toFixed(2), 'ms');
    console.log('  Creative:', profile.creativeTime.toFixed(2), 'ms');
    console.log('  Empirical:', profile.empiricalTime.toFixed(2), 'ms');
    console.log('  Parallelization Efficiency:', (profile.parallelizationEfficiency * 100).toFixed(1), '%');
    console.log('  Peak Memory:', profile.memoryUsage.peak.toFixed(2), 'MB');
    console.log('  Bottlenecks:');
    for (const bottleneck of profile.bottlenecks) {
      console.log('    -', bottleneck);
    }
  } catch (error) {
    console.error('Debug error:', error);
  }
}

// ============================================================================
// Example 4: Integration with External Systems
// ============================================================================

export async function integrationExample() {
  console.log('\n=== Example 4: External Integration ===\n');

  const integration = new AgentIntegration({
    claudeAPIKey: process.env.CLAUDE_API_KEY,
    databaseURL: 'postgresql://localhost/mindlang',
    cacheConfig: { enabled: true, ttl: 3600 },
  });

  try {
    // Validate code
    const codeToValidate = `
      const result = analytical(z);
      const improved = creative(result);
      return empirical(improved);
    `;

    console.log('Validating code...');
    const validation = await integration.validateCodeWithFreeLang(codeToValidate);
    console.log('  Valid:', validation.valid);
    console.log('  Score:', validation.score);
    if (validation.warnings.length > 0) {
      console.log('  Warnings:', validation.warnings);
    }

    // Call Claude API
    console.log('\nCalling Claude API...');
    const claudeResponse = await integration.callClaudeAPI(
      'Explain the three-path reasoning architecture'
    );
    console.log('  Response length:', claudeResponse.length, 'characters');

    // Query database
    console.log('\nQuerying database...');
    const dbResult = await integration.queryDatabase({
      sql: 'SELECT * FROM agent_executions LIMIT 10',
      cache: true,
      timeout: 5000,
    });
    console.log('  Rows:', dbResult.rowCount);
    console.log('  Columns:', dbResult.columns);
    console.log('  Execution Time:', dbResult.executionTime, 'ms');

    // Cache operations
    console.log('\nCache operations...');
    integration.setCachedResult('test_key', { value: 42 }, 3600);
    const cached = integration.getCachedResult('test_key');
    console.log('  Cached value:', cached);

    // Call external API
    console.log('\nCalling external API...');
    const apiResult = await integration.callExternalAPI(
      'https://api.example.com/analyze',
      {
        method: 'POST',
        body: { query: 'test' },
        timeout: 10000,
      }
    );
    console.log('  API Status:', apiResult.status);
  } catch (error) {
    console.error('Integration error:', error);
  }
}

// ============================================================================
// Example 5: Advanced Multi-Query Session
// ============================================================================

export async function advancedSessionExample() {
  console.log('\n=== Example 5: Advanced Multi-Query Session ===\n');

  const config: AgentFrameworkConfig = {
    vmConfig: {
      stackSizeMB: 10,
      heapSizeMB: 500,
      maxInstructions: 10_000_000,
      maxThreads: 4,
      enableDebug: false,
      enableProfiling: true,
    },
    cachingConfig: { enabled: true, maxSize: 1000, defaultTTL: 3600 },
    parallelConfig: { enabled: true, maxWorkers: 4, timeout: 30000 },
    integrationConfig: {},
  };

  const agent = new MindLangAgent('/path/to/agent.mlang', config);

  const queries = [
    'What is the nature of consciousness?',
    'How does evolution drive innovation?',
    'What are the limits of human cognition?',
  ];

  console.log('Executing', queries.length, 'queries...\n');

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    console.log(`Query ${i + 1}: ${query}`);

    try {
      const response = await agent.think(query);

      console.log('  Confidence:', response.confidence.toFixed(2));
      console.log('  Type:', response.responseType);
      console.log('  Time:', response.metadata.executionTime, 'ms');
      console.log('  Iterations:', response.metadata.iterations);

      if (response.reasoning.critique.shouldRetry) {
        console.log('  [Retry suggested]');
      }

      console.log();
    } catch (error) {
      console.error('  Error:', error);
    }
  }

  // Session statistics
  const state = agent.getState();
  console.log('Session Complete');
  console.log('  Total iterations:', state.iteration);
  console.log('  Final status:', state.status);
  console.log('  Execution traces:', agent.getTraces().length);
}

// ============================================================================
// Main Runner
// ============================================================================

async function runAllExamples() {
  try {
    await basicAgentExample();
    await compilationExample();
    await debuggingExample();
    await integrationExample();
    await advancedSessionExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export for use in other modules
export {
  basicAgentExample,
  compilationExample,
  debuggingExample,
  integrationExample,
  advancedSessionExample,
  runAllExamples,
};

// Run examples if executed directly
if (require.main === module) {
  runAllExamples();
}
