import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { DocsService } from './docs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('docs')
@UseGuards(JwtAuthGuard)
export class DocsController {
  constructor(@Inject(DocsService) private readonly docsService: DocsService) {}

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('listId') listId?: string,
    @Query('folderId') folderId?: string,
  ) {
    return this.docsService.findAll(user.accountId, { listId, folderId }, user);
  }

  @Get('folders')
  async findFolders(@CurrentUser() user: CurrentUserPayload) {
    return this.docsService.findFolders(user.accountId);
  }

  @Post('folders')
  async createFolder(
    @CurrentUser() user: CurrentUserPayload,
    @Body() data: any,
  ) {
    return this.docsService.createFolder(user.accountId, data);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.docsService.findOne(user.accountId, id, user);
  }

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() data: any,
  ) {
    return this.docsService.create(user.accountId, data, user);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.docsService.update(user.accountId, id, data, user);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.docsService.remove(user.accountId, id, user);
  }
}
