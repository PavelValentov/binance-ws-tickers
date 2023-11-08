import { Injectable, Logger } from '@nestjs/common';
import { connection } from 'websocket';
import * as ccxt from 'ccxt';
import { Exchange } from 'ccxt';
import { RedisExchangeService } from '@exchanges/redis';
import { ExchangeMessageType } from '@exchanges/common';
import { ExchangeWsService } from '../ws-exchange.service';
import { PrismaService } from '@exchanges/prisma-client';
import { IntraAPIService } from '@exchanges/intra';

@Injectable()
export class BinanceService extends ExchangeWsService {
  private ccxt: Exchange;

  constructor(
    protected override readonly redis: RedisExchangeService,
    protected override readonly prisma: PrismaService,
    protected override readonly intra: IntraAPIService,
  ) {
    super(redis, prisma, intra);

    this.exchangeId = 'binance';
    this.socketAddress = 'wss://stream.binance.com:9443/ws';
  }

  override async onAfterConnect(
    connection: connection,
    books?: string[],
  ): Promise<void> {
    this.sendCommand(connection, {
      id: Date.now(),
      method: 'SUBSCRIBE',
      params: ['!ticker@arr'],
    });
  }

  override async onBootstrap() {
    // after updateMarkets(), before addNewConnection() call
  }

  override async updateMarkets(): Promise<boolean> {
    try {
      if (!this.ccxt) {
        // it needs cuz every time we create a new instance of ccxt, it fetches markets
        this.ccxt = new ccxt['binance']({
          enableRateLimit: true,
          verbose: false,
          options: { defaultType: 'spot' },
        });
      }

      this.markets = await this.ccxt.loadMarkets(false);

      for (const market of Object.values(this.markets)) {
        this.symbols[market.id] = market.symbol;
      }

      return true;
    } catch (e: any) {
      Logger.error(
        `[${this.exchangeId}] ${e.message}`,
        'Binance.updateMarkets',
      );
      return false;
    }
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
      const allowed = await this.getAllowSymbols();
      if (!allowed?.length) {
        return {
          exchangeId: this.exchangeId,
          type: ExchangeMessageType.Ticker,
        };
      }

      const tickers = [];

      for (const ticker of message) {
        if (!ticker.a || !ticker.b) {
          continue;
        }

        const synonym = ticker.s;
        const symbol = this.symbols[ticker.s];

        if (!symbol || !allowed.includes(symbol)) {
          continue;
        }

        // const timestamp = +ticker.E || Date.now();
        const timestamp = +ticker?.E;
        if (timestamp) {
          tickers.push({
            exchangeId: this.exchangeId,
            symbol,
            synonym,
            time: timestamp,
            bid: +ticker.b || 0,
            bidVolume: +ticker.B || 0,
            ask: +ticker.a || 0,
            askVolume: +ticker.A || 0,
            close: +ticker.c || 0,
          });
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
