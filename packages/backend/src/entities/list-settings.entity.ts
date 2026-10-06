import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('list_settings')
export class ListSettings {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Index()
  @Column('varchar', { name: 'list_id' })
  listId: string;

  @Column('varchar', { default: '' })
  description: string;

  @Column('varchar', { default: '#9900c2' })
  color: string;

  @Column('varchar', { default: 'folder' })
  icon: string;

  @Column('varchar', { name: 'default_view', default: 'Board' })
  defaultView: string;

  @Column('varchar', { name: 'default_priority', default: 'P2 - Medium (Normal)' })
  defaultPriority: string;

  @Column('varchar', { name: 'estimation_unit', default: 'Story Points' })
  estimationUnit: string;

  @Column('boolean', { name: 'distributed_write_logging', default: false })
  distributedWriteLogging: boolean;

  @Column('varchar', { name: 'auto_archive_days', default: '14' })
  autoArchiveDays: string;

  @Column('boolean', { name: 'strict_forward_progress', default: false })
  strictForwardProgress: boolean;

  @Column('boolean', { name: 'auto_archive_done', default: false })
  autoArchiveDone: boolean;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;
}
