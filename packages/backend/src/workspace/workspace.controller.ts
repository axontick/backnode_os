import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(@Inject(WorkspaceService) private readonly workspaceService: WorkspaceService) {}

  // Workspaces
  @Get('workspaces')
  async getWorkspaces(@CurrentUser() user: CurrentUserPayload) {
    return this.workspaceService.getWorkspaces(user);
  }

  @Post('workspaces')
  async createWorkspace(
    @CurrentUser() user: CurrentUserPayload,
    @Body() data: { name: string; color?: string; icon?: string },
  ) {
    return this.workspaceService.createWorkspace(user, data);
  }

  @Patch('workspaces/:id')
  async updateWorkspace(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() data: { name?: string; color?: string; icon?: string },
  ) {
    return this.workspaceService.updateWorkspace(user, id, data);
  }

  @Delete('workspaces/:id')
  async deleteWorkspace(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.workspaceService.deleteWorkspace(user, id);
  }

  // Space Folders
  @Get('folders')
  async getFolders(@CurrentUser() user: CurrentUserPayload) {
    return this.workspaceService.getFolders(user.accountId);
  }

  @Post('folders')
  async createFolder(
    @CurrentUser() user: CurrentUserPayload,
    @Body() data: any,
  ) {
    return this.workspaceService.createFolder(user.accountId, data);
  }

  @Patch('folders/:id')
  async updateFolder(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.workspaceService.updateFolder(user.accountId, id, data);
  }

  @Delete('folders/:id')
  async deleteFolder(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.workspaceService.deleteFolder(user.accountId, id);
  }

  // Status Definitions
  @Get('statuses')
  async getStatuses(@CurrentUser() user: CurrentUserPayload) {
    return this.workspaceService.getStatuses(user.accountId);
  }

  @Put('statuses')
  async updateStatuses(
    @CurrentUser() user: CurrentUserPayload,
    @Body() statuses: any[],
  ) {
    return this.workspaceService.updateStatuses(user.accountId, statuses);
  }

  // List Settings
  @Get('settings/list')
  async getListSettings(@CurrentUser() user: CurrentUserPayload) {
    return this.workspaceService.getListSettings(user.accountId);
  }

  @Put('settings/list')
  async updateListSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() data: any,
  ) {
    return this.workspaceService.updateListSettings(user.accountId, data);
  }

  // Departments
  @Get('departments')
  async getDepartments(@CurrentUser() user: CurrentUserPayload) {
    return this.workspaceService.getDepartments(user.accountId);
  }

  @Post('departments')
  async createDepartment(
    @CurrentUser() user: CurrentUserPayload,
    @Body() data: any,
  ) {
    return this.workspaceService.createDepartment(user.accountId, data);
  }

  @Patch('departments/:id')
  async updateDepartment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.workspaceService.updateDepartment(user.accountId, id, data);
  }

  @Delete('departments/:id')
  async deleteDepartment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { reassignToDeptName?: string },
  ) {
    return this.workspaceService.deleteDepartment(user.accountId, id, body?.reassignToDeptName);
  }
}
