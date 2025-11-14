import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min } from 'class-validator';

export class InitiateUploadDto {
  @ApiProperty({ example: 'aula-01.mp4', description: 'Nome do arquivo' })
  @IsString()
  fileName: string;

  @ApiProperty({ example: 524288000, description: 'Tamanho do arquivo em bytes' })
  @IsNumber()
  @Min(1)
  fileSize: number;

  @ApiProperty({ example: 'video/mp4', description: 'Content-Type do arquivo' })
  @IsString()
  contentType: string;
}
