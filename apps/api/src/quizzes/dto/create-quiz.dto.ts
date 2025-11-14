import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateQuizDto {
  @ApiProperty({ example: 'Quiz de Legislação - Módulo 1' })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Teste seus conhecimentos sobre legislação de trânsito',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 70, description: 'Nota mínima para aprovação (0-100)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore: number;

  @ApiProperty({ example: 3, description: 'Número de tentativas permitidas' })
  @IsNumber()
  @Min(1)
  attemptsAllowed: number;
}
