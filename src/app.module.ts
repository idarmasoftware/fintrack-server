import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { CommonModule } from './common/common.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AccountModule } from './account/account.module';
import { TransactionModule } from './transaction/transaction.module';
import { CategoryModule } from './category/category.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    CoreModule,
    CommonModule,
    UserModule,
    AuthModule,
    AccountModule,
    TransactionModule,
    CategoryModule,
    ReportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
