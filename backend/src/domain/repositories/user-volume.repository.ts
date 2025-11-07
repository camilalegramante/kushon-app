import { UserVolume } from '../entities/user-volume.entity';

export interface UserVolumeRepository {
  findById(id: string): Promise<UserVolume | null>;
  findByUserAndVolume(
    userId: string,
    volumeId: string,
  ): Promise<UserVolume | null>;
  findByUser(userId: string): Promise<UserVolume[]>;
  findByVolume(volumeId: string): Promise<UserVolume[]>;
  findAll(): Promise<UserVolume[]>;
  create(
    userVolume: Omit<UserVolume, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<UserVolume>;
  update(id: string, userVolume: Partial<UserVolume>): Promise<UserVolume>;
  delete(id: string): Promise<void>;
}
