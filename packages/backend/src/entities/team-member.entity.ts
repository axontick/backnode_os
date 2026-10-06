import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('team_members')
export class TeamMember {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar')
  initials: string;

  @Column('varchar')
  role: string;

  @Column('varchar')
  department: string;

  @Column('int', { name: 'active_tasks', default: 0 })
  activeTasks: number;

  @Column('varchar', { name: 'capacity_status', default: 'Available' })
  capacityStatus: string;

  @Column('varchar', { name: 'avatar_bg', nullable: true })
  avatarBg?: string;

  @Column('varchar', { name: 'avatar_color', nullable: true })
  avatarColor?: string;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
