import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';
import { CreateAccountDto } from './dto/create-account.dto';
import { UserPayload } from '../auth/interfaces/user-payload.interface';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) { }

  async create(user: UserPayload, createAccountDto: CreateAccountDto) {
    const account = this.accountRepository.create({
      ...createAccountDto,
      user_id: user.id, // Dompet ini milik user yang login
    });
    return this.accountRepository.save(account);
  }

  async findAll(user: UserPayload) {
    return this.accountRepository.find({
      where: { user_id: user.id },
      order: { name: 'ASC' },
      withDeleted: false, // Explicitly exclude soft-deleted
    });
  }

  async findOne(id: string, user: UserPayload) {
    return this.accountRepository.findOne({
      where: { id, user_id: user.id },
    });
  }

  async update(id: string, user: UserPayload, updateAccountDto: CreateAccountDto) { // Using CreateAccountDto as base or UpdateAccountDto
    // Check if exists and belongs to user
    const account = await this.findOne(id, user);
    if (!account) {
      throw new Error('Account not found or access denied');
    }
    await this.accountRepository.update(id, updateAccountDto);
    return this.findOne(id, user);
  }

  async remove(id: string, user: UserPayload) {
    // Check if exists and belongs to user
    const account = await this.findOne(id, user);
    if (!account) {
      throw new Error('Account not found or access denied');
    }
    return this.accountRepository.softDelete(id);
  }
}
