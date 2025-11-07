import { Module } from '@nestjs/common';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationService } from '../../application/services/notification.service';
import { EmailService } from '../../application/services/email.service';
import { PrismaService } from '../../infra/database/prisma.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, EmailService, PrismaService],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {}
