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

  @Column('varchar', { nullable: true })
  email?: string;

  @Column('varchar', { name: 'access_level', default: 'MEMBER' })
  accessLevel?: string;

  @Column('varchar', { default: 'Active' })
  status?: string;

  @Column('boolean', { name: 'can_login', default: true })
  canLogin: boolean;

  @Column('jsonb', {
    name: 'allowed_pages',
    default: ['overview', 'task-spaces', 'crm-pipelines', 'contacts', 'docs', 'team', 'settings'],
  })
  allowedPages: string[];

  @Column('jsonb', {
    name: 'allowed_actions',
    default: ['read', 'write', 'delete', 'publish'],
  })
  allowedActions: string[];

  @Column('varchar', { name: 'role_id', nullable: true })
  roleId?: string;

  @Column('jsonb', { name: 'permission_overrides', nullable: true })
  permissionOverrides?: any;

  @Column('varchar', { name: 'invited_at', nullable: true })
  invitedAt?: string;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
