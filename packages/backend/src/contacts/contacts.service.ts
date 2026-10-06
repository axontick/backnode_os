import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.directoryContact.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const contact = await this.prisma.directoryContact.findUnique({
      where: { id },
    });
    if (!contact) {
      throw new NotFoundException(`Contact ${id} not found`);
    }
    return contact;
  }

  async create(data: any) {
    let id = data.id;
    if (!id) {
      const count = await this.prisma.directoryContact.count();
      id = `contact-${count + 1}`;
    }

    return this.prisma.directoryContact.create({
      data: {
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
      },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.directoryContact.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.directoryContact.delete({
      where: { id },
    });
  }
}
