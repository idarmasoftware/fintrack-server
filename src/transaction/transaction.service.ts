import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Transaction } from './entities/transaction.entity';
import { Account } from '../account/entities/account.entity';
import { UserPayload } from '../auth/interfaces/user-payload.interface';
import { TransactionType } from './enums/transaction-type.enum';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource, // Untuk transaction management
  ) {}

  async create(user: UserPayload, dto: CreateTransactionDto) {
    // Mulai Query Runner (Database Transaction Session)
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Cari Account (Dompet) user
      const account = await queryRunner.manager.findOne(Account, {
        where: { id: dto.account_id, user_id: user.id },
      });

      if (!account) {
        throw new NotFoundException('Account/Dompet tidak ditemukan atau bukan milik Anda');
      }

      // 2. Hitung Saldo Baru
      let newBalance = Number(account.balance); // Konversi ke number untuk hitungan
      const amount = Number(dto.amount);

      if (dto.type === TransactionType.EXPENSE) {
        if (newBalance < amount) {
          // Opsional: Throw error jika saldo tidak cukup
          throw new BadRequestException('Saldo tidak mencukupi');
        }
        newBalance -= amount;
      } else if (dto.type === TransactionType.INCOME) {
        newBalance += amount;
      }

      // 3. Update Saldo Account
      // Kita update saldo di memory object account, lalu save pakai manager
      account.balance = newBalance;
      await queryRunner.manager.save(account);

      // 4. Simpan Transaksi
      // Create instance transaksi baru
      const transaction = queryRunner.manager.create(Transaction, {
        ...dto,
        user_id: user.id, // Set pemilik
        // UUID v7 akan otomatis digenerate oleh @BeforeInsert di entity
      });

      const savedTransaction = await queryRunner.manager.save(transaction);

      // 5. Commit (Simpan Permanen)
      await queryRunner.commitTransaction();

      return {
        message: 'Transaksi berhasil disimpan',
        data: savedTransaction,
      };
    } catch (err) {
      // Jika ada error, batalkan semua perubahan DB
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      // Tutup koneksi query runner
      await queryRunner.release();
    }
  }

  async findAll(user: UserPayload) {
    return this.transactionRepository.find({
      where: { user_id: user.id },
      order: { date_created: 'DESC' },
      relations: ['category', 'account'], // Load detail kategori & akun
    });
  }
}
