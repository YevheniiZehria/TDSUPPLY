import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../admin/jwt-auth.guard';
import { RolesGuard } from '../admin/roles.guard';
import { Roles } from '../admin/decorators/roles.decorator';

class UpdateSettingsDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() address?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() workingHours?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() facebookUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() instagramUrl?: string;
}

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Obține setările globale ale site-ului' })
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Put()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Actualizează setările globale ale site-ului (Admin)' })
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }
}
