import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('doc_items')
export class DocItem {
  @PrimaryColumn('varchar')
  id: string;

  @Column('varchar')
  title: string;

  @Column('text', { default: '' })
  content: string;

  @Column('varchar', { default: 'Internal' })
  classification: string;

  @Index()
  @Column('varchar', { name: 'folder_id', nullable: true })
  folderId?: string;

  @Index()
  @Column('varchar', { name: 'sub_folder_id', nullable: true })
  subFolderId?: string;

  @Index()
  @Column('varchar', { name: 'list_id', nullable: true })
  listId?: string;

  @Column('text', { array: true, default: '{}' })
  tags: string[];

  @Column('varchar', { name: 'author_name', default: 'Operator' })
  authorName: string;

  @Column('varchar', { name: 'author_initials', default: 'OP' })
  authorInitials: string;

  @Column('varchar', { name: 'author_department', nullable: true })
  authorDepartment?: string;

  @Column('jsonb', { name: 'custom_links', default: {} })
  customLinks: any;

  @Index()
  @Column('varchar', { name: 'account_id', nullable: true })
  accountId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
