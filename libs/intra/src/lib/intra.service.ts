import { Global, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  API_METHODS,
  INTRA_CLIENT,
  MICRO_SERVICE,
  RPC_PAYLOAD,
  RPC_RESPONSE,
  Ticker,
} from '@exchanges/common';

@Global()
@Injectable()
export class IntraAPIService {
  constructor(@Inject(INTRA_CLIENT) private readonly rpc: ClientProxy) {}

  async get<TResult, TInput>(
    method: string,
    data: RPC_PAYLOAD<TInput>,
  ): Promise<TResult | null> {
    const service: MICRO_SERVICE = method.split('.')?.[0] as MICRO_SERVICE;
    if (!service) {
      Logger.error(`No service found for ${method}`, 'IntraAPIService.get');
    }

    return firstValueFrom<TResult>(
      this.rpc.send<TResult, RPC_PAYLOAD<TInput>>(method, data),
    ).catch((err) => {
      Logger.error(
        `"${method}" error ${err.message}: ${JSON.stringify(data || {})}`,
        'IntraAPIService.get',
      );
      return null;
    });
  }

  async call<TResult, TInput>(
    method: string,
    data: RPC_PAYLOAD<TInput>,
  ): Promise<RPC_RESPONSE<TResult>> {
    const service: MICRO_SERVICE = method.split('.')?.[0] as MICRO_SERVICE;
    if (!service) {
      Logger.error(`No service found for ${method}`, 'IntraAPIService.call');
    }

    return firstValueFrom<RPC_RESPONSE<TResult>>(
      this.rpc.send<RPC_RESPONSE<TResult>, RPC_PAYLOAD<TInput>>(method, data),
    ).catch((err) => {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: err.message,
        message: `"${method}" for ${JSON.stringify(data || {})}`,
      };
    });
  }

  async emit<TInput>(method: string, data: RPC_PAYLOAD<TInput>): Promise<void> {
    const service: MICRO_SERVICE = method.split('.')?.[0] as MICRO_SERVICE;
    if (!service) {
      Logger.error(`No service found for ${method}`, 'IntraAPIService.emit');
    }

    this.rpc.emit<void, RPC_PAYLOAD<TInput>>(method, data);
  }

  // *** CUSTOM RPC CALLS ***

  async saveTickers(tickers: Ticker[]): Promise<void> {
    await this.emit<{ tickers: Ticker[] }>(
      API_METHODS[MICRO_SERVICE.TICKER].saveTicker,
      {
        tickers,
        lockId: API_METHODS[MICRO_SERVICE.TICKER].saveTicker,
      },
    );
  }

  async addSymbol(data: {
    symbol: string;
    exchangeId: string;
  }): Promise<string[] | null> {
    return this.get<
      string[],
      {
        symbol: string;
        exchangeId: string;
      }
    >(API_METHODS[MICRO_SERVICE.TICKER].addSymbol, {
      ...data,
      lockId: API_METHODS[MICRO_SERVICE.TICKER].addSymbol,
    });
  }

  async deleteSymbol(data: {
    symbol: string;
    exchangeId: string;
  }): Promise<string[] | null> {
    return this.get<
      string[],
      {
        symbol: string;
        exchangeId: string;
      }
    >(API_METHODS[MICRO_SERVICE.TICKER].deleteSymbol, {
      ...data,
      lockId: API_METHODS[MICRO_SERVICE.TICKER].deleteSymbol,
    });
  }
}
