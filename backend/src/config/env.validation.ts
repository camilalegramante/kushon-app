import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EnvironmentValidation {
  private static readonly logger = new Logger(EnvironmentValidation.name);

  static validate() {
    console.log('═'.repeat(80));
    console.log('🔍 ENVIRONMENT VALIDATION STARTING...');
    console.log('═'.repeat(80));

    this.logger.log('🔍 Validating environment variables...');

    const criticalEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
    const optionalEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM', 'FRONTEND_URL'];

    this.logger.log('═'.repeat(60));
    this.logger.log('📦 ENVIRONMENT INFORMATION:');
    this.logger.log(`   Node Environment: ${process.env.NODE_ENV || 'development'}`);
    this.logger.log(`   Port: ${process.env.PORT || 3000}`);
    this.logger.log(`   Platform: ${process.platform}`);
    this.logger.log(`   Node Version: ${process.version}`);
    this.logger.log('═'.repeat(60));

    if (process.env.DATABASE_URL) {
      const maskedDbUrl = this.maskDatabaseUrl(process.env.DATABASE_URL);
      this.logger.log(`🗄️  DATABASE_URL: ${maskedDbUrl}`);

      const dbInfo = this.extractDbInfo(process.env.DATABASE_URL);
      if (dbInfo) {
        this.logger.log(`   └─ Host: ${dbInfo.host}`);
        this.logger.log(`   └─ Port: ${dbInfo.port}`);
        this.logger.log(`   └─ Database: ${dbInfo.database}`);
        this.logger.log(`   └─ User: ${dbInfo.user}`);
      }
    } else {
      this.logger.error('❌ DATABASE_URL is not set!');
    }

    const missingCritical = criticalEnvVars.filter(
      (envVar) => !process.env[envVar],
    );

    if (missingCritical.length > 0) {
      this.logger.error('═'.repeat(60));
      this.logger.error('❌ CRITICAL ERROR: Missing required environment variables!');
      this.logger.error(`   Variables: ${missingCritical.join(', ')}`);
      this.logger.error('═'.repeat(60));
      throw new Error(
        `Missing critical environment variables: ${missingCritical.join(', ')}\n` +
          'Please check your Heroku config vars or .env file and ensure all required variables are set.',
      );
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      this.logger.error('❌ JWT_SECRET must be at least 32 characters long');
      this.logger.error(`   Current length: ${process.env.JWT_SECRET?.length || 0}`);
      throw new Error(
        'JWT_SECRET must be at least 32 characters long for security',
      );
    }

    const missingOptional = optionalEnvVars.filter(
      (envVar) => !process.env[envVar],
    );

    if (missingOptional.length > 0) {
      this.logger.warn('═'.repeat(60));
      this.logger.warn('⚠️  WARNING: Missing optional environment variables!');
      this.logger.warn(`   Variables: ${missingOptional.join(', ')}`);
      this.logger.warn('   Email functionality may not work properly.');
      this.logger.warn('═'.repeat(60));
    }

    // Log all environment variables (masked)
    this.logger.log('═'.repeat(60));
    this.logger.log('📋 ENVIRONMENT VARIABLES STATUS:');
    [...criticalEnvVars, ...optionalEnvVars].forEach((envVar) => {
      const isSet = !!process.env[envVar];
      const status = isSet ? '✅' : '❌';
      const value = isSet
        ? envVar.includes('SECRET') || envVar.includes('PASS')
          ? '***'
          : envVar === 'DATABASE_URL'
            ? this.maskDatabaseUrl(process.env[envVar]!)
            : process.env[envVar]
        : 'NOT SET';
      this.logger.log(`   ${status} ${envVar}: ${value}`);
    });
    this.logger.log('═'.repeat(60));

    this.logger.log('✅ Critical environment variables are configured');
    console.log('═'.repeat(80));
    console.log('✅ ENVIRONMENT VALIDATION COMPLETED SUCCESSFULLY');
    console.log('═'.repeat(80));
  }

  private static maskDatabaseUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      if (urlObj.password) {
        urlObj.password = '***';
      }
      return urlObj.toString();
    } catch {
      return '[Invalid URL format]';
    }
  }

  private static extractDbInfo(url: string): { host: string; port: string; database: string; user: string } | null {
    try {
      const urlObj = new URL(url);
      return {
        host: urlObj.hostname,
        port: urlObj.port || '5432',
        database: urlObj.pathname.split('/')[1]?.split('?')[0] || 'unknown',
        user: urlObj.username || 'unknown'
      };
    } catch {
      return null;
    }
  }
}