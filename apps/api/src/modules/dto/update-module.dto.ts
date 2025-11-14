import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class UpdateModuleDto {
  @ApiPropertyOptional({ example: 'Módulo 1 - Introdução' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 1, description: 'Ordem do módulo no curso' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;
}
