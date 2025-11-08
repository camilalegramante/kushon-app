import { Controller, Get, Post, Delete, Body, Param, BadRequestException } from '@nestjs/common';
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

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const publisher = await this.publisherRepository.findById(id);

    if (!publisher) {
      throw new BadRequestException('Editora não encontrada');
    }

    if (publisher.titles && publisher.titles.length > 0) {
      throw new BadRequestException(
        `Não é possível excluir esta editora pois ela possui ${publisher.titles.length} título(s) associado(s). Exclua os títulos primeiro.`
      );
    }

    await this.publisherRepository.delete(id);
    return {
      success: true,
      message: 'Editora excluída com sucesso',
    };
  }
}
