# MindLang Agent Framework - Quick Start Guide

## Installation

```bash
cd /data/data/com.termux/files/home/kim/mindlang
npm install
npm run build
```

## 5-Minute Quick Start

### 1. Create a Basic Agent

```typescript
import { MindLangAgent } from './agents';
import type { AgentFrameworkConfig } from './agents/types';

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
```

### 2. Execute a Query

```typescript
const response = await agent.think(
  'What are the implications of artificial intelligence?'
);

console.log('Response:', response.response);
console.log('Confidence:', response.confidence);
console.log('Execution Time:', response.metadata.executionTime, 'ms');
```

### 3. Inspect Reasoning Paths

```typescript
const { reasoning } = response;

console.log('Weights:');
console.log('  Analytical:', reasoning.weights.alpha.toFixed(3));
console.log('  Creative:', reasoning.weights.beta.toFixed(3));
console.log('  Empirical:', reasoning.weights.gamma.toFixed(3));

console.log('Critique:');
console.log('  Score:', reasoning.critique.score.toFixed(1));
console.log('  Feedback:', reasoning.critique.feedback);
```

## Core Components Overview

### Agent Framework
```typescript
import { MindLangAgent } from './agents';

const agent = new MindLangAgent(agentPath, config);
const response = await agent.think(query);
```
- **Main method**: `think(query: string): Promise<AgentResponse>`
- Handles 3-path execution, ensemble, critique, and refinement

### Compiler
```typescript
import { MindLangAgentCompiler } from './agents';

const compiler = new MindLangAgentCompiler();
const compiled = compiler.compile(agentCode);
```
- Converts MindLang code to bytecode
- Validates syntax and types
- Extracts configuration

### Executor
```typescript
import { AgentExecutor } from './agents';

const executor = new AgentExecutor(vm, config);
const results = await executor.executeParallel(query, compiled);
```
- Runs 3 paths in parallel
- Computes adaptive weights
- Combines ensemble results

### Integration
```typescript
import { AgentIntegration } from './agents';

const integration = new AgentIntegration(config);
await integration.validateCodeWithFreeLang(code);
```
- Validates code
- Integrates with Claude API
- Manages database queries
- Handles external APIs

### Debugger
```typescript
import { AgentDebugger } from './agents';

const debugger = new AgentDebugger({ enableTracing: true });
debugger.startSession(agentId, query);
const profile = debugger.profileAgent(agent, queries);
console.log(debugger.visualizeAgentFlow(traces));
```
- Traces execution
- Profiles performance
- Visualizes flow and weights

## Configuration Quick Reference

### Minimal Configuration
```typescript
const config = {
  vmConfig: { maxInstructions: 10_000_000 },
  cachingConfig: { enabled: true },
  parallelConfig: { enabled: true },
  integrationConfig: {},
};
```

### Production Configuration
```typescript
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
```

## Common Patterns

### Pattern 1: Single Query Execution
```typescript
const response = await agent.think(query);
const { response: text, confidence, reasoning } = response;
```

### Pattern 2: Multi-Query Session
```typescript
for (const query of queries) {
  const response = await agent.think(query);
  console.log(response.response);

  if (!response.reasoning.critique.shouldRetry) {
    break; // Good response, move on
  }
}
```

### Pattern 3: With Debugging
```typescript
const debugger = new AgentDebugger({ enableTracing: true });
const agentId = agent.getState().id;
debugger.startSession(agentId, query);

const response = await agent.think(query);
const traces = agent.getTraces();

console.log(debugger.visualizeAgentFlow(
  debugger.traceExecution(agent, query)
));
```

### Pattern 4: With Caching
```typescript
integration.setCachedResult('key', value, 3600);

const cached = integration.getCachedResult('key');
if (cached) {
  return cached; // Use cached result
}

// Otherwise execute...
```

### Pattern 5: With External Integration
```typescript
// Validate code
const validation = await integration.validateCodeWithFreeLang(code);

// Query database
const dbResult = await integration.queryDatabase({
  sql: 'SELECT * FROM agents',
  cache: true,
});

// Call external API
const apiResult = await integration.callExternalAPI(url, {
  method: 'POST',
  timeout: 10000,
});
```

## Type System Quick Reference

```typescript
// Input
type Query = string;

// Output
interface AgentResponse {
  response: string;
  confidence: number;
  responseType: 'final' | 'intermediate' | 'refined';
  reasoning: {
    analytical: Vector;        // z_a
    creative: Vector;          // z_b
    empirical: Vector;         // z_c
    weights: Weights;          // {α, β, γ}
    critique: Critique;        // {score, feedback, shouldRetry}
    ensemble: Vector;          // z_ens
  };
  metadata: {
    executionTime: number;
    iterations: number;
    cacheUsed: boolean;
    refinements: number;
  };
}

// Weights
interface Weights {
  alpha: number;   // 0.0-1.0
  beta: number;    // 0.0-1.0
  gamma: number;   // 0.0-1.0
}

// Critique
interface Critique {
  confidence: number;       // 0.0-1.0
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  shouldRetry: boolean;
  score: number;            // 0.0-100.0
}
```

## Performance Tips

### 1. Enable Caching
```typescript
cachingConfig: { enabled: true, maxSize: 1000, defaultTTL: 3600 }
```

### 2. Tune VM Settings
```typescript
vmConfig: {
  maxInstructions: 10_000_000,  // Increase for complex queries
  maxThreads: 4,                 // Match CPU count
}
```

### 3. Set Appropriate Timeouts
```typescript
parallelConfig: { timeout: 30000 }  // 30 seconds per path
```

### 4. Profile Before Optimizing
```typescript
const profile = debugger.profileAgent(agent, sampleQueries);
console.log(profile.bottlenecks);  // Identify slow paths
```

## Debugging Checklist

- [ ] Enable debug mode: `enableDebug: true`
- [ ] Start debug session: `debugger.startSession(id, query)`
- [ ] Set breakpoints: `debugger.setBreakpoint(id, 'stage')`
- [ ] Watch variables: `debugger.watchVariable(id, 'varName', value)`
- [ ] Export report: `debugger.exportDebugReport(id)`
- [ ] Profile: `debugger.profileAgent(agent, queries)`
- [ ] Visualize: `debugger.visualizeAgentFlow(trace)`

## Common Issues & Solutions

### Issue: Low Confidence Score
**Solution**: Check critique feedback and enable retry
```typescript
if (response.reasoning.critique.score < 50) {
  // Response quality low, may need refinement
  console.log(response.reasoning.critique.feedback);
}
```

### Issue: Slow Execution
**Solution**: Profile and identify bottleneck path
```typescript
const profile = debugger.profileAgent(agent, queries);
console.log(profile.bottlenecks);
```

### Issue: Out of Memory
**Solution**: Reduce VM heap size or query batch size
```typescript
vmConfig: { heapSizeMB: 250 }  // Reduced from 500
```

### Issue: Cache Not Working
**Solution**: Check cache configuration and enable it
```typescript
cachingConfig: {
  enabled: true,      // Must be true
  maxSize: 1000,      // Max entries
  defaultTTL: 3600,   // 1 hour
}
```

## File Locations

```
/data/data/com.termux/files/home/kim/mindlang/agents/
├── types.ts                  - Type definitions
├── agent-framework.ts        - Core runtime
├── agent-compiler.ts         - Compilation
├── agent-executor.ts         - Execution
├── agent-integrations.ts     - Integration
├── agent-debug.ts            - Debugging
├── index.ts                  - Exports
├── example-usage.ts          - Examples
└── README.md                 - Full docs
```

## Next Steps

1. **Compile**: `npm run build`
2. **Test**: `npm test`
3. **Run Examples**: `npm run dev`
4. **Integrate**: Import into your project
5. **Configure**: Set up for your use case
6. **Debug**: Use debugger for optimization
7. **Deploy**: Build and deploy

## Resources

- **Full Documentation**: `agents/README.md`
- **Examples**: `agents/example-usage.ts`
- **Type Definitions**: `agents/types.ts`
- **Framework Summary**: `AGENT_FRAMEWORK_SUMMARY.md`

## API Quick Reference

```typescript
// Agent
agent.think(query)
agent.getState()
agent.getTraces()
agent.getMetrics()
agent.clearCache()

// Compiler
compiler.compile(code)
compiler.getErrors()
compiler.getContext()

// Executor
executor.executeParallel(query, compiled)
executor.computeAdaptiveWeights(type, results, confidences)
executor.ensembleResults(weights, results)
executor.selfCritique(ensemble, query)
executor.getAveragePathTime(pathName)
executor.getPerformanceStats()

// Integration
integration.validateCodeWithFreeLang(code)
integration.callClaudeAPI(prompt)
integration.queryDatabase(query)
integration.callExternalAPI(url, options)
integration.getCachedResult(key)
integration.setCachedResult(key, value, ttl)

// Debugger
debugger.startSession(id, query)
debugger.recordTrace(id, trace)
debugger.setBreakpoint(id, stage)
debugger.traceExecution(agent, query)
debugger.profileAgent(agent, queries)
debugger.visualizeAgentFlow(trace)
debugger.visualizeWeights(traces)
debugger.exportDebugReport(id)
```

---

**Quick Start Version**: 1.0
**Last Updated**: February 20, 2026
