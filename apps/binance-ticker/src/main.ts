import process from 'node:process';
import { NestFactory } from '@nestjs/core';
import { RedisOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';

(async function () {
  const app = await NestFactory.createMicroservice<RedisOptions>(AppModule, {
    transport: Transport.REDIS,
    options: {
      host: process.env['REDIS_HOST'] || 'localhost',
      port: +(process.env['REDIS_PORT'] || 6379),
      username: process.env['REDIS_USERNAME'] || undefined,
      password: process.env['REDIS_PASSWORD'] || undefined,
      db: +(process.env['REDIS_TRADER_DB'] || 0),
      name: 'tickerMS',
    },
    bufferLogs: true,
    autoFlushLogs: true,
    logger: undefined,
  });

  await app.listen();
})();
