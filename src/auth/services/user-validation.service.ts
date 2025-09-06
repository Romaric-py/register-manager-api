import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class UserValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async retrieveUserByEmail(
    email: string,
    throwError = true,
  ): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user && throwError) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  safeTransform(user: User) {
    const { password, ...rest } = user;
    return rest;
  }
}
