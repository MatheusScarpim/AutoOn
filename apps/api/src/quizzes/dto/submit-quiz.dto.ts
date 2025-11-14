import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @ApiProperty({ example: 'question-uuid' })
  questionId: string;

  @ApiProperty({ example: ['60 km/h'], description: 'Respostas selecionadas' })
  answers: string[];
}

export class SubmitQuizDto {
  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
