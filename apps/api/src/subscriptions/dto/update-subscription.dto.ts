import { IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
}

export class UpdateSubscriptionDto {
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}
