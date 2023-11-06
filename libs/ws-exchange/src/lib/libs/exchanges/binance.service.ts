import { Injectable, Logger } from '@nestjs/common';
import { connection } from 'websocket';
import * as ccxt from 'ccxt';
import { RedisExchangeService } from '@exchanges/redis';
import { ExchangeMessageType } from '@exchanges/common';
import { ExchangeWsService } from '../ws-exchange.service';

@Injectable()
export class BinanceService extends ExchangeWsService {
  constructor(protected override readonly redis: RedisExchangeService) {
    super(redis);

    this.exchangeId = 'binance';
    this.socketAddress = 'wss://stream.binance.com:9443/ws';
  }

  override async onAfterConnect(
    connection: connection,
    books?: string[],
  ): Promise<void> {
    if (!books) {
      this.sendCommand(connection, {
        id: Date.now(),
        method: 'SUBSCRIBE',
        params: ['!ticker@arr'],
      });

      const books = Object.values(this.symbols).sort();

      const splitBooks: string[][] = [];
      const chunkSize = 120;

      for (let i = 0; i < books.length; i += chunkSize) {
        splitBooks.push(books.slice(i, i + chunkSize) as string[]);
      }

      // remove the first chunk
      const chunk = splitBooks.shift();
      if (!chunk) {
        return;
      }

      if (!splitBooks.length) {
        return;
      }

      for (const books of splitBooks) {
        this.addNewConnection(books);
      }
    } else {
      Logger.debug(
        `[${this.exchangeId}] Subscribing to candles`,
        books.length,
        'Binance.onAfterConnect',
      );
      this.sendCommand(connection, {
        id: Date.now(),
        method: 'SUBSCRIBE',
        params: books.map((book) => `${book.toLowerCase()}@kline_1m`),
      });
    }
  }

  override async onBootstrap() {
    // abstract method
  }

  override async updateMarkets(): Promise<boolean> {
    const exchange: any = new ccxt['binance']({
      enableRateLimit: true,
      verbose: false,
      options: { defaultType: 'spot' },
    });

    this.markets = await exchange.loadMarkets(false);

    for (const market of Object.values(this.markets)) {
      this.symbols[market.id] = market.symbol;
    }

    return true;
  }

  override async onCustomMessage(
    message: any,
    connection: connection,
  ): Promise<{
    exchangeId: string;
    type: ExchangeMessageType;
    symbol?: string;
    data?: any;
  }> {
    if (
      Array.isArray(message) &&
      message.length &&
      message[0]?.e === '24hrTicker'
    ) {
      const tickers = [];
      for (const ticker of message) {
        if (!ticker.a || !ticker.b) {
          continue;
        }

        const synonym = ticker.s;
        const symbol = this.symbols[ticker.s];

        if (!symbol) {
          continue;
        }

        // const timestamp = +ticker.E || Date.now();
        const timestamp = Date.now();
        if (this.tickers[symbol]?.time || 0 <= +ticker.E || 0) {
          this.tickers[symbol] = {
            exchangeId: this.exchangeId,
            symbol,
            synonym,
            time: timestamp,
            bid: +ticker.b || 0,
            bidVolume: +ticker.B || 0,
            ask: +ticker.a || 0,
            askVolume: +ticker.A || 0,
            close: +ticker.c || 0,
          };

          tickers.push(this.tickers[symbol]);
        }
      }

      return {
        exchangeId: this.exchangeId,
        type: ExchangeMessageType.Ticker,
        data: tickers,
      };
    }

    if (message.result === null && message.id) {
      return { exchangeId: this.exchangeId, type: ExchangeMessageType.Welcome };
    }

    Logger.debug(
      `[${this.exchangeId}] Unknown message: ${JSON.stringify(message)}`,
      'Binance.onMessage',
    );
    return { exchangeId: this.exchangeId, type: ExchangeMessageType.Unknown };
  }
}
