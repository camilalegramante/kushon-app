import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../../infra/database/prisma.service';
import { EmailService } from './email.service';

describe('NotificationService', () => {
  let service: NotificationService;
  let prismaService: any;
  let emailService: any;

  const mockNotificationPreference = {
    userId: 'user-123',
    titleId: 'title-456',
    emailOnNewVolume: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const mockTitle = {
    id: 'title-456',
    name: 'Dragon Ball Z',
  };

  beforeEach(async () => {
    const prismaMock = {
      notificationPreference: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    } as any;

    const emailServiceMock = {
      sendNewVolumeNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: EmailService,
          useValue: emailServiceMock,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
    emailService = module.get(EmailService) as jest.Mocked<EmailService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificationPreference', () => {
    it('should return notification preference when it exists', async () => {
      prismaService.notificationPreference.findUnique.mockResolvedValue(
        mockNotificationPreference,
      );

      const result = await service.getNotificationPreference('user-123', 'title-456');

      expect(result).toEqual(mockNotificationPreference);
      expect(prismaService.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: {
          userId_titleId: {
            userId: 'user-123',
            titleId: 'title-456',
          },
        },
      });
    });

    it('should return null when preference does not exist', async () => {
      prismaService.notificationPreference.findUnique.mockResolvedValue(null);

      const result = await service.getNotificationPreference('user-123', 'title-456');

      expect(result).toBeNull();
    });
  });

  describe('updateNotificationPreference', () => {
    it('should update existing notification preference', async () => {
      const updatedPreference = { ...mockNotificationPreference, emailOnNewVolume: false };
      prismaService.notificationPreference.upsert.mockResolvedValue(updatedPreference);

      const result = await service.updateNotificationPreference('user-123', 'title-456', false);

      expect(result).toEqual(updatedPreference);
      expect(prismaService.notificationPreference.upsert).toHaveBeenCalledWith({
        where: {
          userId_titleId: {
            userId: 'user-123',
            titleId: 'title-456',
          },
        },
        update: {
          emailOnNewVolume: false,
        },
        create: {
          userId: 'user-123',
          titleId: 'title-456',
          emailOnNewVolume: false,
        },
      });
    });

    it('should create new preference when it does not exist', async () => {
      const newPreference = { ...mockNotificationPreference };
      prismaService.notificationPreference.upsert.mockResolvedValue(newPreference);

      const result = await service.updateNotificationPreference('user-123', 'title-456', true);

      expect(result).toEqual(newPreference);
      expect(prismaService.notificationPreference.upsert).toHaveBeenCalled();
    });
  });

  describe('notifyUsersOnNewVolume', () => {
    it('should send email to all users with notification enabled', async () => {
      const mockPreferences = [
        {
          ...mockNotificationPreference,
          user: mockUser,
          title: mockTitle,
        },
        {
          ...mockNotificationPreference,
          userId: 'user-789',
          user: { ...mockUser, id: 'user-789', email: 'jane@example.com' },
          title: mockTitle,
        },
      ];

      prismaService.notificationPreference.findMany.mockResolvedValue(mockPreferences);
      emailService.sendNewVolumeNotification.mockResolvedValue(undefined);

      await service.notifyUsersOnNewVolume('title-456', 5);

      expect(prismaService.notificationPreference.findMany).toHaveBeenCalledWith({
        where: {
          titleId: 'title-456',
          emailOnNewVolume: true,
        },
        include: {
          user: true,
          title: true,
        },
      });
      expect(emailService.sendNewVolumeNotification).toHaveBeenCalledTimes(2);
      expect(emailService.sendNewVolumeNotification).toHaveBeenCalledWith(
        'john@example.com',
        'John Doe',
        'Dragon Ball Z',
        5,
      );
    });

    it('should handle email sending errors gracefully', async () => {
      const mockPreferences = [
        {
          ...mockNotificationPreference,
          user: mockUser,
          title: mockTitle,
        },
      ];

      prismaService.notificationPreference.findMany.mockResolvedValue(mockPreferences);
      emailService.sendNewVolumeNotification.mockRejectedValue(
        new Error('SMTP error'),
      );

      await expect(
        service.notifyUsersOnNewVolume('title-456', 5),
      ).resolves.not.toThrow();

      expect(emailService.sendNewVolumeNotification).toHaveBeenCalled();
    });

    it('should not send emails when no preferences exist', async () => {
      prismaService.notificationPreference.findMany.mockResolvedValue([]);

      await service.notifyUsersOnNewVolume('title-456', 5);

      expect(emailService.sendNewVolumeNotification).not.toHaveBeenCalled();
    });

    it('should not send emails to users with notification disabled', async () => {
      const mockPreferencesDisabled = [
        {
          ...mockNotificationPreference,
          emailOnNewVolume: false,
          user: mockUser,
          title: mockTitle,
        },
      ];

      prismaService.notificationPreference.findMany.mockResolvedValue([]);

      await service.notifyUsersOnNewVolume('title-456', 5);

      expect(emailService.sendNewVolumeNotification).not.toHaveBeenCalled();
    });
  });
});
