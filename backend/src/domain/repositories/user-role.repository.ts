import { UserRole } from '../entities/user-role.entity';
import { Role } from '../value-objects/enums';

export interface UserRoleRepository {
  findById(id: string): Promise<UserRole | null>;
  findByUserAndRole(userId: string, role: Role): Promise<UserRole | null>;
  findByUser(userId: string): Promise<UserRole[]>;
  findAll(): Promise<UserRole[]>;
  create(userRole: Omit<UserRole, 'id'>): Promise<UserRole>;
  delete(id: string): Promise<void>;
}
