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
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(@Inject(RolesService) private readonly rolesService: RolesService) {}

  @Get()
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.rolesService.findAll(user.accountId);
  }

  @Get('effective-permissions')
  async getEffectivePermissions(@CurrentUser() user: CurrentUserPayload) {
    return this.rolesService.getEffectivePermissions(user.accountId, user);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.rolesService.findOne(user.accountId, id);
  }

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() createRoleDto: any,
  ) {
    return this.rolesService.create(user.accountId, createRoleDto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() updateRoleDto: any,
  ) {
    return this.rolesService.update(user.accountId, id, updateRoleDto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.rolesService.delete(user.accountId, id);
  }

  @Post(':id/duplicate')
  async duplicate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.rolesService.duplicate(user.accountId, id);
  }
}
