import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class HeartbeatDto {
  @ApiProperty({ example: 'lesson-uuid' })
  @IsString()
  lessonId: string;

  @ApiProperty({ example: 120, description: 'Posição atual do vídeo em segundos' })
  @IsNumber()
  @Min(0)
  positionSec: number;

  @ApiProperty({ example: 5, description: 'Delta de segundos assistidos desde último heartbeat' })
  @IsNumber()
  @Min(0)
  watchedDeltaSec: number;
}
