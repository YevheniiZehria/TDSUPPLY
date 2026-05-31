import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Query, UseGuards, BadRequestException, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsInt, Min, Max, Matches } from 'class-validator';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { UserJwtGuard } from './user-jwt.guard';
import { UserAuthService } from './user-auth.service';

class UserLoginDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(6) password: string;
  @ApiProperty({ required: false }) @IsString() captchaToken?: string;
}

class UserRegisterDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() @MinLength(6) password: string;
  @ApiProperty() @IsString() name: string;

  @ApiProperty({ required: false, description: 'Număr de telefon în format internațional (ex: +40712345678)' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{9,14}$/, { message: 'Numărul de telefon trebuie să conțină între 10 și 15 cifre (ex: +40712345678).' })
  phone?: string;

  @ApiProperty({ required: false, description: 'Data de naștere (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data de naștere trebuie să fie în formatul YYYY-MM-DD.' })
  birthDate?: string;

  @ApiProperty({ required: false, description: 'Țara de origine' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Țara trebuie să aibă cel puțin 2 caractere.' })
  country?: string;

  @ApiProperty({ required: false }) @IsOptional() @IsString() captchaToken?: string;
}

class ForgotPasswordDto {
  @ApiProperty() @IsEmail() email: string;
}

class ResendVerificationDto {
  @ApiProperty() @IsEmail() email: string;
}

class ResetPasswordDto {
  @ApiProperty() @IsString() token: string;
  @ApiProperty() @IsString() @MinLength(6) password: string;
}

@ApiTags('user-auth')
@Controller('auth')
export class UserAuthController {
  private readonly logger = new Logger(UserAuthController.name);

  constructor(
    private readonly userAuthService: UserAuthService,
    private readonly config: ConfigService,
  ) {}

  private async verifyTurnstile(token: string, remoteip?: string): Promise<boolean> {
    const secret = this.config.get<string>('TURNSTILE_SECRET');
    if (!secret || secret === 'xxxx') {
      this.logger.warn('Turnstile secret nu este configurat în .env, se omite verificarea.');
      return true;
    }

    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}${remoteip ? `&remoteip=${encodeURIComponent(remoteip)}` : ''}`,
      });
      const data = await response.json() as any;
      return !!data.success;
    } catch (error) {
      this.logger.error('Eroare verificare Turnstile:', error);
      return false;
    }
  }

  @Post('login')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login utilizator B2B' })
  async login(@Body() dto: UserLoginDto, @Req() req: any) {
    const ip = req.ip || req.headers['x-forwarded-for'];
    const isHuman = await this.verifyTurnstile(dto.captchaToken || '', ip);
    if (!isHuman) {
      throw new BadRequestException('Validarea anti-robot (captcha) a eșuat. Vă rugăm să reîncercați.');
    }
    return this.userAuthService.login(dto.email, dto.password);
  }

  @Post('register')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Înregistrare utilizator B2B' })
  async register(@Body() dto: UserRegisterDto, @Req() req: any) {
    const ip = req.ip || req.headers['x-forwarded-for'];
    const isHuman = await this.verifyTurnstile(dto.captchaToken || '', ip);
    if (!isHuman) {
      throw new BadRequestException('Validarea anti-robot (captcha) a eșuat. Vă rugăm să reîncercați.');
    }
    return this.userAuthService.register(dto.email, dto.password, dto.name, dto.phone, dto.birthDate, dto.country);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Confirmare email cu token' })
  async verifyEmail(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token-ul este obligatoriu.');
    return this.userAuthService.verifyEmail(token);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Retrimite email de confirmare cont' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.userAuthService.resendVerificationEmail(dto.email);
  }

  @Post('forgot-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicită resetare parolă' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.userAuthService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resetează parola folosind token-ul primit' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.userAuthService.resetPassword(dto.token, dto.password);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(UserJwtGuard)
  @ApiOperation({ summary: 'Date utilizator curent' })
  me(@Req() req: { user: { sub: string; email: string; name: string; role: string } }) {
    return req.user;
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistici utilizatori (total, recenți)' })
  stats() {
    return this.userAuthService.getStats();
  }
}
