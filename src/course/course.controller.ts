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
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GetCoursesDto } from './dto/get-courses.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { Role } from '@prisma/client';

@Controller('course')
@Roles(Role.SUPER_ADMIN) // Seul(s) le(s) SUPER_ADMIN peut(vent) accéder à ce contrôleur
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.courseService.create(createCourseDto);
  }

  @Get()
  async findMany(@Query() filters: GetCoursesDto) {
    return this.courseService.findMany(filters);
  }

  @Get('stats')
  async getCourseStats() {
    return this.courseService.getCourseStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.courseService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.courseService.update(id, updateCourseDto);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.courseService.toggleActive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}
