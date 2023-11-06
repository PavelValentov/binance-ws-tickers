import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { instanceID } from '@angry-api/backend/common';
import { RedisHeartbeatService } from '@angry-api/backend/storage';

@Injectable()
export class BalancerGuard implements CanActivate {
  constructor(private readonly heartbeat: RedisHeartbeatService) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const data = context.switchToRpc().getData();
    const ctx = context.switchToRpc().getContext();
    const instance = instanceID();

    // console.log('context', ctx.args?.[0], context.getArgs(), data);

    const method = ctx.args?.[0] || 'Unknown.Method';

    if (!data?.callId) {
      Logger.error(`No callId provided for ${method}`);

      throw new HttpException('No callId provided', HttpStatus.BAD_REQUEST);
    }

    if (!data?.instance) {
      Logger.error(`No instance provided for ${method}`);

      throw new HttpException('No instance provided', HttpStatus.BAD_REQUEST);
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
