export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.MODE === 'development';
  }

  private formatMessage(level: LogLevel, context: string, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${context}] ${message}`;
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'DEBUG':
        return '🔍';
      case 'INFO':
        return '📘';
      case 'WARN':
        return '⚠️';
      case 'ERROR':
        return '❌';
      default:
        return '📋';
    }
  }

  private log(level: LogLevel, context: string, message: string, data?: any) {
    const emoji = this.getEmoji(level);
    const formattedMessage = this.formatMessage(level, context, message);
    const displayMessage = `${emoji} ${formattedMessage}`;

    switch (level) {
      case 'DEBUG':
        if (this.isDevelopment) {
          console.debug(displayMessage, data || '');
        }
        break;
      case 'INFO':
        console.info(displayMessage, data || '');
        break;
      case 'WARN':
        console.warn(displayMessage, data || '');
        break;
      case 'ERROR':
        console.error(displayMessage, data || '');
        break;
    }

    if (!this.isDevelopment) {
      console.log(displayMessage);
      if (data) {
        console.log('  Data:', JSON.stringify(data, null, 2));
      }
    }
  }

  debug(context: string, message: string, data?: any) {
    this.log('DEBUG', context, message, data);
  }

  info(context: string, message: string, data?: any) {
    this.log('INFO', context, message, data);
  }

  warn(context: string, message: string, data?: any) {
    this.log('WARN', context, message, data);
  }

  error(context: string, message: string, error?: any) {
    this.log('ERROR', context, message, error);

    if (error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  apiRequest(method: string, url: string, data?: any) {
    const sanitizedData = this.sanitizeData(data);
    this.info('API', `➡️  ${method} ${url}`, sanitizedData);
  }

  apiResponse(method: string, url: string, status: number, duration: number, data?: any) {
    const statusEmoji = status >= 500 ? '❌' : status >= 400 ? '⚠️' : '✅';
    this.info('API', `${statusEmoji} ${method} ${url} - ${status} - ${duration}ms`, data);
  }

  apiError(method: string, url: string, error: any) {
    this.error('API', `❌ ${method} ${url} failed`, error);
  }

  startup(message: string, data?: any) {
    this.info('Startup', message, data);
  }

  navigation(from: string, to: string) {
    this.info('Navigation', `${from} → ${to}`);
  }

  auth(message: string, data?: any) {
    this.info('Auth', message, this.sanitizeData(data));
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    const sensitiveFields = ['password', 'token', 'authorization', 'secret', 'apiKey'];

    if (typeof data === 'object') {
      const sanitized = { ...data };
      for (const field of sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '***REDACTED***';
        }
      }
      return sanitized;
    }

    return data;
  }
}

export const logger = new Logger();
export default logger;