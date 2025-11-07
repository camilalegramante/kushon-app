import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CookieAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.Authorization;
    if (token) {
      req.headers.authorization = `Bearer ${token}`;
    }
    next();
  }
}
