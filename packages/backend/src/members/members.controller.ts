import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { MembersService } from './members.service';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  async findAll() {
    return this.membersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.membersService.findOne(id);
  }

  @Post()
  async create(@Body() data: any) {
    return this.membersService.create(data);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: any) {
    return this.membersService.update(id, data);
  }
}
