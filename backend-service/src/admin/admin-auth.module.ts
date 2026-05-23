import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { AdminSeedService } from './seed.service';
import { AdminPingController } from './admin-ping.controller';
import { AdminEntity } from './admin.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminEntity]),
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ADMIN_JWT_SECRET', 'change_me'),
        signOptions: {
          expiresIn: config.get('ADMIN_JWT_EXPIRES_IN', '1h'),
        },
      }),
    }),
  ],
  controllers: [AdminAuthController, AdminPingController],
  providers: [AdminSeedService, AdminAuthService, JwtStrategy, RolesGuard],
})
export class AdminAuthModule {}
