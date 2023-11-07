import { Injectable } from '@nestjs/common';
import { RedisExchangeService } from '@exchanges/redis';
import { Ticker } from '@exchanges/common';
import { PrismaService } from '@exchanges/prisma-client';

@Injectable()
export class AppService {
  constructor(
    private readonly redisTicker: RedisExchangeService,
    private readonly prisma: PrismaService,
  ) {}

  async saveTicker(ticker: Ticker): Promise<boolean> {
    await this.redisTicker.setTicker(ticker);

    return;
  }

  async addSymbol(data: {
    exchangeId: string;
    symbol: string;
  }): Promise<string[] | string> {
    await this.redisTicker.addExchange(data.exchangeId);

    await this.redisTicker.addSymbols(data.exchangeId, [data.symbol]);

    return this.redisTicker.getSymbols(data.exchangeId);
  }

  async deleteSymbol(data: {
    symbol: string;
    exchangeId: string;
  }): Promise<string[] | string> {
    await this.redisTicker.removeSymbols(data.exchangeId, [data.symbol]);

    return this.redisTicker.getSymbols(data.exchangeId);
  }
}
