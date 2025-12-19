import { getEnv } from '../../config/env.js';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private level: LogLevel;
  private requestId?: string;

  constructor() {
    const env = getEnv();
    this.level = env.LOG_LEVEL;
  }

  setRequestId(id: string) {
    this.requestId = id;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private format(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const reqId = this.requestId ? `[${this.requestId}]` : '';
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()} ${reqId} ${message}${metaStr}`;
  }

  debug(message: string, meta?: unknown) {
    if (this.shouldLog('debug')) {
      console.debug(this.format('debug', message, meta));
    }
  }

  info(message: string, meta?: unknown) {
    if (this.shouldLog('info')) {
      console.log(this.format('info', message, meta));
    }
  }

  warn(message: string, meta?: unknown) {
    if (this.shouldLog('warn')) {
      console.warn(this.format('warn', message, meta));
    }
  }

  error(message: string, error?: Error | unknown, meta?: unknown) {
    if (this.shouldLog('error')) {
      const errorMeta = error instanceof Error 
        ? { message: error.message, stack: error.stack, ...meta }
        : { error, ...meta };
      console.error(this.format('error', message, errorMeta));
    }
  }
}

export const logger = new Logger();

