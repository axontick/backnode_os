import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.teamMember.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const member = await this.prisma.teamMember.findUnique({
      where: { id },
      include: { tasks: true },
    });
    if (!member) {
      throw new NotFoundException(`Member ${id} not found`);
    }
    return member;
  }

  async create(data: any) {
    let id = data.id;
    if (!id) {
      const count = await this.prisma.teamMember.count();
      id = `mem-${count + 1}`;
    }

    return this.prisma.teamMember.create({
      data: {
        id,
        name: data.name,
        initials: data.initials || data.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
        role: data.role,
        department: data.department || 'Engineering',
        activeTasks: data.activeTasks || 0,
        capacityStatus: data.capacityStatus || 'Available',
        avatarBg: data.avatarBg || '#e4e1e6',
        avatarColor: data.avatarColor || '#1b1b1e',
      },
    });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.teamMember.update({
      where: { id },
      data,
    });
  }
}
