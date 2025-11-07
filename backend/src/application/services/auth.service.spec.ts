import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserRepository } from '../../infra/repositories/user.repository';
import { RegisterDto } from '../dtos/auth/register.dto';
import { LoginDto } from '../dtos/auth/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed_password_here',
  };

  const mockRoles = ['USER'];

  beforeEach(async () => {
    const userRepositoryMock = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      getUserRoles: jest.fn(),
      findById: jest.fn(),
      validatePassword: jest.fn(),
    };

    const jwtServiceMock = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: userRepositoryMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(UserRepository);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);
      userRepository.getUserRoles.mockResolvedValue(mockRoles);
      jwtService.sign.mockReturnValue('mocked_jwt_token');

      const result = await service.register(registerDto);

      expect(result).toEqual({
        access_token: 'mocked_jwt_token',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          roles: mockRoles,
        },
      });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(userRepository.create).toHaveBeenCalledWith(
        registerDto.name,
        registerDto.email,
        registerDto.password,
      );
      expect(userRepository.getUserRoles).toHaveBeenCalledWith(mockUser.id);
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockRoles,
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should handle user repository errors during creation', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should successfully login a user with valid credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.validatePassword.mockResolvedValue(true);
      userRepository.getUserRoles.mockResolvedValue(mockRoles);
      jwtService.sign.mockReturnValue('mocked_jwt_token');

      const result = await service.login(loginDto);

      expect(result).toEqual({
        access_token: 'mocked_jwt_token',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          roles: mockRoles,
        },
      });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(userRepository.validatePassword).toHaveBeenCalledWith(
        mockUser,
        loginDto.password,
      );
    });

    it('should throw UnauthorizedException when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(userRepository.validatePassword).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      userRepository.findByEmail.mockResolvedValue(mockUser);
      userRepository.validatePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    it('should return user data when user exists', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      userRepository.getUserRoles.mockResolvedValue(mockRoles);

      const result: unknown = await service.validateUser(userId);

      expect(result).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        roles: mockRoles,
      });
      expect(userRepository.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      const result: unknown = await service.validateUser(userId);

      expect(result).toBeNull();
      expect(userRepository.getUserRoles).not.toHaveBeenCalled();
    });
  });
});
