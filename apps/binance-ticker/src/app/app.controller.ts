import { Controller, HttpStatus, UseInterceptors } from '@nestjs/common';
import {
  API_METHODS,
  MICRO_SERVICE,
  RPC_PAYLOAD,
  RPC_RESPONSE,
  Ticker,
} from '@exchanges/common';
import { BalancerInterceptor } from '@exchanges/intra';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly service: AppService) {}

  @UseInterceptors(BalancerInterceptor)
  @MessagePattern(API_METHODS[MICRO_SERVICE.TICKER].saveTicker)
  async getHealth(
    @Payload() ticker: RPC_PAYLOAD<Ticker>,
  ): Promise<RPC_RESPONSE<boolean>> {
    const result = await this.service.saveTicker(ticker);

    if (result) {
      return {
        statusCode: HttpStatus.OK,
        data: true,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Error',
    };
  }
}
