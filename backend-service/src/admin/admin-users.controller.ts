import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserAuthService } from '../user-auth/user-auth.service';

class AdminChangePasswordDto {
  @ApiProperty({ description: 'Noua parolă (minim 6 caractere)' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'superadmin')
@Controller('admin/users-api')
export class AdminUsersController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Get()
  @ApiOperation({ summary: 'Lista tuturor utilizatorilor cu numărul de comenzi' })
  getAllUsers() {
    return this.userAuthService.adminGetAllUsers();
  }

  @Patch(':id/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Schimbă parola unui utilizator' })
  changePassword(
    @Param('id') id: string,
    @Body() dto: AdminChangePasswordDto,
  ) {
    return this.userAuthService.adminChangePassword(id, dto.newPassword);
  }

  @Patch(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activează sau dezactivează contul unui utilizator' })
  toggleActive(@Param('id') id: string) {
    return this.userAuthService.adminToggleActive(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Șterge contul unui utilizator' })
  deleteUser(@Param('id') id: string) {
    return this.userAuthService.adminDeleteUser(id);
  }
}
