import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
      const maskedUrl = this.maskDatabaseUrl(databaseUrl);
      this.logger.log(`🔌 Connecting to database: ${maskedUrl}`);
    } else {
      this.logger.error('❌ DATABASE_URL environment variable is not set!');
      throw new Error('DATABASE_URL is required');
    }

    try {
      await this.$connect();
      this.logger.log('✅ Database connection established successfully');

      await this.$queryRaw`SELECT 1`;
      this.logger.log('✅ Database query test successful');
    } catch (error) {
      this.logger.error(`❌ Failed to connect to database: ${error.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('🔌 Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('✅ Database connection closed');
  }

  private maskDatabaseUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.password) {
        urlObj.password = '***MASKED***';
      }
      return urlObj.toString();
    } catch {
      return 'Invalid URL format';
    }
  }
}