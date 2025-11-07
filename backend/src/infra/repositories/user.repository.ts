import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { User } from '../../domain/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async create(name: string, email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);

    const createdUser = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        userRoles: {
          create: {
            role: 'USER',
          },
        },
      },
      include: {
        userRoles: true,
      },
    });

    return new User(
      createdUser.id,
      createdUser.name,
      createdUser.email,
      createdUser.password,
      createdUser.createdAt,
      createdUser.updatedAt,
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: true,
      },
    });

    if (!user) return null;

    return new User(
      user.id,
      user.name,
      user.email,
      user.password,
      user.createdAt,
      user.updatedAt,
    );
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: true,
      },
    });

    if (!user) return null;

    return new User(
      user.id,
      user.name,
      user.email,
      user.password,
      user.createdAt,
      user.updatedAt,
    );
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  async hasRole(userId: string, role: 'ADMIN' | 'USER'): Promise<boolean> {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        role,
      },
    });

    return !!userRole;
  }

  async getUserRoles(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
    });

    return userRoles.map((ur) => ur.role);
  }
}
