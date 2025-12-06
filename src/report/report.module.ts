import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { Transaction } from '../transaction/entities/transaction.entity';
import { Account } from '../account/entities/account.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Transaction, Account])],
    controllers: [ReportController],
    providers: [ReportService],
})
export class ReportModule { }
