import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    this.logger.log(`➡️  ${method} ${originalUrl} - ${ip} - ${userAgent}`);

    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const sanitizedBody = this.sanitizeBody(req.body);
      if (Object.keys(sanitizedBody).length > 0) {
        this.logger.debug(`   📦 Body: ${JSON.stringify(sanitizedBody)}`);
      }
    }

    const originalSend = res.send;
    res.send = function (body: any): Response {
      res.send = originalSend;
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      const statusEmoji = statusCode >= 500 ? '❌' : statusCode >= 400 ? '⚠️' : '✅';

      const logger = new Logger('HTTP');
      logger.log(
        `${statusEmoji} ${method} ${originalUrl} - ${statusCode} - ${responseTime}ms`
      );

      return res.send(body);
    };

    next();
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return {};
    }

    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'apiKey'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}