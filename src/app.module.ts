import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [CoreModule, CommonModule, UserModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
