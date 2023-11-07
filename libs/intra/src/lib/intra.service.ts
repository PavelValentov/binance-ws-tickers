import { Global, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  API_METHODS,
  CancelExchangeOrderBodyDto,
  ExchangeOrder,
  generateRandomString,
  GetExchangeOrderDto,
  MARKET_TYPE,
  MICRO_SERVICE,
  ORDER_EVENT,
} from '@angry-api/backend/common';
import { RedisHeartbeatService } from '@angry-api/backend/storage';
import {
  INTRA_CLIENT,
  RPC_PAYLOAD,
  RPC_RESPONSE,
} from '../../../common/src/lib/libs/interface/intra.interface';
import { removeCircularReferences } from '@exchanges/common';

@Global()
@Injectable()
export class IntraAPIService {
  constructor(
    @Inject(INTRA_CLIENT) private readonly rpc: ClientProxy,
    private readonly heartbeat: RedisHeartbeatService,
  ) {}

  async preparePayload<TInput>(
    service: MICRO_SERVICE,
    method: string,
    data: TInput,
    timeout: number = 60,
  ): Promise<RPC_PAYLOAD<TInput> | null> {
    const callId: string = `${method}:${generateRandomString()}`;

    // console.log('service', service, method, data);

    const activeInstance = await this.getActiveInstance(service);
    // if no instance available
    if (!activeInstance) {
      Logger.error(
        `No instance available for ${method}`,
        'IntraAPIService.preparePayload',
      );
      await this.releaseInstances(callId);

      return null;
    }

    await this.heartbeat.setCallId(callId, Date.now().toString(), timeout);

    return {
      ...removeCircularReferences(data),
      callId,
    };
  }

  async get<TResult, TInput>(method: string, data: TInput): Promise<TResult> {
    const service: MICRO_SERVICE = method.split('.')?.[0] as MICRO_SERVICE;
    if (!service) {
      Logger.error(`No service found for ${method}`, 'IntraAPIService.get');
    }

    const payload = await this.preparePayload(service, method, data);
    if (!payload) {
      return null;
    }

    return firstValueFrom<TResult>(
      this.rpc.send<TResult, RPC_PAYLOAD<TInput>>(method, payload),
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
    data: TInput,
  ): Promise<RPC_RESPONSE<TResult>> {
    const service: MICRO_SERVICE = method.split('.')?.[0] as MICRO_SERVICE;
    if (!service) {
      Logger.error(`No service found for ${method}`, 'IntraAPIService.call');
    }

    const payload = await this.preparePayload(service, method, data);
    if (!payload) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        error: `No instance available for ${method}`,
        message: `No instance available for ${method}`,
      };
    }

    return firstValueFrom<RPC_RESPONSE<TResult>>(
      this.rpc.send<RPC_RESPONSE<TResult>, RPC_PAYLOAD<TInput>>(
        method,
        payload,
      ),
    ).catch((err) => {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: err.message,
        message: `"${method}" for ${JSON.stringify(data || {})}`,
      };
    });
  }

  async emit<TInput>(method: string, data: TInput): Promise<void> {
    const service: MICRO_SERVICE = method.split('.')?.[0] as MICRO_SERVICE;
    if (!service) {
      Logger.error(`No service found for ${method}`, 'IntraAPIService.emit');
    }

    const payload = await this.preparePayload<TInput>(service, method, data, 8);
    if (!payload) {
      return;
    }

    this.rpc.emit<void, RPC_PAYLOAD<TInput>>(method, payload);
  }

  async getActiveInstance(type: MICRO_SERVICE): Promise<string | null> {
    const instance = await this.heartbeat.getActiveInstance(type);
    if (!instance) {
      return null;
    }

    await this.heartbeat.setNextRoundRobinIndex(type);

    return instance;
  }

  // *** CUSTOM RPC CALLS ***

  async addOrderEvent(event: ORDER_EVENT) {
    await this.emit<ORDER_EVENT>(
      API_METHODS[MICRO_SERVICE.BOOTSTRAP].addOrderEvent,
      event,
    );
  }

  async getExchangeOrder(data: {
    userId: string;
    symbol: string;
    exchangeId: string;
    marketType: MARKET_TYPE;
    orderId: string;
  }): Promise<ExchangeOrder> {
    const res = await this.call<ExchangeOrder, GetExchangeOrderDto>(
      API_METHODS[MICRO_SERVICE.EXCHANGE].getExchangeOrder,
      data,
    );

    return res.data;
  }

  async cancelLimitOrder(
    data: CancelExchangeOrderBodyDto,
  ): Promise<ExchangeOrder> {
    const res = await this.call<ExchangeOrder, CancelExchangeOrderBodyDto>(
      API_METHODS[MICRO_SERVICE.EXCHANGE].cancelLimitOrder,
      data,
    );

    return res.data;
  }
}
