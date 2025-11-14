import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PartDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  partNumber: number;

  @ApiProperty({
    example: '"abc123def456"',
    description: 'ETag retornado pelo provedor (ou blockId no Azure)',
    required: false,
  })
  @IsOptional()
  @IsString()
  etag?: string;

  @ApiProperty({
    example: 'MDAwMDAx',
    description: 'Identificador do bloco usado no Azure Blob Storage',
    required: false,
  })
  @IsOptional()
  @IsString()
  blockId?: string;
}

export class CompleteUploadDto {
  @ApiProperty({ type: [PartDto], description: 'Lista de partes do upload' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartDto)
  parts: PartDto[];
}
