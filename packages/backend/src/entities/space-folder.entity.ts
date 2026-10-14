import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('space_folders')
export class SpaceFolder {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { default: 'folder' })
  icon: string;

  @Column('varchar', { default: '#64748B' })
  color: string;

  @Column('varchar', { nullable: true })
  description?: string;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { default: [] })
  items: any;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { default: [] })
  subFolders?: any;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
