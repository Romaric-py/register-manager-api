import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { CreateRegistrationDto, CreateRegistrationOneForManyDto, CreateRegistrationManyForOneDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { Roles } from '../auth/guards/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetRegistrationsDto } from './dto/get-registrations.dto';

@Controller('registration')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Post()
  create(@Body() createRegistrationDto: CreateRegistrationDto) {
    return this.registrationService.create(createRegistrationDto);
  }

  @Post('many-for-one') // Inscrire un utilisateur à plusieurs cours
  createManyForOne(@Body() createRegistrationsDto: CreateRegistrationManyForOneDto) {
    return this.registrationService.createManyForOne(createRegistrationsDto);
  }

  @Post('one-for-many') // Inscrire plusieurs utilisateurs à un cours
  createOneForMany(@Body() createRegistrationDtos: CreateRegistrationOneForManyDto) {
    return this.registrationService.createOneForMany(createRegistrationDtos);
  }

  @Get()
  findAll(@Query() query: GetRegistrationsDto) {
    return this.registrationService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registrationService.findOne(id);
  }

  // c'est un non sens de modifier une inscription, on pourrait juste permettre de changer son statut
  // mais pour l'instant on laisse cette route
  @Roles(Role.SUPER_ADMIN, Role.ADMIN) // Seul(s) le(s) SUPER_ADMIN et ADMIN peut(vent) modifier une inscription
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRegistrationDto: UpdateRegistrationDto) {
    return this.registrationService.update(id, updateRegistrationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.registrationService.remove(id);
  }
}
