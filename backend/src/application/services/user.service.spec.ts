import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaService } from '../../infra/database/prisma.service';
import { UpdateVolumeProgressDto } from '../dtos/user/update-volume-progress.dto';

describe('UserService', () => {
  let service: UserService;
  let prismaService: any;

  const mockVolumes = [
    { id: 'vol-1', number: 1, title: 'Volume 1', titleId: 'title-123' },
    { id: 'vol-2', number: 2, title: 'Volume 2', titleId: 'title-123' },
    { id: 'vol-3', number: 3, title: 'Volume 3', titleId: 'title-123' },
  ];

  const mockTitle = {
    id: 'title-123',
    name: 'Dragon Ball Z',
    volumes: mockVolumes,
  };

  beforeEach(async () => {
    const prismaMock = {
      title: {
        findUnique: jest.fn(),
      },
      userVolume: {
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUserVolumeProgress', () => {
    const userId = 'user-123';
    const titleId = 'title-123';

    const updateDto: UpdateVolumeProgressDto = {
      volumes: [
        { volumeId: 'vol-1', owned: true },
        { volumeId: 'vol-2', owned: false },
      ],
    };

    it('should successfully update user volume progress', async () => {
      prismaService.title.findUnique.mockResolvedValue(mockTitle);

      const mockUpsertResults = [
        { userId, volumeId: 'vol-1', owned: true, notified: false },
        { userId, volumeId: 'vol-2', owned: false, notified: false },
      ];

      prismaService.$transaction.mockImplementation(async (callback) => {
        // Simulate transaction execution
        return callback({
          userVolume: {
            upsert: jest.fn().mockResolvedValueOnce(mockUpsertResults[0]).mockResolvedValueOnce(mockUpsertResults[1]),
          },
        });
      });

      const result = await service.updateUserVolumeProgress(userId, titleId, updateDto);

      expect(result.success).toBe(true);
      expect(prismaService.title.findUnique).toHaveBeenCalledWith({
        where: { id: titleId },
        include: { volumes: true },
      });
    });

    it('should throw NotFoundException when title does not exist', async () => {
      prismaService.title.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserVolumeProgress(userId, titleId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when volume does not belong to title', async () => {
      prismaService.title.findUnique.mockResolvedValue(mockTitle);

      const invalidUpdateDto: UpdateVolumeProgressDto = {
        volumes: [
          { volumeId: 'invalid-vol-id', owned: true },
        ],
      };

      await expect(
        service.updateUserVolumeProgress(userId, titleId, invalidUpdateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle multiple volume updates in a transaction', async () => {
      prismaService.title.findUnique.mockResolvedValue(mockTitle);

      const multipleUpdateDto: UpdateVolumeProgressDto = {
        volumes: [
          { volumeId: 'vol-1', owned: true },
          { volumeId: 'vol-2', owned: true },
          { volumeId: 'vol-3', owned: false },
        ],
      };

      const mockResults = [
        { userId, volumeId: 'vol-1', owned: true },
        { userId, volumeId: 'vol-2', owned: true },
        { userId, volumeId: 'vol-3', owned: false },
      ];

      prismaService.$transaction.mockResolvedValue(mockResults);

      const result = await service.updateUserVolumeProgress(
        userId,
        titleId,
        multipleUpdateDto,
      );

      expect(result.success).toBe(true);
      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('getUserVolumeProgress', () => {
    const userId = 'user-123';
    const titleId = 'title-123';

    it('should return volume progress for user', async () => {
      prismaService.title.findUnique.mockResolvedValue(mockTitle);

      const mockUserVolumes = [
        {
          userId,
          volumeId: 'vol-1',
          owned: true,
          notified: true,
          volume: mockVolumes[0],
        },
        {
          userId,
          volumeId: 'vol-2',
          owned: true,
          notified: false,
          volume: mockVolumes[1],
        },
      ];

      prismaService.userVolume.findMany.mockResolvedValue(mockUserVolumes);

      const result = await service.getUserVolumeProgress(userId, titleId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data[0].owned).toBe(true);
      expect(result.data[1].owned).toBe(true);
      expect(result.data[2].owned).toBe(false);
    });

    it('should throw NotFoundException when title does not exist', async () => {
      prismaService.title.findUnique.mockResolvedValue(null);

      await expect(
        service.getUserVolumeProgress(userId, titleId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return all volumes with default false when user has no progress', async () => {
      prismaService.title.findUnique.mockResolvedValue(mockTitle);
      prismaService.userVolume.findMany.mockResolvedValue([]);

      const result = await service.getUserVolumeProgress(userId, titleId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data.every((v) => v.owned === false)).toBe(true);
    });

    it('should include volume number and title in progress data', async () => {
      prismaService.title.findUnique.mockResolvedValue(mockTitle);

      const mockUserVolumes = [
        {
          userId,
          volumeId: 'vol-1',
          owned: true,
          notified: false,
          volume: mockVolumes[0],
        },
      ];

      prismaService.userVolume.findMany.mockResolvedValue(mockUserVolumes);

      const result = await service.getUserVolumeProgress(userId, titleId);

      expect(result.data[0]).toEqual({
        volumeId: 'vol-1',
        volumeNumber: 1,
        volumeTitle: 'Volume 1',
        owned: true,
        notified: false,
      });
    });
  });
});
