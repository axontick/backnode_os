import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { Account } from './account.entity';
import { RefreshToken } from './refresh-token.entity';
import { PasswordResetToken } from './password-reset-token.entity';

@Entity('users')
export class User {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar', { unique: true })
  email: string;

  @Column('varchar', { name: 'password_hash' })
  passwordHash: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { default: 'OWNER' })
  role: string;

  @Column('varchar', { name: 'account_id' })
  accountId: string;

  @ManyToOne(() => Account, (account) => account.users, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @OneToMany(() => PasswordResetToken, (token) => token.user)
  passwordResetTokens: PasswordResetToken[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
