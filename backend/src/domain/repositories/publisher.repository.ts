import { Publisher } from '../entities/publisher.entity';

export interface PublisherRepository {
  findById(id: string): Promise<Publisher | null>;
  findByName(name: string): Promise<Publisher | null>;
  findAll(): Promise<Publisher[]>;
  create(
    publisher: Omit<Publisher, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Publisher>;
  update(id: string, publisher: Partial<Publisher>): Promise<Publisher>;
  delete(id: string): Promise<void>;
}
