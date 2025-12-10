import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
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

  @Post('transfer')
  transfer(@CurrentUser() user: UserPayload, @Body() createTransferDto: CreateTransferDto) {
    return this.transactionService.transfer(user, createTransferDto);
  }

  @Get('export/pdf')
  async exportPdf(
    @CurrentUser() user: UserPayload,
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('category_id') categoryId?: string,
    @Query('account_id') accountId?: string,
  ) {
    const buffer = await this.transactionService.exportPdf(user, {
      search,
      startDate,
      endDate,
      categoryId,
      accountId,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename=transactions.pdf',
      'Content-Length': buffer.length.toString(),
    });

    res.end(buffer);
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
