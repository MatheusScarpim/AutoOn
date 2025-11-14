import { IsString, IsNumber, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum PaymentProvider {
  STRIPE = 'STRIPE',
  MERCADO_PAGO = 'MERCADO_PAGO',
}

export class CreatePaymentDto {
  @IsString()
  userId: string;

  @IsNumber()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
