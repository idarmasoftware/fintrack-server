import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  BeforeInsert, // <--- Jangan lupa import
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid'; // <--- Jangan lupa import
import { User } from '../../user/entities/user.entity';
import { Transaction } from '../../transaction/entities/transaction.entity';

@Entity('accounts')
export class Account {
  @PrimaryColumn('uuid')
  id: string;

  // ... (relasi dan kolom lain) ...
  @Column()
  name: string;

  @Column({ type: 'bigint', default: 0 })
  balance: number;

  @Column()
  user_id: string;

  @ManyToOne(() => User, (user) => user.accounts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.account)
  transactions: Transaction[];

  @CreateDateColumn()
  date_created: Date;

  @UpdateDateColumn()
  date_modified: Date;

  @DeleteDateColumn()
  date_deleted: Date;

  // Logic Generate UUID v7
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
