import {
  Controller,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  API_METHODS,
  MICRO_SERVICE,
  RPC_PAYLOAD,
  RPC_RESPONSE,
  Ticker,
} from '@exchanges/common';
import { BalancerGuard, BalancerInterceptor } from '@exchanges/intra';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly service: AppService) {}

  @UseInterceptors(BalancerInterceptor)
  @MessagePattern(API_METHODS[MICRO_SERVICE.TICKER].getSymbols)
  async getSymbols(): Promise<RPC_RESPONSE<string[]>> {
    return {
      statusCode: HttpStatus.OK,
      data: await this.service.getSymbols(),
    };
  }

  @UseInterceptors(BalancerInterceptor)
  @MessagePattern(API_METHODS[MICRO_SERVICE.TICKER].addSymbol)
  async addSymbol(
    @Payload()
    data: RPC_PAYLOAD<{
      symbol: string;
      exchangeId: string;
    }>,
  ): Promise<RPC_RESPONSE<string[]>> {
    const { symbol, exchangeId } = data;

    const res = await this.service.addAllowedSymbols({
      exchangeId,
      symbols: [symbol],
    });

    if (typeof res === 'string') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: res,
        message: `Error adding symbol ${symbol} to ${exchangeId} exchange`,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  @UseInterceptors(BalancerInterceptor)
  @MessagePattern(API_METHODS[MICRO_SERVICE.TICKER].deleteSymbol)
  async deleteSymbol(
    @Payload()
    data: RPC_PAYLOAD<{
      symbol: string;
      exchangeId: string;
    }>,
  ): Promise<RPC_RESPONSE<string[]>> {
    const { symbol, exchangeId } = data;

    const res = await this.service.deleteAllowedSymbol({ exchangeId, symbol });

    if (typeof res === 'string') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: res,
        message: `Error deleting symbol ${symbol} from ${exchangeId} exchange`,
      };
    }

    return {
      statusCode: HttpStatus.OK,
      data: res,
    };
  }

  @UseGuards(BalancerGuard)
  @EventPattern(API_METHODS[MICRO_SERVICE.TICKER].saveTicker)
  async saveTicker(@Payload() data: { ticker: Ticker }): Promise<void> {
    await this.service.saveTicker(data.ticker);
  }

  @UseGuards(BalancerGuard)
  @EventPattern(API_METHODS[MICRO_SERVICE.TICKER].saveTickers)
  async saveTickers(
    @Payload() data: { exchangeId: string; tickers: Ticker[] },
  ): Promise<void> {
    await this.service.saveTickers(data);
  }
}
