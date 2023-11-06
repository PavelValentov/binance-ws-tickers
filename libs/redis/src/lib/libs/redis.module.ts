import { Module } from '@nestjs/common';
import { RedisExchangeService } from './exchange.service';

@Module({
  controllers: [],
  providers: [RedisExchangeService],
  exports: [RedisExchangeService],
})
export class LibsRedisModule {}
