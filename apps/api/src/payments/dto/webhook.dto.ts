import { IsString, IsObject } from 'class-validator';

export class WebhookDto {
  @IsString()
  provider: string;

  @IsObject()
  payload: any;
}
