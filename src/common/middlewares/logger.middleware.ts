import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private logger: Logger) {}
  use(req: Request, _res: Response, next: NextFunction) {
    this.logger.http(`${req.method} ${req.originalUrl} ${req.ip}`, {
      context: 'Logger Middleware',
    });
    next();
  }
}
