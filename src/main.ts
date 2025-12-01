import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER, WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: false,
    cors: true,
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const logger = app.get<Logger>(WINSTON_MODULE_PROVIDER);
  const port: number = configService.getOrThrow<number>('app.port');

  await app.listen(port);
  logger.info(`Application running on port: ${port}`, {
    context: 'Bootstrap Application',
  });
}

void bootstrap();
