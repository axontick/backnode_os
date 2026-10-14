import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

@Entity('crm_pipeline_settings')
export class CrmPipelineSettings {
  @PrimaryColumn('varchar')
  id: string;

  @Index()
  @Column('varchar', { default: 'PIPE-ENT' })
  code: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { default: '' })
  description: string;

  @Column('varchar', { name: 'accent_color', default: '#ea580c' })
  accentColor: string;

  @Column('varchar', { default: 'leaderboard' })
  icon: string;

  @Column('varchar', { default: 'USD' })
  currency: string;

  @Column('varchar', { name: 'format_notation', default: 'Compact' })
  formatNotation: string;

  @Column('int', { name: 'default_close_cycle_days', default: 60 })
  defaultCloseCycleDays: number;

  @Column('varchar', { name: 'win_probability_algorithm', default: 'Standard Stage Weighting' })
  winProbabilityAlgorithm: string;

  @Column('float', { name: 'target_quarterly_revenue', default: 500000 })
  targetQuarterlyRevenue: number;

  @Column('float', { name: 'min_deal_value_gate', default: 10000 })
  minDealValueGate: number;

  @Column('varchar', { name: 'default_view', default: 'Kanban Board' })
  defaultView: string;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any))
  cardProps: any;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any))
  governance: any;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;
}
