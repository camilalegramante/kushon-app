export class Publisher {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly country?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
