import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCourseDto {
  @ApiPropertyOptional({ example: 'legislação', description: 'Busca por título ou descrição' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ example: 1, description: 'Número da página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Itens por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 10;

  @ApiPropertyOptional({ example: true, description: 'Filtrar apenas cursos publicados' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  published?: boolean;

  @ApiPropertyOptional({ example: 'createdAt', description: 'Campo para ordenação' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ example: 'desc', description: 'Direção da ordenação' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
