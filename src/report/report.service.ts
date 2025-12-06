import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from '../transaction/entities/transaction.entity';
import { Account } from '../account/entities/account.entity';
import { UserPayload } from '../auth/interfaces/user-payload.interface';
import { TransactionType } from '../transaction/enums/transaction-type.enum';

@Injectable()
export class ReportService {
    constructor(
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        @InjectRepository(Account)
        private readonly accountRepository: Repository<Account>,
        private readonly dataSource: DataSource,
    ) { }

    async getDashboardSummary(user: UserPayload) {
        // 1. Total Balance (Sum of all accounts)
        const accounts = await this.accountRepository.find({ where: { user_id: user.id } });
        const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.balance), 0);

        // 2. Total Income & Expense (This Month)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        lastDay.setHours(23, 59, 59, 999);

        const transactions = await this.transactionRepository.createQueryBuilder('transaction')
            .where('transaction.user_id = :userId', { userId: user.id })
            .andWhere('transaction.date_created BETWEEN :start AND :end', { start: firstDay, end: lastDay })
            .getMany();

        const totalIncome = transactions
            .filter(t => t.type === TransactionType.INCOME)
            .reduce((acc, curr) => acc + Number(curr.amount), 0);

        const totalExpense = transactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .reduce((acc, curr) => acc + Number(curr.amount), 0);

        // 3. Recent Transactions (Last 5)
        const recentTransactions = await this.transactionRepository.find({
            where: { user_id: user.id },
            order: { date_created: 'DESC' },
            take: 5,
            relations: ['category', 'account'],
        });

        return {
            totalBalance,
            totalIncome,
            totalExpense,
            recentTransactions,
        };
    }

    async getSpendingByCategory(user: UserPayload) {
        const rawData = await this.transactionRepository.createQueryBuilder('transaction')
            .leftJoinAndSelect('transaction.category', 'category')
            .select('category.name', 'categoryName')
            .addSelect('SUM(transaction.amount)', 'totalAmount')
            .where('transaction.user_id = :userId', { userId: user.id })
            .andWhere('transaction.type = :type', { type: TransactionType.EXPENSE })
            .groupBy('category.name')
            .getRawMany();

        return rawData.map(item => ({
            name: item.categoryName || 'Uncategorized',
            value: Number(item.totalAmount),
        }));
    }
}
