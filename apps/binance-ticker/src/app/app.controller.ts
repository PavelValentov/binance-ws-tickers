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
  @MessagePattern(API_METHODS[MICRO_SERVICE.TICKER].addSymbol)
  async addSymbol(
    @Payload()
    data: RPC_PAYLOAD<{
      symbol: string;
      exchangeId: string;
    }>,
  ): Promise<RPC_RESPONSE<string[]>> {
    const { symbol, exchangeId } = data;

    const res = await this.service.addSymbol({ exchangeId, symbol });

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

    const res = await this.service.deleteSymbol({ exchangeId, symbol });

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
  async saveTicker(@Payload() ticker: RPC_PAYLOAD<Ticker>): Promise<void> {
    await this.service.saveTicker(ticker);
  }
}
