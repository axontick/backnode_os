import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from './user.entity';

@Entity('accounts')
export class Account {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { unique: true })
  slug: string;

  @Column('varchar', { nullable: true, default: '#ea580c' })
  color?: string;

  @Column('varchar', { nullable: true, default: 'workspaces' })
  icon?: string;

  @Column('varchar', { name: 'owner_email', nullable: true })
  ownerEmail?: string;

  @Column('varchar', { name: 'owner_id', nullable: true })
  ownerId?: string;

  @Column('jsonb', { name: 'enabled_plugins', default: ['tasks', 'crm', 'contacts', 'docs'] })
  enabledPlugins: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.account)
  users: User[];

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }
}
