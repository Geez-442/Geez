import { Type } from 'class-transformer';
import { IsString, IsEnum, IsOptional, IsNumber, Min, IsDate } from 'class-validator';
import { TenderType } from '../tender/tender.entity';

export class CreateTenderDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TenderType)
  tenderType!: TenderType;

  @IsString()
  procuringEntity!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  deadline?: Date;
}
