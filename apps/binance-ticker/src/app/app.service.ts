import { Injectable } from '@nestjs/common';
import { RedisExchangeService } from '@exchanges/redis';
import { Ticker } from '@exchanges/common';

@Injectable()
export class AppService {
  constructor(
    private readonly redisTicker: RedisExchangeService, // private readonly prisma: PrismaService,
  ) {}

  async saveTicker(ticker: Ticker): Promise<boolean> {
    await this.redisTicker.setTicker(ticker);

    return;
  }

  async addSymbol(data: {
    symbol: string;
    exchangeId: string;
  }): Promise<string[]> {
    // add symbol to redis and prisma
    return [];
  }

  async deleteSymbol(data: {
    symbol: string;
    exchangeId: string;
  }): Promise<string[]> {
    // remove symbol from redis and prisma
    return [];
  }
}
