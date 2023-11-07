-- CreateTable
CREATE TABLE "Symbol" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Symbol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exchange" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Exchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticker" (
    "id" SERIAL NOT NULL,
    "symbolId" INTEGER NOT NULL,
    "exchangeId" INTEGER NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "ask" DOUBLE PRECISION NOT NULL,
    "bid" DOUBLE PRECISION NOT NULL,
    "askVolume" DOUBLE PRECISION NOT NULL,
    "bidVolume" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Ticker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Symbol_name_key" ON "Symbol"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Exchange_name_key" ON "Exchange"("name");

-- CreateIndex
CREATE INDEX "Ticker_symbolId_exchangeId_idx" ON "Ticker"("symbolId", "exchangeId");

-- CreateIndex
CREATE INDEX "Ticker_symbolId_idx" ON "Ticker"("symbolId");

-- CreateIndex
CREATE INDEX "Ticker_exchangeId_idx" ON "Ticker"("exchangeId");

-- CreateIndex
CREATE UNIQUE INDEX "Ticker_symbolId_exchangeId_time_key" ON "Ticker"("symbolId", "exchangeId", "time");

-- AddForeignKey
ALTER TABLE "Ticker" ADD CONSTRAINT "Ticker_exchangeId_fkey" FOREIGN KEY ("exchangeId") REFERENCES "Exchange"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticker" ADD CONSTRAINT "Ticker_symbolId_fkey" FOREIGN KEY ("symbolId") REFERENCES "Symbol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
