import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type UserPayload } from '../auth/interfaces/user-payload.interface';

@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  create(@CurrentUser() user: UserPayload, @Body() createAccountDto: CreateAccountDto) {
    return this.accountService.create(user, createAccountDto);
  }

  @Get()
  findAll(@CurrentUser() user: UserPayload) {
    return this.accountService.findAll(user);
  }
}
