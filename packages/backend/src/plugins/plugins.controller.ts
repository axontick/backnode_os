import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { PluginsService } from './plugins.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../auth/current-user.decorator';

@Controller('plugins')
@UseGuards(JwtAuthGuard)
export class PluginsController {
  constructor(
    @Inject(PluginsService)
    private readonly pluginsService: PluginsService,
  ) {}

  @Get()
  async getPlugins(@CurrentUser() user: CurrentUserPayload) {
    return this.pluginsService.getPlugins(user.accountId);
  }

  @Post(':id/toggle')
  async togglePlugin(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('enabled') enabled?: boolean,
  ) {
    return this.pluginsService.togglePlugin(user.accountId, id, enabled);
  }
}
