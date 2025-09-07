import { Global, Module } from '@nestjs/common';
import { TokensService } from '../auth/services/tokens.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtService } from './jwt.service';
import { PrismaService } from '../prisma.service';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';

@Global()
@Module({
  imports: [
    NestJwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { 
          expiresIn: process.env.JWT_EXPIRES_IN || '15m' 
        },
      }),
    }),
  ],
  providers: [JwtService, JwtStrategy, TokensService, PrismaService],
  exports: [JwtService, JwtStrategy, TokensService],
})
export class JwtModule {}
