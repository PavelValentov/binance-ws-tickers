import { Injectable } from '@nestjs/common';
import { REDIS_ENTITY_TYPE, Ticker, TickerType } from '@exchanges/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisExchangeService extends RedisService {
  // *** EXCHANGES ***

  async addExchange(exchangeId: string): Promise<void> {
    return this.pushMembers(REDIS_ENTITY_TYPE.EXCHANGE, [exchangeId]);
  }

  async removeExchange(exchangeId: string): Promise<void> {
    return this.deleteMembers(REDIS_ENTITY_TYPE.EXCHANGE, [exchangeId]);
  }

  async getExchanges(): Promise<string[]> {
    return this.getMembers(REDIS_ENTITY_TYPE.EXCHANGE);
  }

  // *** SYMBOLS ***

  getSymbolKey(exchangeId: string): string {
    return `${REDIS_ENTITY_TYPE.SYMBOL}:${exchangeId}`;
  }

  async addSymbols(exchangeId: string, symbols: string[]): Promise<void> {
    return this.pushMembers(this.getSymbolKey(exchangeId), symbols);
  }

  async removeSymbols(exchangeId: string, symbols: string[]): Promise<void> {
    return this.deleteMembers(this.getSymbolKey(exchangeId), symbols);
  }

  async getSymbols(exchangeId: string): Promise<string[]> {
    return this.getMembers(this.getSymbolKey(exchangeId));
  }

  // *** TICKERS ***
  getTickerKey(exchangeId: string): string {
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

    return this.setHash(this.getTickerKey(exchangeId), saveTickers);
  }

  async setTicker(ticker: Ticker): Promise<void> {
    return this.setHash(this.getTickerKey(ticker.exchangeId), {
      [ticker.symbol]: JSON.stringify(ticker),
    });
  }

  async deleteTicker(exchangeId: string, symbol: string): Promise<void> {
    return this.deleteHashValue(`${this.getTickerKey(exchangeId)}`, symbol);
  }
}
