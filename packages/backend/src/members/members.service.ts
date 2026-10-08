import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeamMember } from '../entities';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(TeamMember)
    private readonly memberRepo: Repository<TeamMember>,
  ) {}

  async findAll(accountId: string) {
    return this.memberRepo.find({
      where: { accountId },
      order: { name: 'ASC' },
    });
  }

  async findOne(accountId: string, id: string) {
    const member = await this.memberRepo.findOne({
      where: { id, accountId },
    });
    if (!member) {
      throw new NotFoundException(`Member ${id} not found in this account`);
    }
    return member;
  }

  async create(accountId: string, data: any) {
    let id = data.id;
    if (!id) {
      const count = await this.memberRepo.count({ where: { accountId } });
      id = `mem-${count + 1}`;
    }

    const member = this.memberRepo.create({
      id,
      name: data.name,
      email: data.email || `${data.name.toLowerCase().replace(/\s+/g, '.')}@backnode.io`,
      initials: data.initials || data.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
      role: data.role || 'Member',
      accessLevel: data.accessLevel || 'MEMBER',
      status: data.status || 'Active',
      department: data.department || 'Engineering',
      activeTasks: data.activeTasks || 0,
      capacityStatus: data.capacityStatus || 'Available',
      avatarBg: data.avatarBg || '#ea580c',
      avatarColor: data.avatarColor || '#ffffff',
      invitedAt: data.invitedAt || new Date().toISOString(),
      accountId,
    });

    return this.memberRepo.save(member);
  }

  async update(accountId: string, id: string, data: any) {
    const member = await this.findOne(accountId, id);
    Object.assign(member, data);
    return this.memberRepo.save(member);
  }

  async delete(accountId: string, id: string) {
    const member = await this.findOne(accountId, id);
    await this.memberRepo.remove(member);
    return { id, success: true };
  }
}
