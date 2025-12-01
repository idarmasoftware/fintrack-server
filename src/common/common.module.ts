import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { LoggerMiddleware } from './middlewares/logger.middleware';

@Module({
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonModule],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
