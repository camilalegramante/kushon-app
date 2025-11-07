import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVolumeDto {
  @IsInt()
  @Min(1)
  number: number;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;
}

export class CreateTitleDto {
  @IsString()
  name: string;

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

  @IsString()
  publisherId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVolumeDto)
  volumes: CreateVolumeDto[];
}
