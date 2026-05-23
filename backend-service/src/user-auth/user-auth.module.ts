import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { PassportModule } from '@nestjs/passport';
import { UserJwtStrategy } from './user.strategy';
import { UserEntity } from './user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('USER_JWT_SECRET', 'change_me_user'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [UserAuthController],
  providers: [UserAuthService, UserJwtStrategy],
})
export class UserAuthModule {}
