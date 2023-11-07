import { Module } from '@nestjs/common';
import { IntraModule } from '@exchanges/intra';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [IntraModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
