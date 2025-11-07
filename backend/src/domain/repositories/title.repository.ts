import { Title } from '../entities/title.entity';

export interface TitleRepository {
  findById(id: string): Promise<Title | null>;
  findBySlugAndPublisher(
    slug: string,
    publisherId: string,
  ): Promise<Title | null>;
  findByPublisher(publisherId: string): Promise<Title[]>;
  findAll(): Promise<Title[]>;
  create(title: Omit<Title, 'id' | 'createdAt' | 'updatedAt'>): Promise<Title>;
  update(id: string, title: Partial<Title>): Promise<Title>;
  delete(id: string): Promise<void>;
}
