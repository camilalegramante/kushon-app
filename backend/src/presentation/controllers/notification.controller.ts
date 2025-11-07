import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { NotificationService } from '../../application/services/notification.service';

@Controller('user/titles/:titleId/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotificationPreference(
    @Param('titleId') titleId: string,
    @Request() req: any,
  ) {
    try {
      const userId = req.user.id;
      const preference =
        await this.notificationService.getNotificationPreference(
          userId,
          titleId,
        );

      return {
        success: true,
        data: {
          emailOnNewVolume: preference?.emailOnNewVolume || false,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao buscar preferência de notificação: ' + error.message,
      };
    }
  }

  @Put()
  async updateNotificationPreference(
    @Param('titleId') titleId: string,
    @Body() body: { emailOnNewVolume: boolean },
    @Request() req: any,
  ) {
    try {
      const userId = req.user.id;
      await this.notificationService.updateNotificationPreference(
        userId,
        titleId,
        body.emailOnNewVolume,
      );

      return {
        success: true,
        message: body.emailOnNewVolume
          ? 'Notificações por email ativadas!'
          : 'Notificações por email desativadas!',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao atualizar preferência: ' + error.message,
      };
    }
  }
}
