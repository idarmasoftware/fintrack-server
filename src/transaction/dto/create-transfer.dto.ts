import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateTransferDto {
    @IsNotEmpty()
    @IsUUID()
    source_account_id: string;

    @IsNotEmpty()
    @IsUUID()
    destination_account_id: string;

    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    amount: number;

    @IsOptional()
    @IsString()
    date?: string;

    @IsOptional()
    @IsString()
    description?: string;
}
