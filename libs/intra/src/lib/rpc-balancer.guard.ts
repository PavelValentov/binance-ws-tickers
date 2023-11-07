import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RPC_PAYLOAD } from '@exchanges/common';
import { RedisLockService } from '@exchanges/redis';

@Injectable()
export class BalancerGuard implements CanActivate {
  constructor(private readonly lock: RedisLockService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const data = context.switchToRpc().getData() as RPC_PAYLOAD<any>;
    const ctx = context.switchToRpc().getContext();

    const method = ctx.args?.[0] || 'Unknown.Method';

    if (!data?.lockId?.length) {
      Logger.error(`No lock ID provided for ${method}`);

      return false;
    }

    let lock: any;
    try {
      lock = await this.lock.tryLockResource(data.lockId, 0, data.lockTtl);

      // tryLockResource can return NULL
      if (!lock) {
        const message = `RPC ERROR: Failed to lock resource ${
          data.lockId
        } of ${method} with ${JSON.stringify(data)}`;

        Logger.error(message, 'BalancerInterceptor');

        return false;
      }
    } catch (err: any) {
      Logger.debug(
        `Failed to lock resource ${data.lockId}: ${err.message}`,
        'BalancerInterceptor',
      );

      return false;
    }

    return true;
  }
}
