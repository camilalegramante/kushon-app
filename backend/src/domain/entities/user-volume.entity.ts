export class UserVolume {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly volumeId: string,
    public readonly owned: boolean = false,
    public readonly notified: boolean = false,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}
