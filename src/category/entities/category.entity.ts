import {
  Column,
  Entity,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert, // <---
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid'; // <---
// ... imports lain ...
import { User } from '../../user/entities/user.entity';
import { Transaction } from '../../transaction/entities/transaction.entity';
import { TransactionType } from '../../transaction/enums/transaction-type.enum';

@Entity('categories')
export class Category {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ nullable: true })
  icon: string;

  @Column()
  user_id: string;

  @ManyToOne(() => User, (user) => user.categories)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Transaction, (transaction) => transaction.category)
  transactions: Transaction[];

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
