FROM node:20 as base

RUN apt update; apt install -y build-essential; npm i -g npm@latest nx@latest

WORKDIR /usr/app

COPY ../../.env ./.env
COPY ../../package*.json .
COPY ../../tsconfig*.json .
COPY ../../nx.json .
COPY ../../apps ./apps/
COPY ../../libs ./libs/

FROM base as production
ENV NODE_ENV=production

RUN npm cache verify
RUN npm ci --omit=dev
RUN npm run build

FROM base as dev
ENV NODE_ENV=development

RUN npm install
