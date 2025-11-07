import { Module } from '@nestjs/common';
import { PublisherController } from '../controllers/publisher.controller';
import { PublisherRepository } from '../../infra/repositories/publisher.repository';
import { PrismaService } from '../../infra/database/prisma.service';

@Module({
  controllers: [PublisherController],
  providers: [PublisherRepository, PrismaService],
  exports: [PublisherRepository],
})
export class PublisherModule {}
