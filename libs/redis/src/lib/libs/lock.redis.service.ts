import Redlock, { Lock } from 'redlock';
import { Global, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Injectable()
export class LockRedisService extends RedisService implements OnModuleDestroy {
  private locks: Record<string, Redlock> = {};

  constructor() {
    super();
  }

  onModuleDestroy() {
    const jobs = [];
    for (const lock of Object.values(this.locks)) {
      jobs.push(
        lock
          .quit()
          .catch((err) =>
            Logger.error(`onModuleDestroy ${err.message}`, 'RedisLockService'),
          ),
      );
    }

    return Promise.all(jobs);
  }

  private getRedlock(retryCount: number = 0): Redlock {
    if (!this.locks[retryCount]) {
      this.locks[retryCount] = new Redlock([this.instance], {
        driftFactor: 0.01,
        retryCount: retryCount,
        retryDelay: 200,
        retryJitter: 200,
      });
    }

    return this.locks[retryCount];
  }

  async isAvailable(resources: string[], ttl: number = 50): Promise<boolean> {
    return (this.getRedlock(0) as Redlock)
      .acquire(resources, ttl)
      .then(async (lock) => {
        await lock.release();
        return true;
      })
      .catch((err) => {
        Logger.error(`Lock failed: ${err.message}`, 'RedisLockService');
        return false;
      });
  }

  async tryLockResource(
    resources: string[],
    retryCount: number = 0,
    ttl?: number,
  ): Promise<Lock | null> {
    return this.getRedlock(retryCount)
      .acquire(resources, ttl || 1000)
      .then((lock) => lock)
      .catch((err) => {
        // Logger.debug(`Lock failed: ${err.message}`, 'RedisLockService');
        return null;
      });
  }

  async releaseLock(lock: Lock): Promise<void> {
    await lock.release().catch((err) => {
      Logger.debug(
        `Failed to release lock: ${err.message}`,
        'RedisLockService',
      );
    });
  }
}
