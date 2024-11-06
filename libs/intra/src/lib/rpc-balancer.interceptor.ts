import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of, TimeoutError } from 'rxjs';
import { catchError, map, tap, timeout } from 'rxjs/operators';
import { LockRedisService } from '@exchanges/redis';
import { RPC_PAYLOAD, RPC_RESPONSE, rpcErrorMessage } from '@exchanges/common';

@Injectable()
export class BalancerInterceptor implements NestInterceptor {
  private readonly timeoutLimit = 60000; // 1 minute

  constructor(private readonly lock: LockRedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<RPC_RESPONSE<any> | null>> {
    const start = Date.now();
    const data = context.switchToRpc().getData() as RPC_PAYLOAD<any>;
    const ctx = context.switchToRpc().getContext();
    // Logger.info('context', ctx.args?.[0], context.getArgs());

    const method = ctx.args?.[0] || 'Unknown.Method';

    if (!data?.lockId?.length) {
      Logger.error(`No lock ID provided for ${method}`);

      throw new HttpException('No lockId provided', HttpStatus.BAD_REQUEST);
    }

    // try to lock resource
    let instanceFlag = false;
    let lock: any;
    try {
      lock = await this.lock.tryLockResource(data.lockId, 0, data.lockTtl);
      // tryLockResource can return NULL
      if (!lock) {
        const error = `Failed to lock resource ${data.lockId}`;
        const message = `RPC ERROR: ${
          data.lockId
        } of [${method}] with ${JSON.stringify(data)}, error: ${error}`;

        // Logger.error(error, message, 'BalancerInterceptor');

        return of({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
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
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: err.message,
      });
    }

    // wait for lock to be released
    if (!instanceFlag) {
      while (!lock && Date.now() - start < this.timeoutLimit) {
        // sleep for 50 ms
        await new Promise((resolve) => setTimeout(resolve, 50));

        lock = await this.lock.tryLockResource(data.lockId, 0, data.lockTtl);
      }
      if (lock) {
        await this.lock.releaseLock(lock);
      }

      const duration = Date.now() - start;
      const message = `${data.callId} of ${method} waited for ${duration}ms`;

      if (duration > this.timeoutLimit) {
        throw new HttpException(message, HttpStatus.TEMPORARY_REDIRECT);
      }

      return of({
        statusCode: HttpStatus.TEMPORARY_REDIRECT,
        error: message,
        duration,
      });
    }

    return next.handle().pipe(
      timeout(this.timeoutLimit),
      catchError((err: Error) => {
        const error = rpcErrorMessage(err);
        const message = `RPC ERROR: ${
          data.callId
        } of ${method} with ${JSON.stringify(data)} with ${error}`;
        Logger.error(message, 'BalancerInterceptor');

        if (err instanceof TimeoutError) {
          return of({
            statusCode: HttpStatus.REQUEST_TIMEOUT,
            message,
            error,
          });
        }

        return of({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          error,
          message,
        });
      }),
      map((value) => {
        return value === undefined
          ? null
          : ({ ...value, duration: Date.now() - start } as RPC_RESPONSE<any>);
      }),
      tap(async () => {
        // release other instances after successful processing
        setTimeout(async () => {
          if (lock) {
            await this.lock.releaseLock(lock);
          }
        }, 100);
      }),
    );
  }
}
