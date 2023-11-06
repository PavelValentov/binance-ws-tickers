import { Logger, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { swaggerInit } from './swagger';
import process from 'node:process';

// const whitelist = ['http://localhost:5000'];
const corsOptionsDelegate = function (origin, callback) {
  // const originIsWhitelisted = whitelist.indexOf(origin) !== -1;

  // callback(originIsWhitelisted ? null : 'Bad request origin', originIsWhitelisted);
  callback(null, true);
};

(async function () {
  const app = await NestFactory.create(AppModule, {
    cors: {
      credentials: true,
      origin: corsOptionsDelegate,
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      preflightContinue: false,
      optionsSuccessStatus: 204,
    },
    bodyParser: true,
    logger: undefined,
  });

  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'x-api-version',
  });

  app.use(helmet());

  const globalPrefix = '';
  app.setGlobalPrefix(globalPrefix);

  const port = process.env.RESTAPI_PORT || 6767;
  const prodEnvs = ['stage', 'production', 'development'];
  // register swagger
  const serverAddress =
    process.env.NODE_ENV === 'development'
      ? `http://localhost:${port}/${globalPrefix}`
      : `https://api.domain.com/${globalPrefix}`;

  if (
    !process.env.NODE_ENV ||
    !prodEnvs.includes(process.env.NODE_ENV?.toLowerCase())
  ) {
    swaggerInit(app, serverAddress);
  }
  swaggerInit(app, serverAddress);

  await app.listen(port);

  Logger.log(`🚀 API http://localhost:${port}/${globalPrefix}`);
})();
