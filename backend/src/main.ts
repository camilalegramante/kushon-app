import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { EnvironmentValidation } from './config/env.validation';
import { EmailService } from './application/services/email.service';

async function bootstrap() {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('🚀 KUSHON BACKEND APPLICATION - STARTUP SEQUENCE');
  console.log('═'.repeat(80));
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🖥️  Platform: ${process.platform} (${process.arch})`);
  console.log(`📦 Node Version: ${process.version}`);
  console.log(`🔧 Working Directory: ${process.cwd()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚪 Port: ${process.env.PORT || 3000}`);
  console.log('═'.repeat(80));
  console.log('\n');

  const logger = new Logger('Bootstrap');

  logger.log('🚀 Starting Kushon Backend Application...');
  logger.log('═'.repeat(60));

  try {
    EnvironmentValidation.validate();
  } catch (error) {
    logger.error('═'.repeat(60));
    logger.error('❌ ENVIRONMENT VALIDATION FAILED!');
    logger.error('═'.repeat(60));
    throw error;
  }

  logger.log('🏗️  Creating NestJS application...');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  logger.log('✅ NestJS application created successfully');

  logger.log('📁 Configuring static assets...');
  const uploadsPath = join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });
  logger.log(`   └─ Uploads directory: ${uploadsPath}`);

  logger.log('🌐 Configuring CORS...');
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
  logger.log('   └─ Allowed origins: localhost, *.herokuapp.com');
  logger.log('   └─ Allowed methods: GET, POST, PUT, DELETE, PATCH');
  logger.log('   └─ Credentials: enabled');

  logger.log('🔧 Configuring global validation pipe...');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  logger.log('   └─ Whitelist: enabled');
  logger.log('   └─ Transform: enabled');

  logger.log('🔌 Configuring API routes...');
  app.setGlobalPrefix('api');
  logger.log('   └─ Global prefix: /api');

  logger.log('📧 Verifying SMTP Configuration...');
  try {
    const emailService = app.get(EmailService);
    if (emailService && emailService.testConnection) {
      const isConnected = await emailService.testConnection();
      if (isConnected) {
        logger.log('   ✅ SMTP connection verified successfully');
        logger.log(`   └─ Host: ${process.env.SMTP_HOST}`);
        logger.log(`   └─ Port: ${process.env.SMTP_PORT}`);
      } else {
        logger.warn('   ⚠️  SMTP connection test failed - emails may not be delivered');
      }
    }
  } catch (error) {
    logger.warn('   ⚠️  Could not verify SMTP connection during startup');
    logger.debug(`   └─ Error: ${error.message}`);
  }

  logger.log('🌐 Checking for frontend build...');
  const frontendPath = join(process.cwd(), '..', 'frontend', 'dist');
  const fs = require('fs');

  if (fs.existsSync(frontendPath)) {
    logger.log('   ✅ Frontend build found');
    logger.log(`   └─ Path: ${frontendPath}`);

    app.useStaticAssets(frontendPath);
    app.setBaseViewsDir(frontendPath);

    app.use((req: any, res: any, next: any) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
        res.sendFile(join(frontendPath, 'index.html'));
      } else {
        next();
      }
    });

    logger.log('   └─ SPA routing: enabled');
    logger.log('   └─ Static files: serving');
  } else {
    logger.warn('   ⚠️  Frontend build not found');
    logger.warn(`   └─ Expected path: ${frontendPath}`);
    logger.warn('   └─ Frontend will not be served');
    logger.warn('   └─ Run `npm run build` in frontend directory to enable');
  }

  logger.log('🚀 Starting HTTP server...');
  const port = process.env.PORT || 3000;
  const host = '0.0.0.0';

  try {
    await app.listen(port, host);
    logger.log('   ✅ Server started successfully');
  } catch (error) {
    logger.error('   ❌ Failed to start server');
    throw error;
  }

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('✅ KUSHON BACKEND IS RUNNING!');
  console.log('═'.repeat(80));
  console.log(`🌍 Server listening on: http://0.0.0.0:${port}`);
  console.log(`🔗 API Base URL: http://0.0.0.0:${port}/api`);
  console.log(`📁 Uploads: http://0.0.0.0:${port}/uploads`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log('═'.repeat(80));
  console.log('\n');

  logRoutes(app, logger);
}

function logRoutes(app: NestExpressApplication, logger: Logger) {
  const server: any = app.getHttpServer();
  const router = server._events?.request?._router;

  logger.log('📋 Registered Routes:');
  logger.log('─'.repeat(60));

  const routes = [];

  if (router && router.stack) {
    router.stack.forEach((layer: any) => {
      if (layer.route) {
        const path = layer.route.path;
        const methods = Object.keys(layer.route.methods)
          .filter(method => layer.route.methods[method])
          .map(method => method.toUpperCase());

        methods.forEach(method => {
          routes.push({ method, path });
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        const prefix = layer.regexp.source
          .replace('^\\/api\\/?', '/api/')
          .replace('\\/?(?=\\/|$)', '')
          .replace(/\\/g, '');

        layer.handle.stack.forEach((innerLayer: any) => {
          if (innerLayer.route) {
            const path = prefix + innerLayer.route.path;
            const methods = Object.keys(innerLayer.route.methods)
              .filter(method => innerLayer.route.methods[method])
              .map(method => method.toUpperCase());

            methods.forEach(method => {
              routes.push({ method, path });
            });
          }
        });
      }
    });
  }

  routes.sort((a, b) => a.path.localeCompare(b.path));

  const groupedRoutes: { [key: string]: typeof routes } = {};
  routes.forEach(route => {
    const parts = route.path.split('/').filter(Boolean);
    const controller = parts.length > 1 ? parts[1] : 'root';
    if (!groupedRoutes[controller]) {
      groupedRoutes[controller] = [];
    }
    groupedRoutes[controller].push(route);
  });

  Object.keys(groupedRoutes).forEach(controller => {
    logger.log(`\n  📦 /${controller}`);
    groupedRoutes[controller].forEach(route => {
      const methodColor = route.method === 'GET' ? '🔵' :
                         route.method === 'POST' ? '🟢' :
                         route.method === 'PUT' ? '🟡' :
                         route.method === 'DELETE' ? '🔴' :
                         route.method === 'PATCH' ? '🟠' : '⚪';
      logger.log(`    ${methodColor} ${route.method.padEnd(6)} ${route.path}`);
    });
  });

  logger.log('─'.repeat(60));
  logger.log(`✅ Total routes registered: ${routes.length}`);
  logger.log('═'.repeat(60));
}

bootstrap().catch((error) => {
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('❌ FATAL ERROR: APPLICATION STARTUP FAILED');
  console.log('═'.repeat(80));
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🔴 Error Type: ${error.constructor.name}`);
  console.log(`💬 Error Message: ${error.message}`);
  console.log('═'.repeat(80));
  console.log('📋 Stack Trace:');
  console.log(error.stack);
  console.log('═'.repeat(80));
  console.log('\n');

  const logger = new Logger('Bootstrap');
  logger.error('❌ APPLICATION FAILED TO START');
  logger.error(`Error: ${error.message}`);
  logger.error('Check the logs above for detailed information');

  process.exit(1);
});