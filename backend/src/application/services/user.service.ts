import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../infra/database/prisma.service';
import { UpdateVolumeProgressDto } from '../dtos/user/update-volume-progress.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async updateUserVolumeProgress(
    userId: string,
    titleId: string,
    updateData: UpdateVolumeProgressDto,
  ) {
    const title = await this.prisma.title.findUnique({
      where: { id: titleId },
      include: { volumes: true },
    });

    if (!title) {
      throw new NotFoundException('Título não encontrado');
    }

    const titleVolumeIds = new Set(title.volumes.map((v) => v.id));
    const invalidVolumeIds = updateData.volumes.filter(
      (v) => !titleVolumeIds.has(v.volumeId),
    );

    if (invalidVolumeIds.length > 0) {
      throw new BadRequestException(
        'Alguns volumes não pertencem a este título',
      );
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const updates = [];

      for (const volumeData of updateData.volumes) {
        const update = prisma.userVolume.upsert({
          where: {
            userId_volumeId: {
              userId: userId,
              volumeId: volumeData.volumeId,
            },
          },
          update: {
            owned: volumeData.owned,
            updatedAt: new Date(),
          },
          create: {
            userId: userId,
            volumeId: volumeData.volumeId,
            owned: volumeData.owned,
            notified: false,
          },
        });

        updates.push(update);
      }

      return Promise.all(updates);
    });

    return {
      success: true,
      message: 'Progresso atualizado com sucesso',
      data: result,
    };
  }

  async getUserVolumeProgress(userId: string, titleId: string) {
    const title = await this.prisma.title.findUnique({
      where: { id: titleId },
      include: {
        volumes: {
          orderBy: { number: 'asc' },
        },
      },
    });

    if (!title) {
      throw new NotFoundException('Título não encontrado');
    }

    const userVolumes = await this.prisma.userVolume.findMany({
      where: {
        userId: userId,
        volumeId: {
          in: title.volumes.map((v) => v.id),
        },
      },
      include: {
        volume: true,
      },
    });

    const progressMap = new Map();
    userVolumes.forEach((uv) => {
      progressMap.set(uv.volumeId, {
        volumeId: uv.volumeId,
        owned: uv.owned,
        notified: uv.notified,
        volumeNumber: uv.volume.number,
        volumeTitle: uv.volume.title,
      });
    });

    const progress = title.volumes.map((volume) => {
      const userProgress = progressMap.get(volume.id);
      return {
        volumeId: volume.id,
        volumeNumber: volume.number,
        volumeTitle: volume.title,
        owned: userProgress?.owned || false,
        notified: userProgress?.notified || false,
      };
    });

    return {
      success: true,
      data: progress,
    };
  }
}
