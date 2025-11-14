import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, IsNumber, Min } from 'class-validator';
import { QuestionType } from '@prisma/client';

export class CreateQuestionDto {
  @ApiProperty({ enum: QuestionType, example: QuestionType.SINGLE_CHOICE })
  @IsEnum(QuestionType)
  type: QuestionType;

  @ApiProperty({
    example: 'Qual é a velocidade máxima permitida em vias urbanas?',
  })
  @IsString()
  statement: string;

  @ApiProperty({
    example: ['60 km/h', '80 km/h', '40 km/h', '50 km/h'],
    description: 'Opções de resposta',
  })
  @IsArray()
  @IsString({ each: true })
  options: string[];

  @ApiProperty({
    example: ['60 km/h'],
    description: 'Respostas corretas (array de strings)',
  })
  @IsArray()
  @IsString({ each: true })
  answerKey: string[];

  @ApiProperty({ example: 1, description: 'Ordem da questão no quiz' })
  @IsNumber()
  @Min(1)
  order: number;
}
