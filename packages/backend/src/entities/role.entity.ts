import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { RolePermissions } from '@backnode/shared';

@Entity('roles')
export class Role {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { nullable: true })
  key?: string;

  @Column('varchar', { default: '' })
  description: string;

  @Column('varchar', { default: '#ea580c' })
  color: string;

  @Column('varchar', { default: 'shield_person' })
  icon: string;

  @Column('boolean', { name: 'is_system', default: false })
  isSystem: boolean;

  @Column('boolean', { name: 'is_default', default: false })
  isDefault: boolean;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { name: 'permissions' })
  permissions: any;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
