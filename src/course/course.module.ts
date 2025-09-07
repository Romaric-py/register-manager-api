import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaService } from '../prisma.service';
import { PaginationService } from '../pagination.service';
import { JwtModule } from '../jwt/jwt.module';

@Module({
  imports: [JwtModule],
  controllers: [CourseController],
  providers: [CourseService, PrismaService, PaginationService],
  exports: [CourseService],
})
export class CourseModule {}
