import { IsUUID, IsString, MinLength } from 'class-validator';

export class AwardTenderDto {
  @IsUUID('4')
  awardedBidId!: string;

  @IsString()
  @MinLength(3)
  awardDecisionNote!: string;
}
