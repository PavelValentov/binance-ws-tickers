import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RPC_PAYLOAD } from '@exchanges/common';
import { LockRedisService } from '@exchanges/redis';

@Injectable()
export class BalancerGuard implements CanActivate {
  constructor(private readonly lock: LockRedisService) {}

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
        // const message = `RPC ERROR: Failed to lock resource ${
        //   data.lockId
        // } of ${method} with ${JSON.stringify(data)}`;
        //
        // Logger.error(message, 'BalancerGuard');

        return false;
      }
    } catch (err: any) {
      Logger.debug(
        `Failed to lock resource ${data.lockId}: ${err.message}`,
        'BalancerGuard',
      );

      return false;
    }

    // clear payload
    delete data.lockId;
    delete data.lockTtl;

    return true;
  }
}
