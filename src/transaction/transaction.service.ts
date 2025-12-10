import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Between, ILike } from 'typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { Transaction } from './entities/transaction.entity';
import { Account } from '../account/entities/account.entity';
import { UserPayload } from '../auth/interfaces/user-payload.interface';
import { TransactionType } from './enums/transaction-type.enum';
import PDFDocument from 'pdfkit';

@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    private readonly dataSource: DataSource, // Untuk transaction management
  ) { }

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

  async transfer(user: UserPayload, dto: CreateTransferDto) {
    if (dto.source_account_id === dto.destination_account_id) {
      throw new BadRequestException('Source and destination accounts must be different');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Fetch Accounts
      const sourceAccount = await queryRunner.manager.findOne(Account, {
        where: { id: dto.source_account_id, user_id: user.id },
      });
      const destAccount = await queryRunner.manager.findOne(Account, {
        where: { id: dto.destination_account_id, user_id: user.id },
      });

      if (!sourceAccount) throw new NotFoundException('Source account not found');
      if (!destAccount) throw new NotFoundException('Destination account not found');

      // 2. Check Balance
      const amount = Number(dto.amount);
      if (Number(sourceAccount.balance) < amount) {
        throw new BadRequestException('Insufficient balance in source account');
      }

      // 3. Update Balances
      sourceAccount.balance = Number(sourceAccount.balance) - amount;
      destAccount.balance = Number(destAccount.balance) + amount;

      await queryRunner.manager.save(sourceAccount);
      await queryRunner.manager.save(destAccount);

      // 4. Create Transactions
      // Source: Expense (Transfer Out)
      const sourceTransaction = queryRunner.manager.create(Transaction, {
        amount: amount,
        type: TransactionType.EXPENSE,
        account_id: sourceAccount.id,
        user_id: user.id,
        description: dto.description ? `Transfer Out: ${dto.description}` : `Transfer to ${destAccount.name}`,
        date_created: dto.date ? new Date(dto.date) : new Date(),
        // category_id is nullable now, so we can skip or set if we had a default
      });

      // Destination: Income (Transfer In)
      const destTransaction = queryRunner.manager.create(Transaction, {
        amount: amount,
        type: TransactionType.INCOME,
        account_id: destAccount.id,
        user_id: user.id,
        description: dto.description ? `Transfer In: ${dto.description}` : `Transfer from ${sourceAccount.name}`,
        date_created: dto.date ? new Date(dto.date) : new Date(),
      });

      await queryRunner.manager.save(sourceTransaction);
      await queryRunner.manager.save(destTransaction);

      await queryRunner.commitTransaction();

      return {
        message: 'Transfer successful',
        data: { source: sourceTransaction, destination: destTransaction },
      };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string, user: UserPayload) {
    return this.transactionRepository.findOne({
      where: { id, user_id: user.id },
      relations: ['category', 'account'],
    });
  }

  async update(id: string, user: UserPayload, dto: UpdateTransactionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get existing transaction
      const existingTransaction = await queryRunner.manager.findOne(Transaction, {
        where: { id, user_id: user.id },
        relations: ['account'],
      });

      if (!existingTransaction) throw new NotFoundException('Transaction not found');

      // 2. Revert Old Balance
      const oldAccount = await queryRunner.manager.findOne(Account, {
        where: { id: existingTransaction.account_id },
      });

      if (!oldAccount) throw new NotFoundException('Account linked to this transaction not found');

      if (existingTransaction.type === TransactionType.EXPENSE) {
        oldAccount.balance = Number(oldAccount.balance) + Number(existingTransaction.amount);
      } else {
        oldAccount.balance = Number(oldAccount.balance) - Number(existingTransaction.amount);
      }
      await queryRunner.manager.save(oldAccount);

      // 3. Prepare New Data (Merge DTO)
      // Note: If account_id changed, we need to handle that. simpler if we forbid account change?
      // For now, let's assume account MIGHT change.
      const targetAccountId = dto.account_id || existingTransaction.account_id;

      // 4. Apply New Balance
      // Fetch target account (might be same as oldAccount)
      const targetAccount = await queryRunner.manager.findOne(Account, {
        where: { id: targetAccountId, user_id: user.id },
      });
      if (!targetAccount) throw new NotFoundException('Target account not found');

      const amountToApply = Number(dto.amount ?? existingTransaction.amount);
      const typeToApply = dto.type ?? existingTransaction.type;

      if (typeToApply === TransactionType.EXPENSE) {
        if (Number(targetAccount.balance) < amountToApply) {
          throw new BadRequestException('Saldo tidak mencukupi untuk update transaksi ini');
        }
        targetAccount.balance = Number(targetAccount.balance) - amountToApply;
      } else {
        targetAccount.balance = Number(targetAccount.balance) + amountToApply;
      }
      await queryRunner.manager.save(targetAccount);

      // 5. Update Transaction Record
      Object.assign(existingTransaction, dto);
      const updatedTransaction = await queryRunner.manager.save(existingTransaction);

      await queryRunner.commitTransaction();
      return updatedTransaction;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string, user: UserPayload) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(Transaction, {
        where: { id, user_id: user.id },
        relations: ['account']
      });

      if (!transaction) throw new NotFoundException('Transaction not found');

      // Revert Balance
      const account = await queryRunner.manager.findOne(Account, {
        where: { id: transaction.account_id },
      });

      if (account) {
        if (transaction.type === TransactionType.EXPENSE) {
          account.balance = Number(account.balance) + Number(transaction.amount);
        } else {
          account.balance = Number(account.balance) - Number(transaction.amount);
        }
        await queryRunner.manager.save(account);
      }

      // Delete (Soft Remove)
      await queryRunner.manager.softRemove(transaction);

      await queryRunner.commitTransaction();
      return { message: 'Transaction deleted successfully' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  async findAll(
    user: UserPayload,
    filters?: {
      page?: number;
      limit?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
      categoryId?: string;
      accountId?: string
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { user_id: user.id };

    if (filters?.categoryId) {
      where.category_id = filters.categoryId;
    }

    if (filters?.accountId) {
      where.account_id = filters.accountId;
    }

    if (filters?.search) {
      where.description = ILike(`%${filters.search}%`);
    }

    if (filters?.startDate && filters?.endDate) {
      // Set time to start of day and end of day respectively
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);

      where.date_created = Between(start, end);
    }

    const [data, total] = await this.transactionRepository.findAndCount({
      where,
      order: { date_created: 'DESC' },
      relations: ['category', 'account'],
      take: limit,
      skip: skip,
    });

    return {
      data,
      meta: {
        total,
        page,
        last_page: Math.ceil(total / limit),
      },
    };
  }

  async exportPdf(
    user: UserPayload,
    filters?: {
      search?: string;
      startDate?: string;
      endDate?: string;
      categoryId?: string;
      accountId?: string;
    },
  ): Promise<Buffer> {
    const where: any = { user_id: user.id };

    if (filters?.categoryId) {
      where.category_id = filters.categoryId;
    }

    if (filters?.accountId) {
      where.account_id = filters.accountId;
    }

    if (filters?.search) {
      where.description = ILike(`%${filters.search}%`);
    }

    if (filters?.startDate && filters?.endDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);

      where.date_created = Between(start, end);
    }

    const transactions = await this.transactionRepository.find({
      where,
      order: { date_created: 'DESC' },
      relations: ['category', 'account'],
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk: any) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: any) => reject(err));

      // Title
      doc.fontSize(18).text('Laporan Transaksi', { align: 'center' });
      doc.moveDown();

      // Info Filter
      doc.fontSize(10);
      if (filters?.startDate && filters?.endDate) {
        doc.text(`Periode: ${filters.startDate} - ${filters.endDate}`, { align: 'center' });
      } else {
        doc.text('Periode: Semua Waktu', { align: 'center' });
      }
      doc.moveDown(2);

      // Table Header using simple layout
      const tableTop = 150;
      let y = tableTop;

      const drawRow = (date: string, desc: string, cat: string, type: string, amount: string, isHeader = false) => {
        const font = isHeader ? 'Helvetica-Bold' : 'Helvetica';
        doc.font(font).fontSize(10);

        doc.text(date, 50, y, { width: 80 });
        doc.text(desc, 130, y, { width: 170, lineBreak: false, ellipsis: true });
        doc.text(cat, 300, y, { width: 100 });
        doc.text(type, 400, y, { width: 60 });
        doc.text(amount, 460, y, { width: 100, align: 'right' });

        y += 20;
      };

      // Header
      drawRow('Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Jumlah', true);

      // Divider
      doc.moveTo(30, y - 5).lineTo(565, y - 5).stroke();

      // Data
      transactions.forEach((tx) => {
        if (y > 750) {
          doc.addPage();
          y = 50;
          drawRow('Tanggal', 'Deskripsi', 'Kategori', 'Tipe', 'Jumlah', true);
          doc.moveTo(30, y - 5).lineTo(565, y - 5).stroke();
        }

        const date = new Date(tx.date_created).toLocaleDateString('id-ID');
        const desc = tx.description || '-';
        const cat = tx.category?.name || '-';
        const type = tx.type;
        const amount = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(tx.amount));

        drawRow(date, desc, cat, type, amount);
      });

      doc.end();
    });
  }
}

