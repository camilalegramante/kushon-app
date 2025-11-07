import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PublisherRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; country?: string }) {
    return await this.prisma.publisher.create({
      data,
    });
  }

  async findAll() {
    return await this.prisma.publisher.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    return await this.prisma.publisher.findUnique({
      where: { id },
      include: {
        titles: {
          include: {
            volumes: true,
          },
        },
      },
    });
  }
}
