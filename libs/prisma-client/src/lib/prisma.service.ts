import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Ticker } from '@exchanges/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async addExchange(
    exchange: string,
    returnExchanges?: boolean,
  ): Promise<string[]> {
    await this.exchange.upsert({
      where: { name: exchange },
      create: { name: exchange, disabled: false },
      update: { disabled: false },
    });

    return returnExchanges
      ? this.exchange
          .findMany({
            where: { disabled: false },
          })
          .then((exchanges) => exchanges?.map((e) => e.name) || [])
      : [];
  }

  async addSymbols(
    symbols: string[],
    returnSymbols?: boolean,
  ): Promise<string[]> {
    if (symbols?.length) {
      await Promise.all([
        ...symbols.map((symbol) =>
          this.symbol.upsert({
            where: { name: symbol },
            create: { name: symbol, disabled: false },
            update: { disabled: false },
          }),
        ),
      ]);
    }

    return returnSymbols
      ? this.symbol
          .findMany({
            where: { disabled: false },
          })
          .then((symbols) => symbols?.map((s) => s.name) || [])
      : [];
  }

  async getSymbols(): Promise<string[]> {
    return this.symbol
      .findMany({
        where: { disabled: false },
      })
      .then((symbols) => symbols?.map((s) => s.name) || []);
  }

  async saveTicker(ticker: Ticker): Promise<void> {
    if (isNaN(ticker?.time)) {
      Logger.error(`Ticker time is NaN: ${ticker?.time}`, 'saveTicker');
      return;
    }

    const time = new Date(ticker.time);

    // get existing ticker
    // Ticker.Symbol.symbolId joined with Symbol.name (symbolId)
    // Ticker.Exchange.exchangeId joined with Exchange.name (exchangeId)
    const existingTicker = await this.ticker.findFirst({
      where: {
        symbol: {
          name: ticker.symbol,
        },
        exchange: {
          name: ticker.exchangeId,
        },
        time,
      },
    });

    // if ticker exists, return
    if (existingTicker) {
      return;
    }

    // create ticker
    await this.ticker.create({
      data: {
        symbol: {
          connectOrCreate: {
            where: { name: ticker.symbol },
            create: { name: ticker.symbol },
          },
        },
        exchange: {
          connectOrCreate: {
            where: { name: ticker.exchangeId },
            create: { name: ticker.exchangeId },
          },
        },
        time,
        ask: ticker.ask,
        askVolume: ticker.askVolume,
        bid: ticker.bid,
        bidVolume: ticker.bidVolume,
        close: ticker.close,
      },
    });
  }
}
