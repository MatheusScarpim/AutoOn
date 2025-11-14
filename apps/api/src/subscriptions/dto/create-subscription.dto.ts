import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  userId: string;

  @IsString()
  planId: string;

  @IsString()
  @IsOptional()
  planName?: string;

  @IsNumber()
  @IsOptional()
  planPrice?: number;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}
