import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;
}

class DeliveryAddressDto {
  @ApiProperty({ description: 'Strada și numărul (ex: Str. Clinicilor, Nr. 12)' })
  @IsString()
  @IsNotEmpty({ message: 'Strada și numărul sunt obligatorii.' })
  @MinLength(5, { message: 'Strada trebuie să aibă cel puțin 5 caractere.' })
  @MaxLength(200, { message: 'Strada nu poate depăși 200 de caractere.' })
  strada: string;

  @ApiPropertyOptional({ description: 'Bloc, Scară, Apartament (opțional)' })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Câmpul Bloc/Ap nu poate depăși 100 de caractere.' })
  bloc?: string;

  @ApiProperty({ description: 'Orașul de livrare (ex: Cluj-Napoca)' })
  @IsString()
  @IsNotEmpty({ message: 'Orașul este obligatoriu.' })
  @MinLength(2, { message: 'Orașul trebuie să aibă cel puțin 2 caractere.' })
  @MaxLength(100, { message: 'Orașul nu poate depăși 100 de caractere.' })
  oras: string;

  @ApiProperty({ description: 'Județul de livrare (ex: Cluj)' })
  @IsString()
  @IsNotEmpty({ message: 'Județul este obligatoriu.' })
  @MinLength(2, { message: 'Județul trebuie să aibă cel puțin 2 caractere.' })
  @MaxLength(50, { message: 'Județul nu poate depăși 50 de caractere.' })
  judet: string;

  @ApiProperty({ description: 'Codul poștal (6 cifre pentru România, ex: 400000)' })
  @IsString()
  @IsNotEmpty({ message: 'Codul poștal este obligatoriu.' })
  @Matches(/^\d{6}$/, {
    message: 'Codul poștal trebuie să conțină exact 6 cifre (ex: 400000).',
  })
  codPostal: string;

  @ApiPropertyOptional({ description: 'Observații sau instrucțiuni de livrare (opțional)' })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Observațiile nu pot depăși 500 de caractere.' })
  observatii?: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ type: DeliveryAddressDto })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress: DeliveryAddressDto;
}
