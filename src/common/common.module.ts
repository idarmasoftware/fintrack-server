import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CommonService } from './common.service';
import { CommonController } from './common.controller';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { SlackService } from './slack/slack.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    MulterModule.register({
      dest: './upload',
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService, SlackService],
  exports: [CommonModule, SlackService],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*splat');
  }
}
