import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../../infra/repositories/user.repository';
import { RegisterDto } from '../dtos/auth/register.dto';
import { LoginDto } from '../dtos/auth/login.dto';

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
  };
}

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.userRepository.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    const user = await this.userRepository.create(
      registerDto.name,
      registerDto.email,
      registerDto.password,
    );

    const roles = await this.userRepository.getUserRoles(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await this.userRepository.validatePassword(
      user,
      loginDto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const roles = await this.userRepository.getUserRoles(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      roles,
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles,
      },
    };
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    const roles = await this.userRepository.getUserRoles(user.id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roles,
    };
  }
}
