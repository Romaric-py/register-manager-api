import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { MailModule } from './mail/mail.module';
import { CourseModule } from './course/course.module';
import { RegistrationModule } from './registration/registration.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { PrismaGeneralExceptionFilter } from './common/filters/prisma-general-exception.filter';
import { PaymentModule } from './payment/payment.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: parseInt(process.env.THROTTLER_SHORT_TTL || '60000'), // 1 minute par défaut
        limit: parseInt(process.env.THROTTLER_SHORT_LIMIT || '20'), // 20 requêtes par minute par défaut
      },
      {
        name: 'medium',
        ttl: parseInt(process.env.THROTTLER_MEDIUM_TTL || '600000'), // 10 minutes par défaut
        limit: parseInt(process.env.THROTTLER_MEDIUM_LIMIT || '40'), // 40 requêtes par 10 minutes par défaut
      },
    ]),
    AuthModule,
    UserModule,
    AdminModule,
    JwtModule,
    MailModule,
    CourseModule,
    RegistrationModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    /*{
      provide: APP_FILTER,
      useClass: PrismaExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaGeneralExceptionFilter,
    },*/
  ],
})
export class AppModule {}
