import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ example: 'uuid-do-modulo' })
  @IsString()
  moduleId: string;

  @ApiProperty({ example: 'Aula 1 - Conceitos Básicos' })
  @IsString()
  title: string;

  @ApiProperty({ example: 1, description: 'Ordem da aula no módulo' })
  @IsNumber()
  @Min(1)
  order: number;

  @ApiPropertyOptional({ example: 'uuid-do-video', description: 'ID do vídeo associado' })
  @IsOptional()
  @IsString()
  videoId?: string;

  @ApiPropertyOptional({
    example: 80,
    description: 'Percentual mínimo de visualização para considerar aula concluída',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minWatchPercent?: number;
}
