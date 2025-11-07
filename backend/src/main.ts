import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';
import { EnvironmentValidation } from './config/env.validation';
import { EmailService } from './application/services/email.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    EnvironmentValidation.validate();
  } catch (error) {
    logger.error('Environment validation failed');
    throw error;
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  const corsOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    /\.herokuapp\.com$/,
  ];
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  try {
    const emailService = app.get(EmailService);
    if (emailService && emailService.testConnection) {
      await emailService.testConnection();
    }
  } catch {
    logger.warn('Could not verify SMTP connection');
  }

  const frontendPath = join(process.cwd(), '..', 'frontend', 'dist');

  if (existsSync(frontendPath)) {
    app.useStaticAssets(frontendPath);
    app.setBaseViewsDir(frontendPath);

    app.use((req: any, res: any, next: any) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        res.sendFile(join(frontendPath, 'index.html'));
      } else {
        next();
      }
    });
  }

  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';

  try {
    await app.listen(port, host);
    logger.log(`Server running on http://${host}:${port}`);
  } catch (error) {
    logger.error('Failed to start server');
    throw error;
  }
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Application startup failed');
  logger.error(error.message);
  process.exit(1);
});
