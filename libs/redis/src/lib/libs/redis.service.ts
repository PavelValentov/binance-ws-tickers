import { Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as Redis from 'ioredis';
import process from 'node:process';
import { RedisOptions } from 'ioredis/built/redis/RedisOptions';

export class RedisService implements OnApplicationBootstrap {
  private _instance: Redis.Redis;
  protected readonly redisPrefix: string;

  constructor() {
    this.redisPrefix = process.env['REDIS_PREFIX']
      ? process.env['REDIS_PREFIX'] + ':'
      : '';
  }

  protected get instance(): Redis.Redis {
    if (!this._instance) {
      this.createInstance();

      (this._instance as Redis.Redis).on('connect', () => this.onConnected());
      (this._instance as Redis.Redis).on('error', (err) => this.onError(err));
    }

    return this._instance;
  }

  onApplicationBootstrap() {
    this.createInstance();
  }

  private createInstance() {
    this._instance = new Redis.Redis({
      host: process.env['REDIS_HOST'] || 'localhost',
      port: +(process.env['REDIS_PORT'] || 6379),
      username: process.env['REDIS_USERNAME'] || undefined,
      password: process.env['REDIS_PASSWORD'] || undefined,
      db: +(process.env['REDIS_DB'] || 0),
      name: 'ticker',
      socket_keepalive: true,
      socket_initdelay: 10,
    } as RedisOptions);
  }

  private onConnected() {
    this.instance.stream.setKeepAlive(true, 10000);

    Logger.debug(`Redis connected DB: ${this.instance.options.name}`);
  }

  private onError(err: Error) {
    Logger.error(
      `Redis connection error DB ${this.instance.options.name}: ${err.message}`,
      'RedisService',
    );
  }

  protected async getHash(
    key: string,
    redisPrefix = true,
  ): Promise<Record<string, string> | null> {
    const data = await this.instance.hgetall(
      `${redisPrefix ? this.redisPrefix : ''}${key}`,
    );

    // Redis returns empty list against NIL for not existing key
    return data && Object.keys(data).length ? data : null;
  }

  protected async getHashKeys(
    key: string,
    redisPrefix = true,
  ): Promise<string[] | null> {
    const data = await this.instance.hkeys(
      `${redisPrefix ? this.redisPrefix : ''}${key}`,
    );

    // Redis returns empty list against NIL for not existing key
    return data?.length ? data : null;
  }

  protected async getHashCount(
    key: string,
    redisPrefix?: boolean,
  ): Promise<number> {
    return this.instance.hlen(
      `${redisPrefix !== false ? this.redisPrefix : ''}${key}`,
    );
  }

  protected async getHashValue(
    key: string,
    field: string,
  ): Promise<string | null> {
    return this.instance.hget(`${this.redisPrefix}${key}`, field);
  }

  protected async getHashValues(
    key: string,
    fields: string[],
  ): Promise<(string | null)[]> {
    return this.instance.hmget(`${this.redisPrefix}${key}`, ...fields);
  }

  protected async existsHashValue(
    key: string,
    field: string,
  ): Promise<boolean> {
    return !!(await this.instance.hexists(`${this.redisPrefix}${key}`, field));
  }

  protected async deleteHashValue(
    key: string,
    ...fields: (string | Buffer)[]
  ): Promise<void> {
    await this.instance.hdel(`${this.redisPrefix}${key}`, ...fields);
  }

  protected async setHash(
    key: string,
    hash: { [key: string]: string },
    usePrefix?: boolean,
  ): Promise<void> {
    if (!hash) {
      return;
    }

    await this.instance
      .hset(`${usePrefix !== false ? this.redisPrefix : ''}${key}`, hash)
      .catch((err) => {
        Logger.error(`${key}: ${hash}: ${err.message}`, 'setHash');
      });
  }

  protected async exists(
    key: string,
    usePrefix?: boolean,
  ): Promise<boolean | null> {
    try {
      return (
        (await this.instance.exists(
          `${usePrefix !== false ? this.redisPrefix : ''}${key}`,
        )) > 0
      );
    } catch (err: any) {
      Logger.error(
        `${err.message}: ${key}: ${err.message}`,
        'exists.RedisService',
      );
      return null;
    }
  }

  protected async getString(
    key: string,
    usePrefix?: boolean,
  ): Promise<string | null> {
    try {
      return this.instance.get(
        `${usePrefix !== false ? this.redisPrefix : ''}${key}`,
      );
    } catch (err: any) {
      Logger.error(`${err.message}: ${key}`, 'getString.RedisService');
      return null;
    }
  }

  // set key with expiration time in seconds
  protected async setString(
    key: string,
    value: string | Buffer | number,
    expire?: number,
    usePrefix?: boolean,
  ): Promise<void> {
    try {
      if (!expire) {
        await this.instance
          .set(`${usePrefix !== false ? this.redisPrefix : ''}${key}`, value)
          .catch((err) => {
            Logger.error(`${key}: ${value}: ${err.message}`, 'setString');
          });
      } else {
        await this.instance
          .setex(
            `${usePrefix !== false ? this.redisPrefix : ''}${key}`,
            expire,
            value,
          )
          .catch((err) => {
            Logger.error(`${key}: ${value}: ${err.message}`, 'setString');
          });
      }
    } catch (err: any) {
      Logger.error(`${err.message}: ${key}`, 'setString.RedisService');
    }
  }

  protected async getStrings(keys: string[]): Promise<(string | null)[]> {
    try {
      return keys?.length
        ? this.instance.mget(...keys.map((key) => `${this.redisPrefix}${key}`))
        : [];
    } catch (err: any) {
      Logger.error(
        `${err.message}: ${JSON.stringify(keys)}`,
        'getStrings.RedisService',
      );
      return [];
    }
  }

  protected async setStrings(
    keyValues: Record<string, string> | (string | Buffer | number)[],
    expirationTimeInSeconds?: number,
    usePrefix?: boolean,
  ): Promise<void> {
    const keys: string[] = [];

    try {
      if (Array.isArray(keyValues)) {
        for (let i = 0; i < keyValues.length; i += 2) {
          keyValues[i] = `${usePrefix !== false ? this.redisPrefix : ''}${
            keyValues[i]
          }`;
        }

        await this.instance.mset(keyValues);

        if (expirationTimeInSeconds) {
          for (let i = 0; i < keyValues.length; i += 2) {
            keys.push(keyValues[i] as string);
          }
        }
      } else {
        const values: Record<string, string> = {};
        Object.keys(keyValues).forEach((key) => {
          values[`${usePrefix !== false ? this.redisPrefix : ''}${key}`] =
            keyValues[key];
        });
        await this.instance.mset(values);

        if (expirationTimeInSeconds) {
          keys.push(
            ...Object.keys(keyValues).map(
              (key) => `${usePrefix !== false ? this.redisPrefix : ''}${key}`,
            ),
          );
        }
      }

      if (expirationTimeInSeconds) {
        const jobs: any[] = [];
        keys.forEach((key) => {
          jobs.push(this.instance.expire(key, expirationTimeInSeconds));
        });
        await Promise.all(jobs);
      }
    } catch (err: any) {
      Logger.error(
        `${err.message}. Expiration ${expirationTimeInSeconds}, usePrefix ${
          usePrefix === true
        }: ${JSON.stringify(keyValues)}`,
        'setStrings.RedisService',
      );
    }
  }

  protected async popMember(
    key: string,
    count: number,
  ): Promise<string[] | null> {
    const popCount = Math.min(
      count,
      await this.instance.scard(`${this.redisPrefix}${key}`),
    );
    if (!popCount) {
      return null;
    }

    // console.log('*** popCount', getIPAddress(), key, await this.getClient.scard(`${this._redisPrefix}${key}`));

    return this.instance.spop(`${this.redisPrefix}${key}`, popCount);
  }

  protected async pushMembers(key: string, values: string[]): Promise<void> {
    await this.instance.sadd(`${this.redisPrefix}${key}`, ...values);
  }

  protected async getMembers(key: string): Promise<string[]> {
    return this.instance.smembers(`${this.redisPrefix}${key}`);
  }

  protected async deleteMembers(key: string, values: string[]): Promise<void> {
    await this.instance.srem(`${this.redisPrefix}${key}`, ...values);
  }

  protected async deleteKey(key: string, usePrefix?: boolean): Promise<void> {
    try {
      await this.instance.del(
        `${usePrefix !== false ? this.redisPrefix : ''}${key}`,
      );
    } catch (err: any) {
      Logger.error(`${err.message}: ${key}`, 'deleteKey.RedisService');
    }
  }

  protected async deleteKeys(
    keys: string[],
    usePrefix?: boolean,
  ): Promise<void> {
    try {
      await this.instance.del(
        keys.map(
          (key) => `${usePrefix !== false ? this.redisPrefix : ''}${key}`,
        ),
      );
    } catch (err: any) {
      Logger.error(
        `${err.message}: ${JSON.stringify(keys)}`,
        'deleteKeys.RedisService',
      );
    }
  }
}
