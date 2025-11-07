import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '../../application/services/auth.service';
import { AuthController } from '../controllers/auth.controller';
import { JwtStrategy } from '../../application/strategies/jwt.strategy';
import { UserRepository } from '../../infra/repositories/user.repository';
import { PrismaService } from '../../infra/database/prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, JwtStrategy, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}
