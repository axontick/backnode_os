import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('directory_contacts')
export class DirectoryContact {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar')
  initials: string;

  @Column('varchar')
  role: string;

  @Column('varchar')
  tag: string;

  @Column('varchar', { name: 'tag_color' })
  tagColor: string;

  @Column('varchar')
  company: string;

  @Column('varchar', { name: 'company_color' })
  companyColor: string;

  @Column('varchar')
  arr: string;

  @Column('varchar')
  email: string;

  @Column('varchar')
  phone: string;

  @Column('varchar', { name: 'deal_name' })
  dealName: string;

  @Column('int', { name: 'deliverables_count', default: 0 })
  deliverablesCount: number;

  @Column('varchar', { name: 'last_activity' })
  lastActivity: string;

  @Column('varchar', { name: 'last_activity_time' })
  lastActivityTime: string;

  @Column('int', { name: 'health_score', default: 100 })
  healthScore: number;

  @Column('varchar', { name: 'health_category', default: 'Healthy' })
  healthCategory: string;

  @Column('text', { name: 'account_description', default: '' })
  accountDescription: string;

  @Column('varchar', { name: 'renewal_date' })
  renewalDate: string;

  @Column('varchar', { name: 'storage_key' })
  storageKey: string;

  @Column('varchar', { name: 'replication_hash' })
  replicationHash: string;

  @Column('jsonb', { name: 'custom_links', default: {} })
  customLinks: any;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
