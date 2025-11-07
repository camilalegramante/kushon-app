import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { EmailService } from './email.service';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async getNotificationPreference(userId: string, titleId: string) {
    return await this.prisma.notificationPreference.findUnique({
      where: {
        userId_titleId: {
          userId,
          titleId,
        },
      },
    });
  }

  async updateNotificationPreference(
    userId: string,
    titleId: string,
    emailOnNewVolume: boolean,
  ) {
    return await this.prisma.notificationPreference.upsert({
      where: {
        userId_titleId: {
          userId,
          titleId,
        },
      },
      update: {
        emailOnNewVolume,
      },
      create: {
        userId,
        titleId,
        emailOnNewVolume,
      },
    });
  }

  async notifyUsersOnNewVolume(titleId: string, volumeNumber: number) {
    const preferences = await this.prisma.notificationPreference.findMany({
      where: {
        titleId,
        emailOnNewVolume: true,
      },
      include: {
        user: true,
        title: true,
      },
    });

    for (const preference of preferences) {
      try {
        await this.emailService.sendNewVolumeNotification(
          preference.user.email,
          preference.user.name,
          preference.title.name,
          volumeNumber,
        );

        console.log(
          `Email enviado para ${preference.user.email} sobre volume ${volumeNumber} de ${preference.title.name}`,
        );
      } catch (error) {
        console.error(
          `Erro ao enviar email para ${preference.user.email}:`,
          error,
        );
      }
    }
  }
}
