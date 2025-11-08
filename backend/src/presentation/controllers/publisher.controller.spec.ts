import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PublisherController } from './publisher.controller';
import { PublisherRepository } from '../../infra/repositories/publisher.repository';

describe('PublisherController', () => {
  let controller: PublisherController;
  let repository: PublisherRepository;

  const mockPublisher: any = {
    id: '1',
    name: 'Test Publisher',
    country: 'Brazil',
    createdAt: new Date(),
    updatedAt: new Date(),
    titles: [],
  };

  const mockPublisherWithTitles: any = {
    id: '2',
    name: 'Publisher with Titles',
    country: 'USA',
    createdAt: new Date(),
    updatedAt: new Date(),
    titles: [
      {
        id: 'title-1',
        name: 'Test Title',
        slug: 'test-title',
        publisherId: '2',
        status: 'ONGOING',
        synopsis: 'Test synopsis',
        author: 'Test Author',
        genre: 'Test Genre',
        coverImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        volumes: [],
      },
    ],
  };

  const mockPublisherRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublisherController],
      providers: [
        {
          provide: PublisherRepository,
          useValue: mockPublisherRepository,
        },
      ],
    }).compile();

    controller = module.get<PublisherController>(PublisherController);
    repository = module.get<PublisherRepository>(PublisherRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return a list of publishers', async () => {
      const publishers = [mockPublisher];
      jest.spyOn(repository, 'findAll').mockResolvedValueOnce(publishers);

      const result = await controller.findAll();

      expect(result).toEqual({
        success: true,
        data: publishers,
      });
      expect(repository.findAll).toHaveBeenCalled();
    });

    it('should return empty list when no publishers exist', async () => {
      jest.spyOn(repository, 'findAll').mockResolvedValueOnce([]);

      const result = await controller.findAll();

      expect(result).toEqual({
        success: true,
        data: [],
      });
      expect(repository.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new publisher', async () => {
      const createDto = { name: 'New Publisher', country: 'Brazil' };
      jest.spyOn(repository, 'create').mockResolvedValueOnce(mockPublisher);

      const result = await controller.create(createDto);

      expect(result).toEqual({
        success: true,
        data: mockPublisher,
        message: 'Editora criada com sucesso',
      });
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });

    it('should create a publisher without country', async () => {
      const createDto = { name: 'New Publisher' };
      jest.spyOn(repository, 'create').mockResolvedValueOnce(mockPublisher);

      const result = await controller.create(createDto);

      expect(result).toEqual({
        success: true,
        data: mockPublisher,
        message: 'Editora criada com sucesso',
      });
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('delete', () => {
    it('should delete a publisher without titles', async () => {
      const publisherId = '1';
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValueOnce(mockPublisher);
      jest.spyOn(repository, 'delete').mockResolvedValueOnce(undefined);

      const result = await controller.delete(publisherId);

      expect(result).toEqual({
        success: true,
        message: 'Editora excluída com sucesso',
      });
      expect(repository.findById).toHaveBeenCalledWith(publisherId);
      expect(repository.delete).toHaveBeenCalledWith(publisherId);
    });

    it('should throw error when publisher not found', async () => {
      const publisherId = 'non-existent';
      jest.spyOn(repository, 'findById').mockResolvedValueOnce(null);

      await expect(controller.delete(publisherId)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findById).toHaveBeenCalledWith(publisherId);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw error when publisher has associated titles', async () => {
      const publisherId = '2';
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValueOnce(mockPublisherWithTitles);

      await expect(controller.delete(publisherId)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.findById).toHaveBeenCalledWith(publisherId);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw error with correct message when publisher has multiple titles', async () => {
      const publisherId = '2';
      const publisherWithMultipleTitles = {
        ...mockPublisherWithTitles,
        titles: [
          mockPublisherWithTitles.titles[0],
          { ...mockPublisherWithTitles.titles[0], id: 'title-2', name: 'Test Title 2' },
        ],
      };
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValueOnce(publisherWithMultipleTitles);

      try {
        await controller.delete(publisherId);
        fail('Should have thrown BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toContain('2 título(s)');
      }
    });
  });
});
