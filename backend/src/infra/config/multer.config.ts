import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import { BadRequestException } from '@nestjs/common';

export const multerConfig: MulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = join(process.cwd(), 'uploads');
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const fileExtension = extname(file.originalname);
      const fileName = `${uuid()}${fileExtension}`;
      cb(null, fileName);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestException('Apenas arquivos de imagem são permitidos'),
        false,
      );
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 50,
  },
};
