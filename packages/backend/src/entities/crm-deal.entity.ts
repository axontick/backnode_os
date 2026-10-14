import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CrmPipeline } from './crm-pipeline.entity';

@Entity('crm_deals')
export class CrmDeal {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  title: string;

  @Column('varchar')
  company: string;

  @Column('float')
  value: number;

  @Column('varchar', { name: 'formatted_value' })
  formattedValue: string;

  @Column('varchar')
  stage: string;

  @Column('int', { default: 0 })
  probability: number;

  @Column('varchar', { name: 'target_close_date' })
  targetCloseDate: string;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any))
  contact: any;

  @Column('varchar')
  owner: string;

  @Column('varchar', { name: 'owner_initials' })
  ownerInitials: string;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column('varchar', { name: 'next_step', nullable: true })
  nextStep?: string;

  @Column('varchar', { nullable: true })
  competitor?: string;

  @Column('varchar', { name: 'loss_reason', nullable: true })
  lossReason?: string;

  @Column('varchar', { name: 'won_reason', nullable: true })
  wonReason?: string;

  @Column('int', { name: 'cycle_days', nullable: true, default: 0 })
  cycleDays?: number;

  @Column('varchar', { name: 'closed_at', nullable: true })
  closedAt?: string;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { name: 'linked_tasks', default: [] })
  linkedTasks: any;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { name: 'custom_links', default: {} })
  customLinks: any;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { default: [] })
  history: any;

  @Column('boolean', { name: 'is_archived', default: false })
  isArchived: boolean;

  @Index()
  @Column('varchar', { name: 'pipeline_id', nullable: true })
  pipelineId?: string;

  @Index()
  @Column('varchar', { name: 'sub_folder_id', nullable: true })
  subFolderId?: string;

  @ManyToOne(() => CrmPipeline, (pipeline) => pipeline.deals, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pipeline_id' })
  pipeline?: CrmPipeline;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
