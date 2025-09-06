import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationService } from '../pagination.service';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../common/interfaces/request.interface';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly paginationService: PaginationService,
  ) {}

  @Get()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const paginationOptions = this.paginationService.extractFromQuery({
      page,
      limit,
    });
    return this.userService.findAll(paginationOptions, search);
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getUserStats() {
    return this.userService.getUserStats();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return await this.userService.update(id, updateUserDto, req.user.id);
    } catch {
      throw new BadRequestException(
        "Erreur lors de la mise à jour de l'utilisateur",
      );
    }
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async toggleActive(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return await this.userService.toggleActive(id, req.user.id);
    } catch {
      throw new BadRequestException(
        "Erreur lors de la modification du statut de l'utilisateur",
      );
    }
  }
}
