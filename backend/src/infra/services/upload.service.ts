import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadImage(file: Express.Multer.File, folder: string = 'kushon'): Promise<string> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo fornecido');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Apenas imagens são permitidas');
    }

    try {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: 'auto',
            quality: 'auto',
            fetch_format: 'auto',
          },
          (error, result) => {
            if (error) {
              reject(new BadRequestException(`Erro ao fazer upload: ${error.message}`));
            } else {
              resolve(result.secure_url);
            }
          }
        );

        uploadStream.end(file.buffer);
      });
    } catch (error) {
      throw new BadRequestException(`Erro ao fazer upload da imagem: ${error.message}`);
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    folder: string = 'kushon'
  ): Promise<Map<string, string>> {
    const uploadPromises = files.map(async (file) => {
      const url = await this.uploadImage(file, folder);
      return { fieldname: file.fieldname, url };
    });

    const results = await Promise.all(uploadPromises);
    const urlMap = new Map<string, string>();

    results.forEach(({ fieldname, url }) => {
      urlMap.set(fieldname, url);
    });

    return urlMap;
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error(`Erro ao deletar imagem ${publicId}:`, error);
    }
  }
}
