import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAuditDto {
  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number = 10;

  @ApiProperty({ required: false, example: 'user-uuid' })
  @IsOptional()
  userId?: string;

  @ApiProperty({ required: false, example: 'Course' })
  @IsOptional()
  entity?: string;

  @ApiProperty({ required: false, example: 'COURSE_CREATED' })
  @IsOptional()
  action?: string;
}
