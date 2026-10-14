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
import { TeamMember } from './team-member.entity';

@Entity('task_items')
export class TaskItem {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  title: string;

  @Column('text', { default: '' })
  description: string;

  @Column('text', { name: 'spec_markdown', default: '' })
  specMarkdown: string;

  @Column('varchar', { default: 'Backlog' })
  status: string;

  @Column('varchar', { default: 'Medium' })
  priority: string;

  @Column('varchar', { name: 'assignee_id', nullable: true })
  assigneeId?: string;

  @ManyToOne(() => TeamMember, { nullable: true, onDelete: 'SET NULL', eager: true })
  @JoinColumn({ name: 'assignee_id' })
  assignee?: TeamMember;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { default: [] })
  subtasks: any;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { nullable: true })
  estimation?: any;

  @Column('varchar', { name: 'list_id', nullable: true })
  list_id?: string;

  @Column('varchar', { name: 'due_date', nullable: true })
  dueDate?: string;

  @Column('boolean', { name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column('varchar', { name: 'recurrence_rule', nullable: true })
  recurrenceRule?: string;

  @Column('varchar', { name: 'git_branch', nullable: true })
  gitBranch?: string;

  @Column('varchar', { name: 'replication_hash', nullable: true })
  replicationHash?: string;

  @Column('varchar', { name: 'time_in_stage', nullable: true })
  timeInStage?: string;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { name: 'linked_crm_deal', nullable: true })
  linkedCrmDeal?: any;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { name: 'custom_links', default: {} })
  customLinks: any;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { default: [] })
  activity: any;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
