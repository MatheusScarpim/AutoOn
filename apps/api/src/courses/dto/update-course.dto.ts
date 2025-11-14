import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Curso de Legislação de Trânsito' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Aprenda tudo sobre as leis de trânsito no Brasil' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 45, description: 'Carga horária em horas' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  workloadHours?: number;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  coverImage?: string;
}
