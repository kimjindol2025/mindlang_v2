/**
 * MindLang Agent - Real-World Examples
 * 5+ comprehensive examples demonstrating practical agent usage
 * Shows Q&A, debugging, creative tasks, and multi-agent coordination
 */

import {
  AgentResponse,
  Weights,
  Critique,
  ParallelResults,
} from './types';

// ============================================================================
// Example 1: Q&A Agent - Question Answering System
// ============================================================================

/**
 * Example 1: Basic Q&A Agent
 *
 * Use Case: Answer factual questions with logical reasoning
 * The agent combines analytical (definitions), creative (examples),
 * and empirical (research) paths to provide comprehensive answers.
 */

namespace Example1_QAAgent {
  export interface QuestionContext {
    question: string;
    domain: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }

  export async function demonstrateQAAgent() {
    console.log('\n=== Example 1: Q&A Agent ===\n');

    const questions: QuestionContext[] = [
      {
        question: 'What is machine learning and how does it work?',
        domain: 'AI',
        difficulty: 'medium',
      },
      {
        question: 'Explain quantum computing in simple terms',
        domain: 'Quantum',
        difficulty: 'hard',
      },
      {
        question: 'What are the benefits of cloud computing?',
        domain: 'Cloud',
        difficulty: 'easy',
      },
    ];

    for (const context of questions) {
      console.log(`Question: ${context.question}`);
      console.log(`Domain: ${context.domain} | Difficulty: ${context.difficulty}`);

      // Simulate agent response
      const response: AgentResponse = {
        response: `Comprehensive answer about ${context.domain}...`,
        confidence: 0.88,
        responseType: 'final',
        reasoning: {
          analytical: generateVector(128, 0.7),
          creative: generateVector(128, 0.5),
          empirical: generateVector(128, 0.8),
          weights: {
            alpha: 0.5, // Higher analytical weight for factual questions
            beta: 0.2,
            gamma: 0.3,
            timestamp: Date.now(),
            adaptive: true,
          },
          critique: {
            confidence: 0.88,
            strengths: [
              'Clear definition provided',
              'Relevant examples included',
              'Research-backed information',
            ],
            weaknesses: [],
            feedback: 'Strong response with good balance of theory and practice',
            shouldRetry: false,
            score: 0.88,
          },
          ensemble: generateVector(128, 0.7),
        },
        metadata: {
          executionTime: 245,
          iterations: 1,
          cacheUsed: false,
          refinements: 0,
        },
      };

      console.log(`\nResponse: ${response.response}`);
      console.log(`Confidence: ${(response.confidence * 100).toFixed(1)}%`);
      console.log(`Weights - Analytical: ${(response.reasoning.weights.alpha * 100).toFixed(1)}%, Creative: ${(response.reasoning.weights.beta * 100).toFixed(1)}%, Empirical: ${(response.reasoning.weights.gamma * 100).toFixed(1)}%`);
      console.log(`Execution Time: ${response.metadata.executionTime}ms`);
      console.log(`---\n`);
    }
  }
}

// ============================================================================
// Example 2: Bug Resolution Agent - Code Debugging
// ============================================================================

/**
 * Example 2: Bug Resolution Agent
 *
 * Use Case: Help developers fix bugs by analyzing code and errors
 * The agent uses:
 * - Analytical path: Examine stack traces, understand code flow
 * - Creative path: Propose alternative implementations
 * - Empirical path: Reference similar bugs and solutions
 */

namespace Example2_BugAgent {
  export interface BugReport {
    title: string;
    code: string;
    error: string;
    context: string;
  }

  export interface BugSolution {
    issue: string;
    rootCause: string;
    solutions: string[];
    recommendedFix: string;
    confidence: number;
  }

  export async function demonstrateBugAgent() {
    console.log('\n=== Example 2: Bug Resolution Agent ===\n');

    const bugReports: BugReport[] = [
      {
        title: 'Null Reference Exception',
        code: `function processData(data) {
  return data.map(item => item.value * 2)
}`,
        error: 'TypeError: Cannot read property "map" of null',
        context: 'Called with null parameter',
      },
      {
        title: 'Memory Leak',
        code: `setInterval(() => {
  const cache = loadData()
  processCache(cache)
}, 1000)`,
        error: 'Memory usage increases continuously',
        context: 'Runs indefinitely without cleanup',
      },
      {
        title: 'Race Condition',
        code: `async function updateUser(id, data) {
  const user = await getUser(id)
  user.data = data
  await saveUser(user)
}`,
        error: 'Data gets overwritten by concurrent requests',
        context: 'Multiple API calls for same user',
      },
    ];

    for (const bug of bugReports) {
      console.log(`Bug: ${bug.title}`);
      console.log(`Error: ${bug.error}`);

      // Simulate multi-path analysis
      const solutions: BugSolution = {
        issue: bug.title,
        rootCause: analyzeRootCause(bug),
        solutions: generateSolutions(bug),
        recommendedFix: recommendFix(bug),
        confidence: 0.92,
      };

      console.log(`\nRoot Cause: ${solutions.rootCause}`);
      console.log('\nProposed Solutions:');
      solutions.solutions.forEach((sol, idx) => {
        console.log(`  ${idx + 1}. ${sol}`);
      });
      console.log(`\nRecommended Fix: ${solutions.recommendedFix}`);
      console.log(`Solution Confidence: ${(solutions.confidence * 100).toFixed(1)}%`);
      console.log(`---\n`);
    }
  }

  function analyzeRootCause(bug: BugReport): string {
    const errorLower = bug.error.toLowerCase();

    if (errorLower.includes('null') || errorLower.includes('undefined')) {
      return 'Missing null/undefined check before accessing properties';
    }
    if (errorLower.includes('memory')) {
      return 'Resources not being released; memory accumulating in heap';
    }
    if (errorLower.includes('overwritten')) {
      return 'Concurrent access without synchronization; race condition detected';
    }

    return 'Unknown root cause';
  }

  function generateSolutions(bug: BugReport): string[] {
    const solutions: string[] = [];

    if (bug.error.includes('null') || bug.error.includes('undefined')) {
      solutions.push('Add null/undefined check: if (data) { ... }');
      solutions.push(
        'Use optional chaining: data?.map(...)'
      );
      solutions.push(
        'Use default value: (data || []).map(...)'
      );
    }

    if (bug.error.includes('Memory')) {
      solutions.push('Clear cache between iterations');
      solutions.push('Use WeakMap for automatic garbage collection');
      solutions.push('Implement memory pooling pattern');
    }

    if (bug.error.includes('overwritten')) {
      solutions.push('Add optimistic locking with version numbers');
      solutions.push('Implement mutex/semaphore for critical sections');
      solutions.push('Use database transactions for atomic updates');
    }

    return solutions.slice(0, 3);
  }

  function recommendFix(bug: BugReport): string {
    const errorLower = bug.error.toLowerCase();

    if (errorLower.includes('null')) {
      return 'Implement defensive null check immediately before map operation';
    }
    if (errorLower.includes('memory')) {
      return 'Implement cleanup in finally block or use AbortController';
    }
    if (errorLower.includes('overwritten')) {
      return 'Add version field to user object and check before updating';
    }

    return 'Analyze stack trace and add appropriate error handling';
  }
}

// ============================================================================
// Example 3: Creative Ideation Agent - Product Design
// ============================================================================

/**
 * Example 3: Creative Ideation Agent
 *
 * Use Case: Generate innovative product ideas and features
 * High weight on creative path for novel combinations and perspectives
 * Analytical path provides feasibility analysis
 * Empirical path validates against market trends
 */

namespace Example3_CreativeAgent {
  export interface ProductBrief {
    productName: string;
    targetMarket: string;
    painPoint: string;
  }

  export interface CreativeIdea {
    concept: string;
    uniqueValue: string;
    implementation: string;
    marketFit: string;
    innovationScore: number;
  }

  export async function demonstrateCreativeAgent() {
    console.log('\n=== Example 3: Creative Ideation Agent ===\n');

    const briefs: ProductBrief[] = [
      {
        productName: 'CloudNote',
        targetMarket: 'Professionals',
        painPoint: 'Managing notes across devices',
      },
      {
        productName: 'FitFlow',
        targetMarket: 'Fitness enthusiasts',
        painPoint: 'Boring workout routines',
      },
    ];

    for (const brief of briefs) {
      console.log(`Product: ${brief.productName}`);
      console.log(`Target: ${brief.targetMarket} | Pain Point: ${brief.painPoint}`);

      const ideas: CreativeIdea[] = generateCreativeIdeas(brief);

      console.log('\nGenerated Ideas:');
      ideas.forEach((idea, idx) => {
        console.log(`\n  ${idx + 1}. ${idea.concept}`);
        console.log(`     Unique Value: ${idea.uniqueValue}`);
        console.log(`     Implementation: ${idea.implementation}`);
        console.log(`     Market Fit: ${idea.marketFit}`);
        console.log(`     Innovation: ${(idea.innovationScore * 100).toFixed(0)}/100`);
      });

      console.log('\nWeights: Analytical 20%, Creative 70%, Empirical 10%');
      console.log(
        '(Creative path emphasized for ideation tasks)\n---\n'
      );
    }
  }

  function generateCreativeIdeas(brief: ProductBrief): CreativeIdea[] {
    return [
      {
        concept: 'AI-powered note organization',
        uniqueValue: 'Automatic tagging and contextual grouping',
        implementation: 'ML-based categorization of notes',
        marketFit: 'High demand in productivity tools',
        innovationScore: 0.85,
      },
      {
        concept: 'Voice-to-note conversion',
        uniqueValue: 'Hands-free note capture',
        implementation: 'Voice API integration with NLP',
        marketFit: 'Growing accessibility focus',
        innovationScore: 0.78,
      },
      {
        concept: 'Collaborative note spaces',
        uniqueValue: 'Real-time team collaboration',
        implementation: 'WebSocket-based sync',
        marketFit: 'Enterprise collaboration tools',
        innovationScore: 0.72,
      },
    ];
  }
}

// ============================================================================
// Example 4: Data-Driven Analysis Agent - Market Research
// ============================================================================

/**
 * Example 4: Data-Driven Analysis Agent
 *
 * Use Case: Analyze data and trends for business decisions
 * High weight on empirical path for data-backed insights
 * Analytical path provides interpretation framework
 * Creative path suggests strategic implications
 */

namespace Example4_DataAgent {
  export interface DataQuery {
    metric: string;
    timeRange: string;
    targetSegment: string;
  }

  export interface DataInsight {
    finding: string;
    trend: string;
    significance: string;
    recommendation: string;
    dataConfidence: number;
  }

  export async function demonstrateDataAgent() {
    console.log('\n=== Example 4: Data-Driven Analysis Agent ===\n');

    const queries: DataQuery[] = [
      {
        metric: 'User Growth',
        timeRange: 'Last 6 months',
        targetSegment: 'Enterprise',
      },
      {
        metric: 'Feature Adoption',
        timeRange: 'Last quarter',
        targetSegment: 'Mobile users',
      },
    ];

    for (const query of queries) {
      console.log(`Metric: ${query.metric}`);
      console.log(
        `Time Range: ${query.timeRange} | Segment: ${query.targetSegment}`
      );

      const insight: DataInsight = analyzeData(query);

      console.log(`\nFinding: ${insight.finding}`);
      console.log(`Trend: ${insight.trend}`);
      console.log(`Significance: ${insight.significance}`);
      console.log(`Recommendation: ${insight.recommendation}`);
      console.log(`Data Confidence: ${(insight.dataConfidence * 100).toFixed(1)}%`);

      console.log(
        '\nWeights: Analytical 25%, Creative 15%, Empirical 60%'
      );
      console.log(
        '(Empirical path emphasized for data-driven insights)\n---\n'
      );
    }
  }

  function analyzeData(query: DataQuery): DataInsight {
    const findings = {
      'User Growth': {
        finding: '45% quarter-over-quarter growth',
        trend: 'Accelerating acquisition',
        significance:
          'Enterprise segment shows strongest momentum',
        recommendation:
          'Invest in enterprise sales team to capitalize on growth',
        dataConfidence: 0.94,
      },
      'Feature Adoption': {
        finding: '78% of mobile users adopted new feature within 2 weeks',
        trend:
          'Faster adoption than expected',
        significance: 'Mobile-first strategy validating',
        recommendation:
          'Accelerate mobile feature releases',
        dataConfidence: 0.87,
      },
    };

    return (
      findings[query.metric as keyof typeof findings] || {
        finding: 'Data pending analysis',
        trend: 'Unknown',
        significance: 'Insufficient data',
        recommendation: 'Gather more samples',
        dataConfidence: 0.3,
      }
    );
  }
}

// ============================================================================
// Example 5: Multi-Agent Coordination - Code Review System
// ============================================================================

/**
 * Example 5: Multi-Agent Coordination
 *
 * Use Case: Coordinated multi-agent review of code changes
 * Master agent orchestrates specialized sub-agents:
 * - Code Quality Agent: Reviews code structure and best practices
 * - Security Agent: Identifies security vulnerabilities
 * - Performance Agent: Analyzes performance implications
 *
 * Master synthesizes all inputs for comprehensive review
 */

namespace Example5_MultiAgent {
  export interface CodeChange {
    filename: string;
    changes: string;
    description: string;
  }

  export interface ReviewResult {
    summary: string;
    quality: number;
    security: number;
    performance: number;
    overallScore: number;
    recommendation: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
    reviewAgents: string[];
  }

  export async function demonstrateMultiAgentReview() {
    console.log('\n=== Example 5: Multi-Agent Code Review ===\n');

    const changes: CodeChange[] = [
      {
        filename: 'auth.ts',
        changes:
          'Added bcrypt password hashing instead of plain text storage',
        description: 'Security: Implement password hashing',
      },
      {
        filename: 'api.ts',
        changes:
          'Refactored to add caching layer for database queries',
        description: 'Performance: Add query caching',
      },
    ];

    for (const change of changes) {
      console.log(`File: ${change.filename}`);
      console.log(`Description: ${change.description}`);
      console.log(`Changes: ${change.changes}`);

      const review = conductMultiAgentReview(change);

      console.log(`\nReview Summary: ${review.summary}`);
      console.log(`\nScores:`);
      console.log(`  Quality:     ${(review.quality * 100).toFixed(0)}/100`);
      console.log(`  Security:    ${(review.security * 100).toFixed(0)}/100`);
      console.log(`  Performance: ${(review.performance * 100).toFixed(0)}/100`);
      console.log(`  Overall:     ${(review.overallScore * 100).toFixed(0)}/100`);

      console.log(`\nRecommendation: ${review.recommendation}`);
      console.log(
        `Review Agents: ${review.reviewAgents.join(', ')}`
      );
      console.log(`---\n`);
    }
  }

  function conductMultiAgentReview(change: CodeChange): ReviewResult {
    const isSecurityFocused = change.description.includes('Security');
    const isPerformanceFocused =
      change.description.includes('Performance');

    const quality = isPerformanceFocused ? 0.75 : 0.85;
    const security = isSecurityFocused ? 0.95 : 0.7;
    const performance = isPerformanceFocused ? 0.92 : 0.65;

    const overallScore = (quality + security + performance) / 3;

    return {
      summary:
        overallScore > 0.8
          ? 'Well-implemented change with solid approach'
          : 'Changes need refinement before merge',
      quality,
      security,
      performance,
      overallScore,
      recommendation:
        overallScore > 0.85
          ? 'APPROVE'
          : overallScore > 0.7
            ? 'REQUEST_CHANGES'
            : 'COMMENT',
      reviewAgents: [
        'CodeQualityAgent',
        'SecurityAgent',
        'PerformanceAgent',
      ],
    };
  }
}

// ============================================================================
// Example 6: Adaptive Agent - Context-Aware Reasoning
// ============================================================================

/**
 * Example 6: Adaptive Agent with Context
 *
 * Use Case: Agent dynamically adjusts reasoning paths based on context
 * Different types of users receive tailored responses:
 * - Technical users: More analytical, code examples
 * - Business users: More empirical, metrics and ROI
 * - Creative users: More creative, unconventional solutions
 */

namespace Example6_AdaptiveAgent {
  export type UserProfile = 'technical' | 'business' | 'creative';

  export interface UserContext {
    profile: UserProfile;
    expertise: string;
    question: string;
  }

  export interface AdaptiveResponse {
    response: string;
    weights: {
      analytical: number;
      creative: number;
      empirical: number;
    };
    reasoning: string;
  }

  export async function demonstrateAdaptiveAgent() {
    console.log('\n=== Example 6: Adaptive Agent ===\n');

    const contexts: UserContext[] = [
      {
        profile: 'technical',
        expertise: 'Backend development',
        question:
          'How do we improve API performance?',
      },
      {
        profile: 'business',
        expertise: 'Product management',
        question:
          'Should we invest in this new feature?',
      },
      {
        profile: 'creative',
        expertise: 'UI/UX design',
        question:
          'How should we redesign the user experience?',
      },
    ];

    for (const context of contexts) {
      console.log(
        `User Profile: ${context.profile} | Expertise: ${context.expertise}`
      );
      console.log(`Question: ${context.question}`);

      const response = adaptResponseToProfile(context);

      console.log(`\nResponse: ${response.response}`);
      console.log(`\nAdaptive Weights:`);
      console.log(
        `  Analytical: ${(response.weights.analytical * 100).toFixed(0)}%`
      );
      console.log(
        `  Creative:   ${(response.weights.creative * 100).toFixed(0)}%`
      );
      console.log(
        `  Empirical:  ${(response.weights.empirical * 100).toFixed(0)}%`
      );
      console.log(`\nReasoning: ${response.reasoning}\n---\n`);
    }
  }

  function adaptResponseToProfile(
    context: UserContext
  ): AdaptiveResponse {
    const responseMap = {
      technical: {
        response:
          'Implement caching, optimize queries, and use connection pooling...',
        weights: {
          analytical: 0.6,
          creative: 0.2,
          empirical: 0.2,
        },
        reasoning:
          'Technical users benefit from detailed analysis and code examples',
      },
      business: {
        response:
          'ROI analysis shows 3x return within 12 months with 40% user engagement increase...',
        weights: {
          analytical: 0.3,
          creative: 0.1,
          empirical: 0.6,
        },
        reasoning:
          'Business users prioritize data-driven metrics and financial impact',
      },
      creative: {
        response:
          'Reimagine the interface as a conversational experience with adaptive layouts...',
        weights: {
          analytical: 0.2,
          creative: 0.6,
          empirical: 0.2,
        },
        reasoning:
          'Creative professionals value innovative approaches and novel solutions',
      },
    };

    return responseMap[context.profile];
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateVector(size: number, scale: number): number[] {
  const vector: number[] = [];
  for (let i = 0; i < size; i++) {
    vector.push(Math.random() * scale);
  }
  return vector;
}

// ============================================================================
// Main Demo Runner
// ============================================================================

export async function runAllExamples() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║        MindLang Agent - Comprehensive Usage Examples          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  try {
    await Example1_QAAgent.demonstrateQAAgent();
    await Example2_BugAgent.demonstrateBugAgent();
    await Example3_CreativeAgent.demonstrateCreativeAgent();
    await Example4_DataAgent.demonstrateDataAgent();
    await Example5_MultiAgent.demonstrateMultiAgentReview();
    await Example6_AdaptiveAgent.demonstrateAdaptiveAgent();

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║               All Examples Completed Successfully             ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Execute if run directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}
