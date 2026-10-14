import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('crm_stage_definitions')
export class CrmStageDefinition {
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

  @Column('int', { name: 'win_probability', default: 0 })
  winProbability: number;

  @Column('int', { name: 'days_limit', default: 30 })
  daysLimit: number;

  @Column('int', { name: 'active_deals_count', default: 0 })
  activeDealsCount: number;

  @Column('float', { name: 'pipeline_arr', default: 0 })
  pipelineArr: number;

  @Column('boolean', { name: 'is_terminal', nullable: true, default: false })
  isTerminal?: boolean;

  @Column('boolean', { name: 'is_highlighted', nullable: true, default: false })
  isHighlighted?: boolean;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { name: 'required_gates', default: [] })
  requiredGates: any;

  @Column('boolean', { name: 'webhook_enabled', default: false })
  webhookEnabled: boolean;

  @Column('float', { name: 'webhook_threshold', default: 0 })
  webhookThreshold: number;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;
}
