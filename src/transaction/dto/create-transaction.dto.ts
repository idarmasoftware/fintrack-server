import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNotEmpty()
  @IsUUID()
  account_id: string; // ID Dompet

  @IsNotEmpty()
  @IsUUID()
  category_id: string; // ID Kategori

  @IsOptional()
  @IsString()
  description?: string;
}
