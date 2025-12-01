import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER, WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { SlackService } from './common/slack/slack.service'; // Import SlackService

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: false,
    cors: true,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // === PERUBAHAN DI SINI ===
  // 1. Ambil instance SlackService dari container aplikasi
  const slackService = app.get(SlackService);

  // 2. Masukkan ke dalam GlobalExceptionFilter
  app.useGlobalFilters(new GlobalExceptionFilter(slackService));
  // ==========================

  app.useGlobalInterceptors(new ResponseInterceptor());

  const configService = app.get(ConfigService);
  const logger = app.get<Logger>(WINSTON_MODULE_PROVIDER);
  const port: number = configService.getOrThrow<number>('app.port');

  await app.listen(port);
  logger.info(`Application running on port: ${port}`, {
    context: 'Bootstrap Application',
  });
}

void bootstrap();
