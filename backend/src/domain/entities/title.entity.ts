import { TitleStatus } from '../value-objects/enums';

export class Title {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly publisherId: string,
    public readonly status: TitleStatus = TitleStatus.ONGOING,
    public readonly synopsis?: string,
    public readonly author?: string,
    public readonly genre?: string,
    public readonly coverImage?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}

export class Volume {
  constructor(
    public readonly id: string,
    public readonly number: number,
    public readonly titleId: string,
    public readonly title?: string,
    public readonly coverImage?: string,
    public readonly releaseAt?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
