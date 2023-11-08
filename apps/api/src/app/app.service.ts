import { Injectable } from '@nestjs/common';
import process from 'node:process';
import { IntraAPIService } from '@exchanges/intra';
import { RPC_RESPONSE } from '@exchanges/common';
import { SymbolOperation } from './api.dto';

@Injectable()
export class AppService {
  constructor(private readonly intra: IntraAPIService) {}

  getData(): { message: string } {
    return { message: `Works: ${process.uptime().toString()}` };
  }

  async getSymbols(): Promise<RPC_RESPONSE<string[]>> {
    return this.intra.getSymbols();
  }

  async addSymbol(data: SymbolOperation): Promise<RPC_RESPONSE<string[]>> {
    return this.intra.addSymbol(data);
  }

  async deleteSymbol(data: SymbolOperation): Promise<RPC_RESPONSE<string[]>> {
    return this.intra.deleteSymbol(data);
  }
}
