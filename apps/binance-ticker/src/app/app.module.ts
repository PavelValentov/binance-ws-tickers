import { Module } from '@nestjs/common';
import { IntraModule } from '@exchanges/intra';
import { PrismaClientModule } from '@exchanges/prisma-client';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [IntraModule, PrismaClientModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
