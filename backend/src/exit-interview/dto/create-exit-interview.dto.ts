import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import {
  DEPARTMENTS,
  DEPARTURE_TYPE_VALUES,
  DISMISSAL_REASON_VALUES,
  FREQUENCY_SCALE_VALUES,
  QUALITY_SCALE_VALUES,
  RESIGNATION_REASON_VALUES,
  YES_NO_SCALE_VALUES,
} from '../exit-interview-content';

export class CreateExitInterviewDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  employeeName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  position!: string;

  @ApiProperty({ enum: DEPARTMENTS })
  @IsIn(DEPARTMENTS)
  department!: string;

  @ApiProperty()
  @IsDateString()
  admissionDate!: string;

  @ApiProperty()
  @IsDateString()
  terminationDate!: string;

  @ApiProperty()
  @IsDateString()
  interviewDate!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  interviewerName!: string;

  @ApiProperty({ enum: DEPARTURE_TYPE_VALUES })
  @IsIn(DEPARTURE_TYPE_VALUES)
  departureType!: string;

  @ApiProperty({ enum: DISMISSAL_REASON_VALUES, required: false })
  @IsOptional()
  @IsIn(DISMISSAL_REASON_VALUES)
  dismissalReason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  dismissalReasonOther?: string;

  @ApiProperty({ enum: RESIGNATION_REASON_VALUES, required: false })
  @IsOptional()
  @IsIn(RESIGNATION_REASON_VALUES)
  resignationReason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  resignationReasonOther?: string;

  @ApiProperty({ enum: FREQUENCY_SCALE_VALUES })
  @IsIn(FREQUENCY_SCALE_VALUES)
  toolsSupport!: string;

  @ApiProperty({ enum: FREQUENCY_SCALE_VALUES })
  @IsIn(FREQUENCY_SCALE_VALUES)
  healthyEnvironment!: string;

  @ApiProperty({ enum: QUALITY_SCALE_VALUES })
  @IsIn(QUALITY_SCALE_VALUES)
  teamRelationship!: string;

  @ApiProperty({ enum: QUALITY_SCALE_VALUES })
  @IsIn(QUALITY_SCALE_VALUES)
  leadershipRelationship!: string;

  @ApiProperty({ enum: YES_NO_SCALE_VALUES })
  @IsIn(YES_NO_SCALE_VALUES)
  receivedFeedback!: string;

  @ApiProperty({ enum: YES_NO_SCALE_VALUES })
  @IsIn(YES_NO_SCALE_VALUES)
  couldSuggestIdeas!: string;

  @ApiProperty({ enum: YES_NO_SCALE_VALUES })
  @IsIn(YES_NO_SCALE_VALUES)
  feltValued!: string;

  @ApiProperty({ enum: YES_NO_SCALE_VALUES })
  @IsIn(YES_NO_SCALE_VALUES)
  growthOpportunities!: string;

  @ApiProperty({ enum: YES_NO_SCALE_VALUES })
  @IsIn(YES_NO_SCALE_VALUES)
  clearProcedures!: string;

  @ApiProperty({ enum: YES_NO_SCALE_VALUES })
  @IsIn(YES_NO_SCALE_VALUES)
  healthSafety!: string;

  @ApiProperty({ enum: QUALITY_SCALE_VALUES })
  @IsIn(QUALITY_SCALE_VALUES)
  benefitsRating!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  likedMost?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  improvementSuggestions?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  wouldRecommend?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  finalComments?: string;
}
