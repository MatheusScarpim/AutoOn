import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.INSTRUCTOR })
  @IsEnum(UserRole)
  role: UserRole;
}
