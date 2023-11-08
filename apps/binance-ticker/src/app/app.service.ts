import { Injectable } from '@nestjs/common';
import { RedisExchangeService } from '@exchanges/redis';
import { Ticker, TickerType } from '@exchanges/common';
import { PrismaService } from '@exchanges/prisma-client';

@Injectable()
export class AppService {
  constructor(
    private readonly redisTicker: RedisExchangeService,
    private readonly prisma: PrismaService,
  ) {}

  async saveTicker(ticker: Ticker): Promise<void> {
    await this.redisTicker.setTicker(ticker);

    await this.prisma.saveTicker(ticker);
  }

  async saveTickers(data: {
    exchangeId: string;
    tickers: Ticker[];
  }): Promise<void> {
    const hash = data.tickers.reduce((acc, ticker) => {
      acc[ticker.symbol] = ticker;
      return acc;
    }, {} as TickerType);

    await this.redisTicker.setTickers(data.exchangeId, hash);

    await Promise.all([
      ...data.tickers.map((ticker) => this.saveTicker(ticker)),
    ]);
  }

  async addAllowedSymbols(data: {
    exchangeId: string;
    symbols: string[];
  }): Promise<string[] | string> {
    if (!data.exchangeId) {
      return 'No exchangeId provided';
    }
    if (!data.symbols?.length) {
      return `No symbols to add for exchange ${data.exchangeId}`;
    }

    await this.prisma.addExchange(data.exchangeId);
    await this.prisma.addSymbols(data.symbols);

    return this.getAllowedSymbols();
  }

  async deleteAllowedSymbol(data: {
    symbol: string;
    exchangeId: string;
  }): Promise<string[] | string> {
    await this.prisma.removeSymbols(data.symbol);

    return this.getAllowedSymbols();
  }

  async getAllowedSymbols(): Promise<string[]> {
    return this.prisma.getSymbols();
  }
}
