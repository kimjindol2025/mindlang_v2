/**
 * MindLang Agent Integrations
 * External system integration layer for agents
 * Approximately 200 lines
 */

import {
  ValidationResult,
  DatabaseQuery,
  DatabaseResult,
  ExternalAPIOptions,
  IntegrationError,
  CacheError,
  CacheEntry,
} from './types';

// ============================================================================
// Integration Configuration
// ============================================================================

export interface IntegrationConfig {
  claudeAPIKey?: string;
  databaseURL?: string;
  databaseCredentials?: {
    user: string;
    password: string;
    database: string;
  };
  externalAPIs?: Map<string, string>;
  cacheConfig?: {
    enabled: boolean;
    ttl: number;
  };
}

// ============================================================================
// Agent Integration Layer
// ============================================================================

export class AgentIntegration {
  private config: IntegrationConfig;
  private codeValidator: CodeValidator;
  private databaseManager: DatabaseManager;
  private cacheManager: CacheManager;
  private apiManager: APIManager;

  constructor(config: IntegrationConfig = {}) {
    this.config = config;
    this.codeValidator = new CodeValidator();
    this.databaseManager = new DatabaseManager(config.databaseURL, config.databaseCredentials);
    this.cacheManager = new CacheManager(config.cacheConfig);
    this.apiManager = new APIManager(config.externalAPIs || new Map());
  }

  /**
   * Validate code using FreeLang v4
   */
  async validateCodeWithFreeLang(code: string): Promise<ValidationResult> {
    try {
      return await this.codeValidator.validate(code);
    } catch (error) {
      throw new IntegrationError(`Code validation failed: ${error}`, { code, error });
    }
  }

  /**
   * Call Claude API (placeholder for actual Claude integration)
   */
  async callClaudeAPI(prompt: string): Promise<string> {
    if (!this.config.claudeAPIKey) {
      throw new IntegrationError('Claude API key not configured');
    }

    try {
      // Check cache first
      const cached = this.cacheManager.get(`claude:${prompt.slice(0, 50)}`);
      if (cached) {
        return cached;
      }

      // Simulate Claude API call
      const response = await this.simulateClaudeCall(prompt);

      // Cache response
      this.cacheManager.set(`claude:${prompt.slice(0, 50)}`, response, 3600);

      return response;
    } catch (error) {
      throw new IntegrationError(`Claude API call failed: ${error}`, { prompt, error });
    }
  }

  /**
   * Query database
   */
  async queryDatabase(query: DatabaseQuery): Promise<DatabaseResult> {
    try {
      // Check cache
      if (query.cache) {
        const cacheKey = `db:${query.sql.slice(0, 50)}`;
        const cached = this.cacheManager.get(cacheKey);
        if (cached) {
          return cached as DatabaseResult;
        }
      }

      // Execute query
      const startTime = Date.now();
      const result = await this.databaseManager.execute(query);
      const executionTime = Date.now() - startTime;

      // Add execution time to result
      const resultWithTiming: DatabaseResult = {
        ...result,
        executionTime,
      };

      // Cache if requested
      if (query.cache) {
        const cacheKey = `db:${query.sql.slice(0, 50)}`;
        this.cacheManager.set(cacheKey, resultWithTiming, 1800);
      }

      return resultWithTiming;
    } catch (error) {
      throw new IntegrationError(`Database query failed: ${error}`, { query, error });
    }
  }

  /**
   * Call external API
   */
  async callExternalAPI(url: string, options: ExternalAPIOptions): Promise<any> {
    try {
      return await this.apiManager.call(url, options);
    } catch (error) {
      throw new IntegrationError(`External API call failed: ${error}`, { url, options, error });
    }
  }

  /**
   * Get cached result
   */
  getCachedResult(key: string): any | null {
    try {
      return this.cacheManager.get(key);
    } catch (error) {
      console.warn(`Cache retrieval error: ${error}`);
      return null;
    }
  }

  /**
   * Set cached result
   */
  setCachedResult(key: string, value: any, ttl: number = 3600): void {
    try {
      this.cacheManager.set(key, value, ttl);
    } catch (error) {
      console.warn(`Cache write error: ${error}`);
    }
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.cacheManager.clear();
  }
}

// ============================================================================
// Code Validator
// ============================================================================

class CodeValidator {
  /**
   * Validate code against FreeLang v4 rules
   */
  async validate(code: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check syntax
    if (!this.checkSyntax(code)) {
      errors.push('Invalid syntax detected');
      score -= 30;
    }

    // Check for dangerous patterns
    if (this.hasDangerousPatterns(code)) {
      errors.push('Dangerous code patterns detected');
      score -= 40;
    }

    // Check type safety
    if (!this.checkTypeSafety(code)) {
      warnings.push('Type safety issues detected');
      score -= 10;
    }

    // Check best practices
    if (!this.checkBestPractices(code)) {
      warnings.push('Code style issues detected');
      score -= 5;
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  private checkSyntax(code: string): boolean {
    // Basic syntax validation
    const bracketMatch = (code.match(/{/g) || []).length === (code.match(/}/g) || []).length;
    const parenMatch = (code.match(/\(/g) || []).length === (code.match(/\)/g) || []).length;
    const bracketMatch2 = (code.match(/\[/g) || []).length === (code.match(/\]/g) || []).length;

    return bracketMatch && parenMatch && bracketMatch2;
  }

  private hasDangerousPatterns(code: string): boolean {
    const dangerousPatterns = [/eval\(/i, /exec\(/i, /Function\(/i];
    return dangerousPatterns.some((pattern) => pattern.test(code));
  }

  private checkTypeSafety(code: string): boolean {
    // Check for type annotations
    const hasTypeAnnotations = /:\s*(string|number|boolean|any)\b/.test(code);
    return hasTypeAnnotations;
  }

  private checkBestPractices(code: string): boolean {
    // Check for variable naming, comments, etc.
    const hasComments = /\/\/|\/\*/.test(code);
    return hasComments;
  }
}

// ============================================================================
// Database Manager
// ============================================================================

class DatabaseManager {
  private url: string | undefined;
  private credentials: any;

  constructor(url: string | undefined, credentials?: any) {
    this.url = url;
    this.credentials = credentials;
  }

  /**
   * Execute database query
   */
  async execute(query: DatabaseQuery): Promise<DatabaseResult> {
    if (!this.url) {
      throw new Error('Database not configured');
    }

    // Simulate database query
    return {
      rows: this.generateMockRows(query.sql),
      columns: this.extractColumns(query.sql),
      rowCount: Math.floor(Math.random() * 100),
      executionTime: 50 + Math.random() * 150,
    };
  }

  private generateMockRows(sql: string): any[] {
    const count = Math.floor(Math.random() * 10);
    return Array(count)
      .fill(null)
      .map((_, i) => ({
        id: i + 1,
        value: `data_${i}`,
        timestamp: Date.now() - Math.random() * 86400000,
      }));
  }

  private extractColumns(sql: string): string[] {
    const selectMatch = sql.match(/SELECT\s+([^FROM]+)\s+FROM/i);
    if (selectMatch) {
      return selectMatch[1]
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c !== '*');
    }
    return ['id', 'value', 'timestamp'];
  }
}

// ============================================================================
// Cache Manager
// ============================================================================

class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private config: {
    enabled: boolean;
    ttl: number;
  };

  constructor(config?: { enabled?: boolean; ttl?: number }) {
    this.config = {
      enabled: config?.enabled ?? true,
      ttl: config?.ttl ?? 3600,
    };
  }

  /**
   * Get value from cache
   */
  get(key: string): any | null {
    if (!this.config.enabled) {
      return null;
    }

    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update hit count
    entry.hits++;
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: any, ttl: number = this.config.ttl): void {
    if (!this.config.enabled) {
      return;
    }

    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    entries: number;
    totalHits: number;
  } {
    let totalHits = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
    }

    return {
      size: this.cache.size,
      entries: this.cache.size,
      totalHits,
    };
  }
}

// ============================================================================
// API Manager
// ============================================================================

class APIManager {
  private apis: Map<string, string>;

  constructor(apis: Map<string, string> = new Map()) {
    this.apis = apis;
  }

  /**
   * Call external API
   */
  async call(url: string, options: ExternalAPIOptions): Promise<any> {
    const method = options.method || 'GET';
    const timeout = options.timeout || 30000;

    try {
      // Simulate API call with timeout
      return await this.simulateAPICall(url, method, timeout, options.body);
    } catch (error) {
      if (options.retries && options.retries > 0) {
        options.retries--;
        return this.call(url, options);
      }
      throw error;
    }
  }

  private async simulateAPICall(
    url: string,
    method: string,
    timeout: number,
    body?: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`API call timeout after ${timeout}ms`));
      }, timeout);

      setTimeout(() => {
        clearTimeout(timer);
        resolve({
          status: 200,
          data: { message: 'Success', url, method },
          timestamp: Date.now(),
        });
      }, Math.random() * 1000);
    });
  }

  /**
   * Register API endpoint
   */
  registerAPI(name: string, url: string): void {
    this.apis.set(name, url);
  }

  /**
   * Get registered APIs
   */
  getAPIs(): Map<string, string> {
    return new Map(this.apis);
  }
}

export default AgentIntegration;
export { AgentIntegration, CodeValidator, DatabaseManager, CacheManager, APIManager };
