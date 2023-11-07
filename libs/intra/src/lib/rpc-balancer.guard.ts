import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { instanceID } from '@angry-api/backend/common';
import { RedisHeartbeatService } from '@angry-api/backend/storage';
import { RPC_PAYLOAD } from '@exchanges/common';

@Injectable()
export class BalancerGuard implements CanActivate {
  constructor(private readonly heartbeat: RedisHeartbeatService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const data = context.switchToRpc().getData() as RPC_PAYLOAD<any>;
    const ctx = context.switchToRpc().getContext();
    const instance = instanceID();

    // console.log('context', ctx.args?.[0], context.getArgs(), data);

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
        const error = `Failed to lock resource ${data.lockId}`;
        const message = `RPC ERROR: ${
          data.lockId
        } of ${method} with ${JSON.stringify(data)}, error: ${error}`;

        Logger.error(error, message, 'BalancerInterceptor');

        return of({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error,
          message,
        });
      }

      instanceFlag = true;
    } catch (err: any) {
      Logger.error(
        `Failed to lock resource ${data.lockId}: ${err.message}`,
        'BalancerInterceptor',
      );

      return of({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: err.message,
      });
    }

    const allow = data.instance === instance;
    if (allow) {
      // Logger.debug(`Allowed ${method} for ${JSON.stringify(data)} on ${instance}`);

      setTimeout(async () => {
        await this.heartbeat.deleteCallId(data.callId);
      }, 1000);
    }

    return allow;
  }
}
