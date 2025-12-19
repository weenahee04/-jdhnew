import { logger } from './logger.js';

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  lastFailureTime?: number;
  successCount: number;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  halfOpenMaxCalls?: number;
}

const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
  failureThreshold: 5,
  resetTimeoutMs: 60000, // 1 minute
  halfOpenMaxCalls: 3,
};

export class CircuitBreaker {
  private state: CircuitBreakerState;
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.state = {
      state: 'closed',
      failures: 0,
      successCount: 0,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state.state === 'open') {
      if (Date.now() - (this.state.lastFailureTime || 0) > this.options.resetTimeoutMs) {
        this.state.state = 'half-open';
        this.state.successCount = 0;
        logger.info('Circuit breaker entering half-open state');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state.state === 'half-open') {
      this.state.successCount++;
      if (this.state.successCount >= this.options.halfOpenMaxCalls) {
        this.state.state = 'closed';
        this.state.failures = 0;
        logger.info('Circuit breaker closed - service recovered');
      }
    } else {
      this.state.failures = 0;
    }
  }

  private onFailure() {
    this.state.failures++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failures >= this.options.failureThreshold) {
      this.state.state = 'open';
      logger.warn(`Circuit breaker opened after ${this.state.failures} failures`);
    }
  }

  getState() {
    return this.state.state;
  }
}

