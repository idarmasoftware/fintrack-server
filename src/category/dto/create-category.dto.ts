import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TransactionType } from '../../transaction/enums/transaction-type.enum';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType; // INCOME atau EXPENSE

  @IsOptional()
  @IsString()
  icon?: string;
}
