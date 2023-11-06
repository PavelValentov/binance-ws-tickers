import { Module } from '@nestjs/common';
import {BinanceService} from "./exchanges/binance.service";

@Module({
  controllers: [],
  providers: [BinanceService],
  exports: [BinanceService],
})
export class LibsWsExchangeModule {

}
