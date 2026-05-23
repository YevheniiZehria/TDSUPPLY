import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
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
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  strada: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bloc?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  oras: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  judet: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  codPostal: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
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
