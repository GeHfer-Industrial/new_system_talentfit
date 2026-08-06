import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsIn,
  IsInt,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class BehavioralAnswerDto {
  @ApiProperty()
  @IsInt()
  questionOrder!: number;

  @ApiProperty({ enum: ['E', 'C', 'A', 'V'] })
  @IsIn(['E', 'C', 'A', 'V'])
  categoryCode!: 'E' | 'C' | 'A' | 'V';
}

export class SubmitBehavioralResultDto {
  @ApiProperty()
  @IsUUID()
  preRegistrationId!: string;

  @ApiProperty({ type: [BehavioralAnswerDto] })
  @ValidateNested({ each: true })
  @Type(() => BehavioralAnswerDto)
  @ArrayMinSize(25)
  @ArrayMaxSize(25)
  answers!: BehavioralAnswerDto[];
}
