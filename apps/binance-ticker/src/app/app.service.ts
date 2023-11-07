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
}
