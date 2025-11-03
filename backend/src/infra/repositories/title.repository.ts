import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Title, Volume } from '../../domain/entities/title.entity';
import { CreateTitleDto } from '../../application/dtos/create-title.dto';
import { UpdateTitleDto } from '../../application/dtos/update-title.dto';
import { NotificationService } from '../../application/services/notification.service';

@Injectable()
export class TitleRepository {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService
  ) {}

  async create(createTitleDto: CreateTitleDto): Promise<Title> {
    const slug = this.generateSlug(createTitleDto.name);
    
    const createdTitle = await this.prisma.title.create({
      data: {
        name: createTitleDto.name,
        synopsis: createTitleDto.synopsis,
        author: createTitleDto.author,
        genre: createTitleDto.genre,
        slug,
        coverImage: createTitleDto.coverImage,
        publisherId: createTitleDto.publisherId,
        volumes: {
          create: createTitleDto.volumes.map(volume => ({
            number: volume.number,
            title: volume.title,
            coverImage: volume.coverImage,
          }))
        }
      },
      include: {
        volumes: true
      }
    });

    return new Title(
      createdTitle.id,
      createdTitle.name,
      createdTitle.slug,
      createdTitle.publisherId,
      createdTitle.status as any,
      createdTitle.synopsis,
      createdTitle.author,
      createdTitle.genre,
      createdTitle.coverImage,
      createdTitle.createdAt,
      createdTitle.updatedAt
    );
  }

  async findAll(): Promise<Title[]> {
    const titles = await this.prisma.title.findMany({
      include: {
        volumes: {
          orderBy: { number: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return titles.map(title => new Title(
      title.id,
      title.name,
      title.slug,
      title.publisherId,
      title.status as any,
      title.synopsis,
      title.author,
      title.genre,
      title.coverImage,
      title.createdAt,
      title.updatedAt
    ));
  }

  async findById(id: string): Promise<Title | null> {
    const title = await this.prisma.title.findUnique({
      where: { id },
      include: {
        volumes: {
          orderBy: { number: 'asc' }
        }
      }
    });

    if (!title) return null;

    return new Title(
      title.id,
      title.name,
      title.slug,
      title.publisherId,
      title.status as any,
      title.synopsis,
      title.author,
      title.genre,
      title.coverImage,
      title.createdAt,
      title.updatedAt
    );
  }

  async findVolumes(titleId: string): Promise<Volume[]> {
    const volumes = await this.prisma.volume.findMany({
      where: { titleId },
      orderBy: { number: 'asc' }
    });

    return volumes.map(volume => new Volume(
      volume.id,
      volume.number,
      volume.titleId,
      volume.title,
      volume.coverImage,
      volume.releaseAt,
      volume.createdAt,
      volume.updatedAt
    ));
  }

  async update(id: string, updateTitleDto: UpdateTitleDto): Promise<Title | null> {
    const existingTitle = await this.prisma.title.findUnique({ where: { id } });
    if (!existingTitle) return null;

    const slug = updateTitleDto.name ? this.generateSlug(updateTitleDto.name) : existingTitle.slug;

    const updatedTitle = await this.prisma.title.update({
      where: { id },
      data: {
        name: updateTitleDto.name ?? existingTitle.name,
        synopsis: updateTitleDto.synopsis ?? existingTitle.synopsis,
        author: updateTitleDto.author ?? existingTitle.author,
        genre: updateTitleDto.genre ?? existingTitle.genre,
        status: updateTitleDto.status ?? existingTitle.status,
        slug,
        coverImage: updateTitleDto.coverImage ?? existingTitle.coverImage,
        publisherId: updateTitleDto.publisherId ?? existingTitle.publisherId,
      },
      include: {
        volumes: {
          orderBy: { number: 'asc' }
        }
      }
    });

    if (updateTitleDto.volumes && Array.isArray(updateTitleDto.volumes)) {
      for (const vol of updateTitleDto.volumes) {
        const existingVolume = await this.prisma.volume.findFirst({
          where: { titleId: id, number: vol.number }
        });
        if (!existingVolume) {
          const newVolume = await this.prisma.volume.create({
            data: {
              number: vol.number,
              title: vol.title,
              coverImage: vol.coverImage,
              titleId: id
            }
          });

          try {
            await this.notificationService.notifyUsersOnNewVolume(id, vol.number);
            console.log(`Notificações enviadas para volume ${vol.number} do título ${id}`);
          } catch (error) {
            console.error(`Erro ao enviar notificações para volume ${vol.number}:`, error);
          }
        } else if (vol.coverImage) {
          await this.prisma.volume.update({
            where: { id: existingVolume.id },
            data: { coverImage: vol.coverImage }
          });
        }
      }
    }

    return new Title(
      updatedTitle.id,
      updatedTitle.name,
      updatedTitle.slug,
      updatedTitle.publisherId,
      updatedTitle.status as any,
      updatedTitle.synopsis,
      updatedTitle.author,
      updatedTitle.genre,
      updatedTitle.coverImage,
      updatedTitle.createdAt,
      updatedTitle.updatedAt
    );
  }

  async updateMainCover(titleId: string, coverImage: string): Promise<void> {
    console.log(`Updating main cover - Title ID: ${titleId}, Cover: ${coverImage}`);

    try {
      await this.prisma.title.update({
        where: { id: titleId },
        data: { coverImage: coverImage }
      });
      console.log(`Main cover updated successfully`);
    } catch (error) {
      console.error(`Error updating main cover:`, error);
      throw error;
    }
  }

  async updateVolumeCover(volumeNumber: number, titleId: string, coverImage: string): Promise<void> {
    console.log(`Updating volume cover - Volume: ${volumeNumber}, Title ID: ${titleId}, Cover: ${coverImage}`);

    try {
      const existingVolume = await this.prisma.volume.findFirst({
        where: {
          titleId: titleId,
          number: volumeNumber
        }
      });

      console.log(`Existing volume found:`, existingVolume);

      if (!existingVolume) {
        console.log(`Volume ${volumeNumber} not found for title ${titleId} - skipping update`);
        return;
      }

      const result = await this.prisma.volume.update({
        where: {
          id: existingVolume.id
        },
        data: {
          coverImage: coverImage
        }
      });

      console.log(`Update result:`, result);
    } catch (error) {
      console.error(`Error updating volume cover:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.volume.deleteMany({
        where: { titleId: id }
      });

      await this.prisma.title.delete({
        where: { id }
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
}