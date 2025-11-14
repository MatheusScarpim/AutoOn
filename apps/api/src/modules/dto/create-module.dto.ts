import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class CreateModuleDto {
  @ApiProperty({ example: 'uuid-do-curso' })
  @IsString()
  courseId: string;

  @ApiProperty({ example: 'Módulo 1 - Introdução' })
  @IsString()
  title: string;

  @ApiProperty({ example: 1, description: 'Ordem do módulo no curso' })
  @IsNumber()
  @Min(1)
  order: number;
}
