import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('doc_folders')
export class DocFolder {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  name: string;

  @Column('varchar', { default: 'folder' })
  icon: string;

  @Column('varchar', { default: '#ea580c' })
  color: string;

  @Column('varchar', { name: 'parent_id', nullable: true })
  parentId?: string;

  @Column('varchar', { default: '' })
  description: string;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
