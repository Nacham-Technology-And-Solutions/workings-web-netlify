/**
 * Persistent logging system that survives page redirects
 * Logs are stored in localStorage and can be viewed/downloaded
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

const MAX_LOGS = 1000; // Maximum number of logs to keep
const LOG_STORAGE_KEY = 'app_logs';
const LOG_META_KEY = 'app_logs_meta';

interface LogMeta {
  totalLogs: number;
  lastCleared: number;
}

class Logger {
  private logs: LogEntry[] = [];
  private isEnabled: boolean = true;

  constructor() {
    // Load any saved enabled state from localStorage (if previously set)
    try {
      const savedEnabled = localStorage.getItem('logger_enabled');
      if (savedEnabled !== null) {
        this.isEnabled = savedEnabled === 'true';
      }
    } catch (error) {
      // localStorage might not be available, use default
      console.warn('Could not load logger enabled state:', error);
    }

    this.loadLogs();
    // Clear old logs on initialization if needed
    this.rotateLogs();

    // Log initialization (this will always log to console, even if saving is disabled)
    console.log('[LOGGER] Logger initialized', {
      enabled: this.isEnabled,
      logCount: this.logs.length,
    });
  }

  /**
   * Load logs from localStorage
   */
  private loadLogs(): void {
    try {
      const stored = localStorage.getItem(LOG_STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load logs from localStorage:', error);
      this.logs = [];
    }
  }

  /**
   * Save logs to localStorage
   */
  private saveLogs(): void {
    if (!this.isEnabled) return;

    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
      this.updateMeta();
    } catch (error) {
      // If localStorage is full, try to clear old logs
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('localStorage full, clearing old logs');
        this.clearOldLogs(0.5); // Clear 50% of oldest logs
        try {
          localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
        } catch (e) {
          console.error('Failed to save logs after clearing:', e);
        }
      } else {
        console.error('Failed to save logs:', error);
      }
    }
  }

  /**
   * Update metadata about logs
   */
  private updateMeta(): void {
    try {
      const meta: LogMeta = {
        totalLogs: this.logs.length,
        lastCleared: Date.now(),
      };
      localStorage.setItem(LOG_META_KEY, JSON.stringify(meta));
    } catch (error) {
      // Ignore metadata errors
    }
  }

  /**
   * Rotate logs to prevent overflow
   */
  private rotateLogs(): void {
    if (this.logs.length > MAX_LOGS) {
      // Keep the most recent MAX_LOGS entries
      this.logs = this.logs.slice(-MAX_LOGS);
      this.saveLogs();
    }
  }

  /**
   * Clear old logs (keep percentage of most recent)
   */
  private clearOldLogs(keepPercentage: number = 0.5): void {
    const keepCount = Math.floor(this.logs.length * keepPercentage);
    this.logs = this.logs.slice(-keepCount);
  }

  /**
   * Create a log entry
   */
  private createLogEntry(
    level: LogLevel,
    category: string,
    message: string,
    data?: any
  ): LogEntry {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : undefined, // Deep clone
    };

    // Add stack trace for errors
    if (level === LogLevel.ERROR && data?.error instanceof Error) {
      entry.stack = data.error.stack;
    }

    return entry;
  }

  /**
   * Add a log entry
   */
  private log(level: LogLevel, category: string, message: string, data?: any): void {
    // Always log to console for immediate visibility (even if saving is disabled)
    const consoleMethod = level === LogLevel.ERROR ? 'error' :
                         level === LogLevel.WARN ? 'warn' :
                         level === LogLevel.DEBUG ? 'debug' : 'log';
    
    const logPrefix = `[${level}] [${category}]`;
    if (data) {
      console[consoleMethod](logPrefix, message, data);
    } else {
      console[consoleMethod](logPrefix, message);
    }

    // Only save to localStorage if enabled
    if (this.isEnabled) {
      const entry = this.createLogEntry(level, category, message, data);
      this.logs.push(entry);
      this.rotateLogs();
      this.saveLogs();
    }
  }

  /**
   * Log debug message
   */
  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  /**
   * Log info message
   */
  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  /**
   * Log warning message
   */
  warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  /**
   * Log error message
   */
  error(category: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  /**
   * Log API request
   */
  logRequest(method: string, url: string, headers?: any, data?: any): void {
    this.info('API_REQUEST', `${method} ${url}`, {
      method,
      url,
      headers: this.sanitizeHeaders(headers),
      data: this.sanitizeData(data),
    });
  }

  /**
   * Log API response
   */
  logResponse(method: string, url: string, status: number, data?: any, duration?: number): void {
    const level = status >= 400 ? LogLevel.ERROR : status >= 300 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, 'API_RESPONSE', `${method} ${url} - ${status}`, {
      method,
      url,
      status,
      duration: duration ? `${duration}ms` : undefined,
      data: this.sanitizeData(data),
    });
  }

  /**
   * Log API error
   */
  logApiError(method: string, url: string, error: any, duration?: number): void {
    this.error('API_ERROR', `${method} ${url}`, {
      method,
      url,
      error: {
        message: error?.message,
        code: error?.code,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: this.sanitizeData(error?.response?.data),
      },
      duration: duration ? `${duration}ms` : undefined,
      stack: error?.stack,
    });
  }

  /**
   * Log authentication event
   */
  logAuthEvent(event: string, data?: any): void {
    this.info('AUTH', event, data);
  }

  /**
   * Log redirect
   */
  logRedirect(from: string, to: string, reason?: string): void {
    this.warn('REDIRECT', `Redirecting from ${from} to ${to}`, {
      from,
      to,
      reason,
    });
  }

  /**
   * Sanitize headers (remove sensitive data)
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers) return undefined;
    
    const sanitized = { ...headers };
    // Remove or mask sensitive headers
    if (sanitized.Authorization) {
      sanitized.Authorization = 'Bearer ***';
    }
    if (sanitized.email) {
      sanitized.email = '***@***';
    }
    return sanitized;
  }

  /**
   * Sanitize data (remove sensitive fields)
   */
  private sanitizeData(data: any): any {
    if (!data) return undefined;
    
    try {
      const str = JSON.stringify(data);
      // Remove sensitive fields
      const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'apiKey'];
      let sanitized = str;
      
      sensitiveFields.forEach(field => {
        const regex = new RegExp(`"${field}"\\s*:\\s*"[^"]*"`, 'gi');
        sanitized = sanitized.replace(regex, `"${field}":"***"`);
      });
      
      return JSON.parse(sanitized);
    } catch {
      return data;
    }
  }

  /**
   * Get all logs
   */
  getLogs(level?: LogLevel, category?: string, limit?: number): LogEntry[] {
    let filtered = [...this.logs];

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    if (category) {
      filtered = filtered.filter(log => log.category === category);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  /**
   * Get logs as formatted text
   */
  getLogsAsText(level?: LogLevel, category?: string): string {
    const logs = this.getLogs(level, category);
    return logs.map(log => {
      const date = new Date(log.timestamp).toISOString();
      const dataStr = log.data ? `\n  Data: ${JSON.stringify(log.data, null, 2)}` : '';
      const stackStr = log.stack ? `\n  Stack: ${log.stack}` : '';
      return `[${date}] [${log.level}] [${log.category}] ${log.message}${dataStr}${stackStr}`;
    }).join('\n\n');
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(LOG_STORAGE_KEY);
    localStorage.removeItem(LOG_META_KEY);
    this.info('LOGGER', 'Logs cleared');
  }

  /**
   * Get log statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byCategory: Record<string, number>;
    oldest: number;
    newest: number;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0,
      } as Record<LogLevel, number>,
      byCategory: {} as Record<string, number>,
      oldest: this.logs[0]?.timestamp || 0,
      newest: this.logs[this.logs.length - 1]?.timestamp || 0,
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
    });

    return stats;
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    // Persist enabled state to localStorage
    try {
      localStorage.setItem('logger_enabled', enabled.toString());
      console.log(`[LOGGER] Logging ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.warn('Could not save logger enabled state:', error);
    }
  }

  /**
   * Check if logging is enabled
   */
  isLoggingEnabled(): boolean {
    return this.isEnabled;
  }
}

// Export singleton instance
export const logger = new Logger();

// Also export for convenience
export default logger;

