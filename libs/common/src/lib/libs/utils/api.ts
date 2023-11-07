import { HttpStatus } from '@nestjs/common';
import { API_RESPONSE_STATUS } from '../constant/api.constant';
import {
  API_RESPONSE_MESSAGE,
  HTTP_RESPONSE,
} from '../interface/api.interface';
import { RPC_RESPONSE } from '../interface/intra.interface';

export function rpcErrorMessage(answer: any): string {
  return (
    answer?.data?.message ||
    answer?.data?.error ||
    answer?.message ||
    answer?.error ||
    'Unknown error'
  );
}

export function isRpcResponseSuccess(
  response: HTTP_RESPONSE<any> | RPC_RESPONSE<any>,
  checkPayload: boolean = true,
): boolean {
  return (
    response &&
    [HttpStatus.OK, HttpStatus.CREATED, HttpStatus.NO_CONTENT].includes(
      response?.statusCode || HttpStatus.BAD_REQUEST,
    ) &&
    (!checkPayload || !!response?.data)
  );
}

export function prepareRpcResponse<Payload>(
  params: [API_RESPONSE_STATUS, API_RESPONSE_MESSAGE, Payload],
  checkPayload: boolean = true,
  additionalParams: object = {},
): RPC_RESPONSE<Payload> {
  const [error, message, result] = params;

  if (
    error === API_RESPONSE_STATUS.SUCCESS &&
    (!checkPayload || (result !== undefined && result !== null))
  ) {
    return {
      statusCode: result ? HttpStatus.OK : HttpStatus.NO_CONTENT,
      message,
      data: result,
      ...additionalParams,
    };
  }

  return {
    statusCode: HttpStatus.BAD_REQUEST,
    error,
    message,
    data: result,
    ...additionalParams,
  };
}

export function prepareRrcError<T>(
  message: API_RESPONSE_MESSAGE,
  status?: API_RESPONSE_STATUS,
  data?: T,
): RPC_RESPONSE<undefined | T> {
  return {
    statusCode: HttpStatus.BAD_REQUEST,
    error: status || API_RESPONSE_STATUS.INTERNAL_ERROR,
    message,
    data: data || undefined,
  };
}
