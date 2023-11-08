import { Global, Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';
import Redlock, { Lock } from 'redlock';

@Global()
@Injectable()
export class RedisLockService extends RedisService {
  private locks: Record<string, Redlock> = {};

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

  async isResourceLocked(
    resources: string[],
    ttl: number = 5000,
  ): Promise<boolean> {
    try {
      const lock = await (this.getRedlock(0) as Redlock).acquire(
        resources,
        ttl,
      );
      await lock.release();
      return false;
    } catch (err) {
      return true;
    }
  }

  async tryLockResource(
    resources: string[],
    retryCount: number = 0,
    ttl?: number,
  ): Promise<Lock | null> {
    let lock: Lock | null = null;
    try {
      lock = await this.getRedlock(retryCount).acquire(resources, ttl || 1000);
    } catch (error: any) {
      // Logger.debug(`Lock failed: ${error.message}`, 'RedisLockService');
    }

    return lock;
  }

  async releaseLock(lock: Lock): Promise<void> {
    try {
      await lock.release();
    } catch (err: any) {
      // Logger.debug(
      //   `Failed to release lock: ${err.message}`,
      //   'RedisLockService',
      // );
    }
  }
}
