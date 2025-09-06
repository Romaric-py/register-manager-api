import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): { message: string } {
    return { message: 'Data Scholar Hub wishes you welcome to the Register Manager API!' };
  }

  getGoodbye(): { message: string } {
    return { message: 'Thank you for using the Register Manager API!' };
  }
}
