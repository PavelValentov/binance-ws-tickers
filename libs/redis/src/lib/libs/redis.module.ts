import { Global, Module } from '@nestjs/common';
import { RedisExchangeService } from './exchange.service';
import { RedisLockService } from './lock.service';

@Global()
@Module({
  providers: [RedisExchangeService, RedisLockService],
  exports: [RedisExchangeService, RedisLockService],
})
export class LibsRedisModule {}
