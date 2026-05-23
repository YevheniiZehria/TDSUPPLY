import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminAuthService } from './admin-auth.service';
import { LoginDto } from './dtos/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Admin, AdminUser } from './decorators/admin.decorator';

@ApiTags('admin')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.adminAuthService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('me')
  me(@Admin() admin: AdminUser) {
    return { email: admin.email, role: admin.role };
  }
}
