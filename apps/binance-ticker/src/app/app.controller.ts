import { Controller, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  API_METHODS,
  MICRO_SERVICE,
  RPC_PAYLOAD,
  Ticker,
} from '@exchanges/common';
import { BalancerGuard, BalancerInterceptor } from '@exchanges/intra';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly service: AppService) {}

  @UseInterceptors(BalancerInterceptor)
  @MessagePattern(API_METHODS[MICRO_SERVICE.TICKER].addSymbol)
  async addSymbol(
    @Payload()
    data: RPC_PAYLOAD<{
      symbol: string;
      exchangeId: string;
    }>,
  ): Promise<string[]> {
    const { symbol, exchangeId } = data;

    return this.service.addSymbol({ exchangeId, symbol });
  }

  @UseInterceptors(BalancerInterceptor)
  @MessagePattern(API_METHODS[MICRO_SERVICE.TICKER].deleteSymbol)
  async deleteSymbol(
    @Payload()
    data: RPC_PAYLOAD<{
      symbol: string;
      exchangeId: string;
    }>,
  ): Promise<string[]> {
    const { symbol, exchangeId } = data;

    return this.service.deleteSymbol({ exchangeId, symbol });
  }

  @UseGuards(BalancerGuard)
  @EventPattern(API_METHODS[MICRO_SERVICE.TICKER].saveTicker)
  async saveTicker(@Payload() ticker: RPC_PAYLOAD<Ticker>): Promise<void> {
    await this.service.saveTicker(ticker);
  }
}
