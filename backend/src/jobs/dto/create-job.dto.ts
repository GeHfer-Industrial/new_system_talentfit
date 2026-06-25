import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { KeywordType } from '@prisma/client';

export class JobKeywordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  keyword!: string;

  @ApiProperty({ enum: KeywordType })
  @IsEnum(KeywordType)
  type!: KeywordType;
}

export class CreateJobDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  department!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ type: [JobKeywordDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JobKeywordDto)
  keywords?: JobKeywordDto[];
}
