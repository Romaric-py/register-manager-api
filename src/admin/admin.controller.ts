import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { PaginationService } from '../pagination.service';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../common/interfaces/request.interface';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly paginationService: PaginationService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const paginationOptions = this.paginationService.extractFromQuery({
      page,
      limit,
    });
    return this.adminService.findAll(paginationOptions, search);
  }

  @Get('stats')
  async getAdminStats() {
    return this.adminService.getAdminStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const admin = await this.adminService.findOne(id);
    if (!admin) {
      throw new NotFoundException('Administrateur non trouvé');
    }
    return admin;
  }

  @Post()
  async create(
    @Body() createAdminDto: CreateAdminDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return await this.adminService.create(createAdminDto, req.user.id);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        "Erreur lors de la création de l'administrateur",
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return await this.adminService.update(id, updateAdminDto, req.user.id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        "Erreur lors de la mise à jour de l'administrateur",
      );
    }
  }

  @Patch(':id/toggle-active')
  async toggleActive(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return await this.adminService.toggleActive(id, req.user.id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        "Erreur lors de la modification du statut de l'administrateur",
      );
    }
  }

  @Patch(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      return await this.adminService.resetAdminPassword(id, req.user.id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Erreur lors de la réinitialisation du mot de passe',
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      return await this.adminService.delete(id);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        "Erreur lors de la suppression de l'administrateur",
      );
    }
  }
}
