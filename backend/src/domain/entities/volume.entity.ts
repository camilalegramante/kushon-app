export class Volume {
  constructor(
    public readonly id: string,
    public readonly number: number,
    public readonly titleId: string,
    public readonly releaseAt?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
