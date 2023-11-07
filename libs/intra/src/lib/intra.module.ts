import { Global, Module } from '@nestjs/common';
import process from 'node:process';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { INTRA_CLIENT } from '@exchanges/common';
import { LibsRedisModule } from '@exchanges/redis';
import { BalancerInterceptor } from './rpc-balancer.interceptor';
import { IntraAPIService } from './intra.service';
import { BalancerGuard } from './rpc-balancer.guard';

@Global()
@Module({
  imports: [LibsRedisModule],
  providers: [
    {
      provide: INTRA_CLIENT,
      useFactory: () => {
        return ClientProxyFactory.create({
          transport: Transport.REDIS,
          options: {
            host: process.env['REDIS_HOST'] || 'localhost',
            port: +(process.env['REDIS_PORT'] || 6379),
            username: process.env['REDIS_USERNAME'] || undefined,
            password: process.env['REDIS_PASSWORD'] || undefined,
            db: +(process.env['REDIS_DB'] || 0),
            tls: undefined,
            name: 'platform',
          },
        });
      },
      inject: [],
    },
    IntraAPIService,
    BalancerInterceptor,
    BalancerGuard,
  ],
  exports: [IntraAPIService, BalancerInterceptor, BalancerGuard],
})
export class IntraModule {}
