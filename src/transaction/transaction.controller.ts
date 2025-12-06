import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type UserPayload } from '../auth/interfaces/user-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) { }

  @Post()
  create(@CurrentUser() user: UserPayload, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(user, createTransactionDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: UserPayload,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('category_id') categoryId?: string,
    @Query('account_id') accountId?: string,
  ) {
    return this.transactionService.findAll(user, { page, limit, search, startDate, endDate, categoryId, accountId });
  }

  @Get(':id')
  findOne(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.transactionService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: UserPayload,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, user, updateTransactionDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: UserPayload, @Param('id') id: string) {
    return this.transactionService.remove(id, user);
  }
}
