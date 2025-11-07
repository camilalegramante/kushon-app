import { Role } from '../value-objects/enums';

export class UserRole {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly role: Role,
  ) {}
}
