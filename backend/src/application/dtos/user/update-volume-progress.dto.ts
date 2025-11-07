import { IsArray, ValidateNested, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class VolumeProgressDto {
  @IsString()
  volumeId: string;

  @IsBoolean()
  owned: boolean;
}

export class UpdateVolumeProgressDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VolumeProgressDto)
  volumes: VolumeProgressDto[];
}
