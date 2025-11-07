import { Controller, Get, Post, Body } from '@nestjs/common';
import { PublisherRepository } from '../../infra/repositories/publisher.repository';

@Controller('publishers')
export class PublisherController {
  constructor(private readonly publisherRepository: PublisherRepository) {}

  @Get()
  async findAll() {
    const publishers = await this.publisherRepository.findAll();
    return {
      success: true,
      data: publishers,
    };
  }

  @Post()
  async create(@Body() createPublisherDto: { name: string; country?: string }) {
    const publisher = await this.publisherRepository.create(createPublisherDto);
    return {
      success: true,
      data: publisher,
      message: 'Editora criada com sucesso',
    };
  }
}
