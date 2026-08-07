import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EducationLevel, EducationStatus, LanguageLevel } from '@prisma/client';

export class WorkExperienceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  company!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  current?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class EducationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  institution!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  course!: string;

  @ApiProperty({ enum: EducationLevel })
  @IsEnum(EducationLevel)
  level!: EducationLevel;

  @ApiProperty({ enum: EducationStatus })
  @IsEnum(EducationStatus)
  status!: EducationStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class LanguageSkillDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  language!: string;

  @ApiProperty({ enum: LanguageLevel })
  @IsEnum(LanguageLevel)
  level!: LanguageLevel;
}

export class CreateDigitalResumeDto {
  @ApiProperty()
  @IsUUID()
  preRegistrationId!: string;

  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({ type: [WorkExperienceDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkExperienceDto)
  experiences?: WorkExperienceDto[];

  @ApiProperty({ type: [EducationDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  educations?: EducationDto[];

  @ApiProperty({ type: [LanguageSkillDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageSkillDto)
  languages?: LanguageSkillDto[];

  @ApiProperty({ required: false, description: 'Vaga de interesse do candidato' })
  @IsOptional()
  @IsUUID()
  desiredJobId?: string;
}
