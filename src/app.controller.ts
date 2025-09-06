import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { Role } from '@prisma/client';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/guards/roles.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getAdminData() {
    return { message: 'Welcome dear admin' };
  }

  @Get('if-logged')
  @UseGuards(JwtAuthGuard)
  getIfLogged() {
    return { message: 'You are logged in' };
  }

  @Get('quit')
  getGoodbye() {
    return this.appService.getGoodbye();
  }
}
