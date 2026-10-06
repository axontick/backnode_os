import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('status_definitions')
export class StatusDefinition {
  @PrimaryColumn('varchar')
  id: string;

  @Column('int')
  order: number;

  @Column('varchar')
  name: string;

  @Column('varchar', { default: '' })
  description: string;

  @Column('varchar')
  color: string;

  @Column('varchar', { name: 'stage_mapping', default: '' })
  stageMapping: string;

  @Column('int', { name: 'active_volume', default: 0 })
  activeVolume: number;

  @Column('boolean', { name: 'is_default', default: false })
  isDefault: boolean;

  @Column('boolean', { name: 'is_closed', default: false })
  isClosed: boolean;

  @Column('int', { name: 'wip_limit', nullable: true })
  wipLimit?: number;

  @Column('boolean', { name: 'require_pr_review', nullable: true, default: false })
  requirePrReview?: boolean;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;
}
