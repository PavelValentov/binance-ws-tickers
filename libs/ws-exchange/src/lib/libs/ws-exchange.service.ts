import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { client, connection, Message } from 'websocket';
import { Market } from 'ccxt';
import pako from 'pako';
import process from 'node:process';
import { ExchangeMessageType, Ticker } from '@exchanges/common';
import { RedisExchangeService } from '@exchanges/redis';
import { PrismaService } from '@exchanges/prisma-client';
import { IntraAPIService } from '@exchanges/intra';

@Injectable()
export class ExchangeWsService implements OnApplicationBootstrap {
  protected exchangeId = '';
  protected socketAddress = '';

  private lastConnectionCreated: number = 0;
  private connections: connection[] = [];
  connected: boolean;
  reconnecting: boolean;

  protected allowToConnect: boolean;

  private allowedSymbols: string[] = [];
  private lastCheckAllowedSymbols: number = 0;

  protected symbols: Record<string, string> = {};
  protected markets: Record<string, Market> = {};

  constructor(
    protected readonly redis: RedisExchangeService,
    protected readonly prisma: PrismaService,
    protected readonly intra: IntraAPIService,
  ) {
    this.connected = false;
    this.reconnecting = false;
  }

  async onApplicationBootstrap() {
    const enabledExchanges = process.env['ENABLED_EXCHANGES']?.split(',') || [];
    if (!this.exchangeId || !enabledExchanges.includes(this.exchangeId)) {
      Logger.warn(
        `[${this.exchangeId}] Exchange disabled`,
        'ExchangeService.onApplicationBootstrap',
      );
      return;
    }

    this.allowToConnect = true;

    setTimeout(async () => this.handleCron(), 3000);
  }

  async onBootstrap() {
    // abstract method
  }

  protected sendCommand(
    connection: connection,
    command: object | object[],
    timeout?: number,
    count?: number,
  ): void {
    setTimeout(
      (connection) => {
        if (connection?.connected) {
          // console.log('sendCommand', JSON.stringify(command));
          connection.send(JSON.stringify(command));
        }
      },
      timeout || 50,
      connection,
      count,
    );
  }

  async updateMarkets(): Promise<boolean> {
    // abstract method
    return false;
  }

  async getAllowSymbols(): Promise<string[]> {
    if (Date.now() - this.lastCheckAllowedSymbols > 5000) {
      await this.updateSymbols();
    }

    return this.allowedSymbols;
  }

  async updateSymbols(): Promise<boolean> {
    this.allowedSymbols = (await this.prisma.getSymbols()) || [];
    this.lastCheckAllowedSymbols = Date.now();

    return (this.allowedSymbols?.length || 0) > 0;
  }

  private async onConnectionError(
    connection: connection,
    error: Error,
  ): Promise<void> {
    this.connected = false;
    this.reconnecting = false;

    Logger.error(
      `[${this.exchangeId}] Connection Error: ${error?.toString()}`,
      'ExchangeService.onConnectionError',
    );
  }

  private closeConnections() {
    this.connections.forEach((connection) => {
      if (connection?.connected) {
        connection.close();
      }
    });

    if (this.connections?.length) {
      Logger.warn(
        `[${this.exchangeId}] All connections closed`,
        'TickerService.onConnectionError',
      );
    }

    this.connections = [];

    this.connected = false;
    this.reconnecting = false;
  }

  private async onConnectionClosed(connection: connection): Promise<void> {
    Logger.warn(
      `[${this.exchangeId}] Connection Closed`,
      'ExchangeService.onConnectionError',
    );

    this.closeConnections();

    // await this.redisTicker.feederLostExchange(this.exchangeId, this.feederId);
  }

  private async connectFailed(error: Error): Promise<void> {
    this.connected = false;
    this.reconnecting = false;

    Logger.error(
      `[${this.exchangeId}] Connection Error: ${error.message}`,
      'ExchangeService.onConnectionError',
    );

    // await this.redisTicker.feederLostExchange(this.exchangeId, this.feederId);
  }

  async onMessage(connection: connection, message: Message): Promise<void> {
    let parsedMessage: string | object;
    let text;
    if (message.type === 'utf8') {
      // console.log("Received UTF8: '" + message.utf8Data + "'");
      text = message.utf8Data;
    } else {
      // var fileBuffer = new Buffer( message.binaryData, 'binary' );
      const binary = message.binaryData;

      text = pako.inflate(binary, {
        to: 'string',
      });
    }
    try {
      parsedMessage = JSON.parse(text);
    } catch (e) {
      // Logger.debug(
      //   `[${this.exchangeId}] onMessage UTF8 JSON.parse error: ${e.message}. Message: ${text}`,
      //   'TickerService.onMessage'
      // );
      parsedMessage = { message: text };
    }

    const executedMessage: {
      exchangeId: string;
      type: ExchangeMessageType;
      symbol?: string;
      data?: any;
    } = await this.onCustomMessage(parsedMessage, connection);

    // if (executedMessage.type === ExchangeMessageType.Ticker && executedMessage.data) {
    if (
      executedMessage.type === ExchangeMessageType.Ticker &&
      executedMessage.data?.length
    ) {
      // Logger.debug(`[${this.exchangeId}] ${result.symbol} ticker added`, 'onMessage');
      // update feeder timestamp to prevent lost feeder
      await this.updateTickers(
        executedMessage.exchangeId,
        executedMessage.data,
      );
    }
  }

  async onCustomMessage(
    message: any,
    connection: connection,
  ): Promise<{
    exchangeId: string;
    type: ExchangeMessageType;
    symbol?: string;
    data?: any;
  }> {
    return { exchangeId: '', type: ExchangeMessageType.NotImplemented };
  }

  private async onBeforeConnect(
    connection: connection,
    books?: string[],
  ): Promise<void> {
    // abstract method
  }

  protected async onAfterConnect(
    connection: connection,
    books?: string[],
  ): Promise<void> {
    // abstract method
  }

  private async onConnect(
    connection: connection,
    books?: string[],
  ): Promise<void> {
    this.connected = true;
    this.reconnecting = false;

    this.connections.push(connection);

    await this.onBeforeConnect(connection, books);

    connection.on('error', (error) =>
      this.onConnectionError(connection, error),
    );
    connection.on('close', () => this.onConnectionClosed(connection));
    connection.on('message', (message) => this.onMessage(connection, message));

    /**
     * Sends a pong frame. Pong frames may be sent unsolicited, and such pong frames will
     * trigger no action on the receiving peer. Pong frames sent in response to a ping
     * frame must mirror the payload data of the ping frame exactly.
     * The `connection` object handles this internally for you, so there should
     * be no need to use this method to respond to pings.
     * Pong frames must not exceed 125 bytes in length.
     */
    // Disabled because of "The `connection` object handles this internally for you"
    // connection.on('ping', (cancel: () => void, binaryPayload: Buffer) =>
    //   this.onPing(connection, cancel, binaryPayload)
    // );

    await this.onAfterConnect(connection, books);
  }

  private async updateTickers(
    exchangeId: string,
    tickers: Ticker[],
  ): Promise<void> {
    Logger.debug(
      `Save tickers: ${JSON.stringify(tickers)}`,
      'ExchangeService.updateTickers',
    );

    await Promise.all([tickers.map((ticker) => this.intra.saveTicker(ticker))]);
    // await this.intra.saveTickers(exchangeId, tickers);
  }

  // Disabled because of "The `connection` object handles this internally for you"
  // private onPing(connection: connection, _cancel: () => void, binaryPayload: Buffer) {
  //   if (this[this.exchangeId]?.onPing) {
  //     this[this.exchangeId].onPing(connection);
  //     return;
  //   }
  //
  //   connection?.pong(binaryPayload);
  //   Logger.debug(`[${this.exchangeId}] Pong sent`);
  // }

  addNewConnection(books?: string[], url?: string): void {
    this.lastConnectionCreated = Math.max(
      this.lastConnectionCreated + 50,
      Date.now() + 50,
    );

    setTimeout(
      () => {
        Logger.debug(
          `*** Add new websocket connection: [${this.exchangeId}] ${
            url || this.socketAddress
          }`,
          'ExchangeService.addNewConnection',
        );

        const ws = new client();
        ws.on('connectFailed', (error) => this.connectFailed(error));
        ws.on('connect', (connection) => this.onConnect(connection, books));
        ws.connect(url || this.socketAddress, undefined, undefined, undefined);
      },
      Math.max(this.lastConnectionCreated - Date.now(), 10),
    );
  }

  async checkConnection() {
    if (!this.connected && this.connections.length) {
      Logger.warn(
        `[${this.exchangeId}] Feeder lost connection, close connections...`,
        'ExchangeService.checkConnection',
      );

      this.closeConnections();
      return;
    }

    if (this.connected || this.reconnecting || !this.allowToConnect) {
      return;
    }

    this.reconnecting = true;
    Logger.warn(
      `[${this.exchangeId}] Connecting...`,
      'ExchangeService.checkConnection',
    );

    if (!(await this.updateMarkets())) {
      this.reconnecting = false;
      Logger.warn(
        `[${this.exchangeId}] There are no markets`,
        'ExchangeService.checkConnection',
      );
    }

    if (!(await this.updateSymbols())) {
      this.reconnecting = false;
      Logger.warn(
        `[${this.exchangeId}] There are no symbols to fetch`,
        'ExchangeService.checkConnection',
      );
    }

    await this.onBootstrap();

    this.addNewConnection();
  }

  async handleCron() {
    await this.checkConnection();

    setTimeout(() => this.handleCron(), 5000);
  }
}
