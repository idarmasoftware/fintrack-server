import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type UserPayload } from '../auth/interfaces/user-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(@CurrentUser() user: UserPayload, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(user, createTransactionDto);
  }

  @Get()
  findAll(@CurrentUser() user: UserPayload) {
    return this.transactionService.findAll(user);
  }
}
