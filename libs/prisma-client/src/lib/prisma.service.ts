import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async addExchange(data: { exchangeId: string }): Promise<string[]> {
    const exchange = await this.exchange.findUnique({
      where: { id: data.exchangeId },
    });

    if (!exchange) {
      await this.exchange.create({
        data: {
          id: data.exchangeId,
        },
      });
    }

    return this.exchange.findMany();
  }
}
