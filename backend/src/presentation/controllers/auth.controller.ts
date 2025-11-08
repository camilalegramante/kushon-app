import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpException,
  Response,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { AuthService } from '../../application/services/auth.service';
import { RegisterDto } from '../../application/dtos/auth/register.dto';
import { LoginDto } from '../../application/dtos/auth/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Response() res: ExpressResponse) {
    try {
      const result = await this.authService.register(registerDto);

      res.cookie('Authorization', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        data: {
          access_token: result.access_token,
          user: result.user,
        },
        message: 'Usuário registrado com sucesso',
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Register error:', error);
      throw error;
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Response() res: ExpressResponse) {
    try {
      const result = await this.authService.login(loginDto);

      res.cookie('Authorization', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        data: {
          access_token: result.access_token,
          user: result.user,
        },
        message: 'Login realizado com sucesso',
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Login error:', error);
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return {
      success: true,
      data: req.user,
      message: 'Perfil do usuário',
    };
  }
}
