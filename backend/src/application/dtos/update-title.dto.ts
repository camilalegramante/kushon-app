import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TitleStatus } from '../../domain/value-objects/enums';

class UpdateVolumeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  number?: number;

  @IsOptional()
  @IsString()
  coverImage?: string;
}

export class UpdateTitleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  synopsis?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  genre?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsEnum(TitleStatus)
  status?: TitleStatus;

  @IsOptional()
  @IsString()
  publisherId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVolumeDto)
  volumes?: UpdateVolumeDto[];
}
