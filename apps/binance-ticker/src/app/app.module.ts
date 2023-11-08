import { Module } from '@nestjs/common';
import { LibsWsExchangeModule } from '@exchanges/ws-exchange';
import { PrismaClientModule } from '@exchanges/prisma-client';
import { IntraModule } from '@exchanges/intra';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [IntraModule, PrismaClientModule, LibsWsExchangeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
