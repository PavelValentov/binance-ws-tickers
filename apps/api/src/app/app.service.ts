import { Injectable } from '@nestjs/common';
import process from 'node:process';

@Injectable()
export class AppService {
  getData(): { message: string } {
    return { message: `Works: ${process.uptime().toString()}` };
  }
}
