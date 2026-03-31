import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { Account } from './entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account])], // Load Entity
  controllers: [AccountController], // Load Controller
  providers: [AccountService], // Load Service
  exports: [TypeOrmModule], // Biar TransactionModule bisa pakai repository Account
})
export class AccountModule {}
