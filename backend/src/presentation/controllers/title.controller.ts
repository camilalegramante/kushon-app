import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { TitleRepository } from '../../infra/repositories/title.repository';
import { UploadService } from '../../infra/services/upload.service';
import { CreateTitleDto } from '../../application/dtos/create-title.dto';
import { UpdateTitleDto } from '../../application/dtos/update-title.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminAuthGuard } from '../guards/admin-auth.guard';

@Controller('titles')
export class TitleController {
  constructor(
    private readonly titleRepository: TitleRepository,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async create(
    @Body('data') data: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    try {
      const createTitleDto: CreateTitleDto = JSON.parse(data);

      if (files && files.length > 0) {
        const uploadedUrls = await this.uploadService.uploadMultipleImages(
          files,
          'kushon/titles',
        );

        const mainCover = files.find((file) => file.fieldname === 'mainCover');
        if (mainCover) {
          createTitleDto.coverImage = uploadedUrls.get('mainCover');
        }

        for (const volume of createTitleDto.volumes) {
          const volumeFile = files.find(
            (file) => file.fieldname === `volume_${volume.number}`,
          );
          if (volumeFile) {
            volume.coverImage = uploadedUrls.get(`volume_${volume.number}`);
          }
        }
      }

      const title = await this.titleRepository.create(createTitleDto);
      return {
        success: true,
        data: title,
        message: 'Título criado com sucesso',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao criar título: ' + error.message,
      };
    }
  }

  @Get()
  async findAll() {
    const titles = await this.titleRepository.findAll();
    return {
      success: true,
      data: titles,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const title = await this.titleRepository.findById(id);
    if (!title) {
      return {
        success: false,
        message: 'Título não encontrado',
      };
    }

    return {
      success: true,
      data: title,
    };
  }

  @Get(':id/volumes')
  async findVolumes(@Param('id') id: string) {
    const volumes = await this.titleRepository.findVolumes(id);
    return {
      success: true,
      data: volumes,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  @UseInterceptors(AnyFilesInterceptor())
  async update(
    @Param('id') id: string,
    @Body('data') data?: string,
    @Body() directBody?: any,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    try {
      let updateTitleDto: UpdateTitleDto;

      if (data) {
        updateTitleDto = JSON.parse(data);
      } else {
        updateTitleDto = directBody;
      }

      if (!updateTitleDto || Object.keys(updateTitleDto).length === 0) {
        return {
          success: false,
          message: 'Nenhum dado fornecido para atualização',
        };
      }

      const title = await this.titleRepository.update(id, updateTitleDto);

      if (!title) {
        return {
          success: false,
          message: 'Título não encontrado',
        };
      }

      if (files && files.length > 0) {
        const uploadedUrls = await this.uploadService.uploadMultipleImages(
          files,
          'kushon/titles',
        );

        const mainCover = files.find((file) => file.fieldname === 'mainCover');
        if (mainCover) {
          const coverUrl = uploadedUrls.get('mainCover');
          await this.titleRepository.updateMainCover(id, coverUrl);
        }

        for (const file of files) {
          if (file.fieldname.startsWith('volume_')) {
            const volumeNumber = parseInt(file.fieldname.split('_')[1]);
            const coverUrl = uploadedUrls.get(file.fieldname);

            await this.titleRepository.updateVolumeCover(
              volumeNumber,
              id,
              coverUrl,
            );
          }
        }
      }

      return {
        success: true,
        data: title,
        message: 'Título atualizado com sucesso',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao atualizar título: ' + error.message,
      };
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminAuthGuard)
  async delete(@Param('id') id: string) {
    try {
      const deleted = await this.titleRepository.delete(id);

      if (!deleted) {
        return {
          success: false,
          message: 'Título não encontrado ou não foi possível excluir',
        };
      }

      return {
        success: true,
        message: 'Título excluído com sucesso',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao excluir título: ' + error.message,
      };
    }
  }
}
