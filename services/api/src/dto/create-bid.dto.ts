import { IsUUID, IsNumber, Min, IsOptional, IsObject } from 'class-validator';

export class CreateBidDto {
  @IsUUID('4')
  tenderId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsObject()
  coiData?: Record<string, any>;
}
