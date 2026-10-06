import { Controller, Get, Post, Put, Patch, Delete, Body, Param } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';

@Controller()
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  // Space Folders
  @Get('folders')
  async getFolders() {
    return this.workspaceService.getFolders();
  }

  @Post('folders')
  async createFolder(@Body() data: any) {
    return this.workspaceService.createFolder(data);
  }

  @Patch('folders/:id')
  async updateFolder(@Param('id') id: string, @Body() data: any) {
    return this.workspaceService.updateFolder(id, data);
  }

  @Delete('folders/:id')
  async deleteFolder(@Param('id') id: string) {
    return this.workspaceService.deleteFolder(id);
  }

  // Status Definitions
  @Get('statuses')
  async getStatuses() {
    return this.workspaceService.getStatuses();
  }

  @Put('statuses')
  async updateStatuses(@Body() statuses: any[]) {
    return this.workspaceService.updateStatuses(statuses);
  }

  // List Settings
  @Get('settings/list')
  async getListSettings() {
    return this.workspaceService.getListSettings();
  }

  @Put('settings/list')
  async updateListSettings(@Body() data: any) {
    return this.workspaceService.updateListSettings(data);
  }
}
