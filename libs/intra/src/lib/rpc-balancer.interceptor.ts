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
import { RPC_PAYLOAD, RPC_RESPONSE } from './intra.interface';
import { IntraAPIService } from './intra.service';
import { RedisLockService } from '@exchanges/redis';

@Injectable()
export class BalancerInterceptor implements NestInterceptor {
  private readonly timeoutLimit = 60000; // 1 minutes

  constructor(
    private readonly intra: IntraAPIService,
    private readonly lock: RedisLockService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<RPC_RESPONSE<any>>> {
    const start = Date.now();
    const data = context.switchToRpc().getData() as RPC_PAYLOAD<any>;
    const ctx = context.switchToRpc().getContext();
    // console.log('context', ctx.args?.[0], context.getArgs());

    const method = ctx.args?.[0] || 'Unknown.Method';

    if (!data?.lockId?.length) {
      Logger.error(`No lock ID provided for ${method}`);

      throw new HttpException('No lockId provided', HttpStatus.BAD_REQUEST);
    }

    const lock = await this.lock.tryLockResource(data.lockId, 0, data.lockTtl);
    if (!lock) {
      return;
    }

    try {
      const lock = await redlock.lock(resource, ttl);
      await lock.unlock(); // сразу снимаем блокировку
      return false; // ресурс не был заблокирован
    } catch (err) {
      return true; // ресурс заблокирован
    }

    const isActiveInstance = await this.intra.isActiveInstance(
      data.instance,
      data.callId,
    );

    // wait for current instance to finish and return null
    if (isActiveInstance === false) {
      const duration = Date.now() - start;
      const message = `${data.callId} of ${method} with ${JSON.stringify(
        data,
      )} forwarded from ${instanceID()} and waited ${duration}ms`;

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
      map((value) =>
        value === undefined
          ? null
          : ({ ...value, duration: Date.now() - start } as RPC_RESPONSE<any>),
      ),
      catchError(async (err: Error) => {
        const error = rpcErrorMessage(err);
        const message = `RPC ERROR: ${
          data.callId
        } of ${method} with ${JSON.stringify(
          data,
        )} failed on ${instanceID()} with ${error}`;

        Logger.error(message, 'BalancerInterceptor');

        // release other instances in case of any other error
        return this.intra.releaseInstances(data.callId).then(() => {
          if (err instanceof TimeoutError) {
            // return throwError(() => new RequestTimeoutException());
            return {
              statusCode: HttpStatus.REQUEST_TIMEOUT,
              message,
              error,
            };
          }

          return {
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            error,
            message,
          };
        });
      }),
      tap(async () => {
        // Logger.debug(
        //   `Processed ${method} for ${JSON.stringify(data)} on ${instanceID()}, Elapsed time: ${Date.now() - start}ms`
        // );
        // console.log(`After... ${Date.now() - start}ms`);

        // release other instances after successful processing
        setTimeout(async () => {
          await this.intra.releaseInstances(data.callId);
        }, 1000);
      }),
    );
  }
}
