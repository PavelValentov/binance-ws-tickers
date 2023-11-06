import { HttpStatus } from '@nestjs/common';

export const INTRA_CLIENT = Symbol('RPC_CALL');

export class RPC_RESPONSE<TData> {
  statusCode: number = HttpStatus.OK;
  message?: string;
  error?: string;
  data?: TData;
  length?: number;
  totalItems?: number;
  duration?: number;
}

export type RPC_PAYLOAD<TInput> = TInput & {
  lockId: string[];
  lockTtl?: number;
};
