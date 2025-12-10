import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { Account } from '../../account/entities/account.entity';
import { Transaction } from '../../transaction/entities/transaction.entity';
import { Category } from '../../category/entities/category.entity';

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  full_name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'text' })
  password: string;

  @Column({ default: false })
  is_active: boolean;

  @Column({ type: 'varchar', nullable: true })
  activation_token: string | null;

  @Column({ type: 'varchar', nullable: true })
  refresh_token: string | null;

  @Column({ type: 'varchar', nullable: true })
  new_email: string | null;

  @Column({ type: 'varchar', nullable: true })
  email_verification_token: string | null;

  @OneToMany(() => Account, (account) => account.user)
  accounts: Account[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @CreateDateColumn()
  date_created: Date;

  @UpdateDateColumn()
  date_modified: Date;

  @DeleteDateColumn()
  date_deleted: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
