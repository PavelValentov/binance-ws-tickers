export type Ticker = {
  exchangeId: string;
  symbol: string;
  synonym: string;
  time: number;
  ask: number;
  askVolume: number;
  bid: number;
  bidVolume: number;
  close: number;
};

export type TickerType = {
  [symbol: string]: Ticker;
};
