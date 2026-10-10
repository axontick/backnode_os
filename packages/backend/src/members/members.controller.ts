import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(@Inject(MembersService) private readonly membersService: MembersService) {}

  @Get()
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.membersService.findAll(user.accountId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.membersService.findOne(user.accountId, id);
  }

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() data: any,
  ) {
    return this.membersService.create(user.accountId, data);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.membersService.update(user.accountId, id, data);
  }

  @Patch(':id/password')
  async changePassword(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('password') password?: string,
    @Body('newPassword') newPassword?: string,
  ) {
    return this.membersService.changePassword(user.accountId, id, password || newPassword || '');
  }

  @Patch(':id/toggle-login')
  async toggleLogin(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('canLogin') canLogin?: boolean,
  ) {
    return this.membersService.toggleLogin(user.accountId, id, canLogin);
  }

  @Delete(':id')
  async delete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.membersService.delete(user.accountId, id);
  }
}
