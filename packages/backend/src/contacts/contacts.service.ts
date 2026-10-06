import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DirectoryContact } from '../entities';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(DirectoryContact)
    private readonly contactRepo: Repository<DirectoryContact>,
  ) {}

  async findAll(accountId: string) {
    return this.contactRepo.find({
      where: { accountId },
      order: { name: 'ASC' },
    });
  }

  async findOne(accountId: string, id: string) {
    const contact = await this.contactRepo.findOne({
      where: { id, accountId },
    });
    if (!contact) {
      throw new NotFoundException(`Contact ${id} not found in this account`);
    }
    return contact;
  }

  async create(accountId: string, data: any) {
    let id = data.id;
    if (!id) {
      const count = await this.contactRepo.count({ where: { accountId } });
      id = `contact-${count + 1}`;
    }

    const contact = this.contactRepo.create({
      id,
      name: data.name,
      initials: data.initials || data.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
      role: data.role || 'Stakeholder',
      tag: data.tag || 'Prospect',
      tagColor: data.tagColor || 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      company: data.company || 'Enterprise Corp',
      companyColor: data.companyColor || '#64748b',
      arr: data.arr || '$0',
      email: data.email || '',
      phone: data.phone || '',
      dealName: data.dealName || '',
      deliverablesCount: data.deliverablesCount || 0,
      lastActivity: data.lastActivity || 'Created profile',
      lastActivityTime: data.lastActivityTime || 'Just now',
      healthScore: data.healthScore || 100,
      healthCategory: data.healthCategory || 'Healthy',
      accountDescription: data.accountDescription || '',
      renewalDate: data.renewalDate || '',
      storageKey: data.storageKey || 'dir_contact_' + Math.random().toString(16).substring(2, 6),
      replicationHash: data.replicationHash || '0x' + Math.random().toString(16).substring(2, 8),
      accountId,
    });

    return this.contactRepo.save(contact);
  }

  async update(accountId: string, id: string, data: any) {
    const contact = await this.findOne(accountId, id);
    Object.assign(contact, data);
    return this.contactRepo.save(contact);
  }

  async remove(accountId: string, id: string) {
    const contact = await this.findOne(accountId, id);
    await this.contactRepo.remove(contact);
    return { id };
  }
}
