import { Expose, Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SymbolOperation {
  @Expose()
  @IsString()
  @Type(() => String)
  @Transform(({ value }) => (!value ? undefined : value.toUpperCase()))
  @ApiProperty({
    type: String,
    example: 'BTC/USDT',
  })
  symbol: string;

  @Expose()
  @ApiProperty()
  @IsString()
  @Type(() => String)
  @Transform(({ value }) => (!value ? undefined : value.toLowerCase()))
  @ApiProperty({
    type: String,
    example: 'binance',
  })
  exchangeId: string;
}
