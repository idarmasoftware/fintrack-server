import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  name: string; // Contoh: "BCA", "Dompet Tunai"

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  balance: number; // Saldo awal, misal: 1000000
}
