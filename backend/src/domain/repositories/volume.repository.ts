import { Volume } from '../entities/volume.entity';

export interface VolumeRepository {
  findById(id: string): Promise<Volume | null>;
  findByTitleAndNumber(titleId: string, number: number): Promise<Volume | null>;
  findByTitle(titleId: string): Promise<Volume[]>;
  findAll(): Promise<Volume[]>;
  create(
    volume: Omit<Volume, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Volume>;
  update(id: string, volume: Partial<Volume>): Promise<Volume>;
  delete(id: string): Promise<void>;
}
