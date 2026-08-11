import { IsObject } from 'class-validator';

export class SealBidDto {
  @IsObject()
  coiDeclaration!: Record<string, any>;
}
