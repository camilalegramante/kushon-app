import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpException,
} from '@nestjs/common';
import { AuthService } from '../../application/services/auth.service';
import { RegisterDto } from '../../application/dtos/auth/register.dto';
import { LoginDto } from '../../application/dtos/auth/login.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const result = await this.authService.register(registerDto);
      return {
        success: true,
        data: result,
        message: 'Usuário registrado com sucesso',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Register error:', error);
      throw error;
    }
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);
      return {
        success: true,
        data: result,
        message: 'Login realizado com sucesso',
      };
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
