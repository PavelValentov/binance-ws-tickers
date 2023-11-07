import { Injectable } from '@nestjs/common';
import { REDIS_ENTITY_TYPE, Ticker, TickerType } from '@exchanges/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisExchangeService extends RedisService {
  getExchangeKey(exchangeId: string): string {
    return `${REDIS_ENTITY_TYPE.TICKER}:${exchangeId}`;
  }

  async getTicker(exchangeId: string, synonym: string): Promise<Ticker | null> {
    const tickerHash = await this.getHashValue(
      `${REDIS_ENTITY_TYPE.TICKER}:${exchangeId}`,
      synonym,
    );

    return tickerHash ? JSON.parse(tickerHash) : null;
  }

  async setTickers(exchangeId: string, tickers: TickerType): Promise<void> {
    const saveTickers = {} as Record<string, string>;
    for (const symbol of Object.keys(tickers)) {
      saveTickers[symbol] = JSON.stringify(tickers[symbol]);
    }

    return this.setHash(this.getExchangeKey(exchangeId), saveTickers);
  }

  async setTicker(ticker: Ticker): Promise<void> {
    return this.setHash(this.getExchangeKey(ticker.exchangeId), {
      [ticker.symbol]: JSON.stringify(ticker),
    });
  }

  async deleteTicker(exchangeId: string, symbol: string): Promise<void> {
    return this.deleteHashValue(`${this.getExchangeKey(exchangeId)}`, symbol);
  }
}
