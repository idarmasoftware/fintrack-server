import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { SlackModule } from './slack/slack.module';

@Module({
  imports: [SlackModule],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonModule, SlackModule],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
