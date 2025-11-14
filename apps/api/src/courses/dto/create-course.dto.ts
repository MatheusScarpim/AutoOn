import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Curso de Legislação de Trânsito' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Aprenda tudo sobre as leis de trânsito no Brasil' })
  @IsString()
  description: string;

  @ApiProperty({ example: 45, description: 'Carga horária em horas' })
  @IsNumber()
  @Min(1)
  workloadHours: number;

  @ApiProperty({ required: false, example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  coverImage?: string;
}
