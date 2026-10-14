import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { CrmDeal } from './crm-deal.entity';

@Entity('crm_pipelines')
export class CrmPipeline {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { default: '' })
  description: string;

  @Column('varchar', { nullable: true })
  icon?: string;

  @Column('varchar', { nullable: true })
  color?: string;

  @Column('int', { name: 'deal_count', default: 0 })
  dealCount: number;

  @Column('float', { name: 'total_value', default: 0 })
  totalValue: number;

  @Column(process.env.DB_TYPE === 'sqlite' ? 'simple-json' : ('jsonb' as any), { default: [] })
  subFolders?: any;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;

  @OneToMany(() => CrmDeal, (deal) => deal.pipeline)
  deals: CrmDeal[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
