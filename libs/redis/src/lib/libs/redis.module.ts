import { Global, Module } from '@nestjs/common';
import { RedisExchangeService } from './exchange.service';
import { LockRedisService } from './lock.redis.service';

@Global()
@Module({
  providers: [RedisExchangeService, LockRedisService],
  exports: [RedisExchangeService, LockRedisService],
})
export class LibsRedisModule {}
