import {
  Entity,
  PrimaryColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { randomUUID } from 'crypto';

@Entity('departments')
export class Department {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { default: '' })
  code: string;

  @Column('varchar', { default: '' })
  description: string;

  @Column('varchar', { default: '#ea580c' })
  color: string;

  @Column('varchar', { default: 'domain' })
  icon: string;

  @Column('varchar', { name: 'head_member_id', nullable: true })
  headMemberId?: string;

  @Column('boolean', { name: 'is_default', default: false })
  isDefault: boolean;

  @Column('int', { default: 0 })
  order: number;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = `dept-${randomUUID().slice(0, 8)}`;
    }
  }
}
