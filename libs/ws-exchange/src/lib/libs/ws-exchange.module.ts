import { Module } from '@nestjs/common';
import { BinanceService } from './exchanges/binance.service';
import { IntraModule } from '@exchanges/intra';

@Module({
  imports: [IntraModule],
  providers: [BinanceService],
  exports: [BinanceService],
})
export class LibsWsExchangeModule {}
