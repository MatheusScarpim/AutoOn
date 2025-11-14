import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateLessonDto {
  @ApiPropertyOptional({ example: 'Aula 1 - Conceitos Básicos' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 1, description: 'Ordem da aula no módulo' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

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
