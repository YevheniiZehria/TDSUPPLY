import { IsString, ValidateNested, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CategoryNameDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ro: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  en: string;
}

export class CreateCategoryDto {
  @ApiProperty({ description: 'Numele categoriei bilingv' })
  @ValidateNested()
  @Type(() => CategoryNameDto)
  name: CategoryNameDto;
}

export class UpdateCategoryDto {
  @ApiProperty({ description: 'Numele categoriei bilingv' })
  @ValidateNested()
  @Type(() => CategoryNameDto)
  name: CategoryNameDto;
}
