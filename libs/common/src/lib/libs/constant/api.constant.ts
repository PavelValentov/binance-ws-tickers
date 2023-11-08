import { MICRO_SERVICE } from './common.constant';

export enum API_RESPONSE_STATUS {
  SUCCESS = 'SUCCESS',
  PARAMETER_NOT_PROVIDED = 'PARAMETER_NOT_PROVIDED',
  PARAMETER_WRONG_PROVIDED = 'WRONG_PARAMETER_PROVIDED',
  EXCHANGE_NOT_SUPPORTED = 'EXCHANGE_NOT_SUPPORTED',
  REQUEST_EXTERNAL_ERROR = 'EXTERNAL_REQUEST_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RESPONSE_EMPTY = 'RESPONSE_EMPTY',
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  ENTITY_ALREADY_EXISTS = 'ENTITY_ALREADY_EXISTS',
}

// !!! it is necessary to add microservice ID before each method, before the dot
export const API_METHODS = {
  [MICRO_SERVICE.TICKER]: {
    saveTicker: `${MICRO_SERVICE.TICKER}.saveTicker`,
    saveTickers: `${MICRO_SERVICE.TICKER}.saveTickers`,
    getSymbols: `${MICRO_SERVICE.TICKER}.getSymbols`,
    addSymbol: `${MICRO_SERVICE.TICKER}.addSymbol`,
    deleteSymbol: `${MICRO_SERVICE.TICKER}.deleteSymbol`,
  },
};
