import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreatePreRegistrationDto {
  @ApiProperty()
  @IsUUID()
  candidateId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  birthPlace!: string;

  @ApiProperty()
  @IsDateString()
  birthDate!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  rg!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  cpf!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fatherName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  motherName!: string;
}
