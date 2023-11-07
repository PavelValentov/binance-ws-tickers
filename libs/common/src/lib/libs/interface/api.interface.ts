import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';
import { Expose } from 'class-transformer';

export type API_RESPONSE_MESSAGE = string;

export class HTTP_RESPONSE<T> {
  @Expose()
  @ApiProperty({
    description: 'Status code',
    type: Number,
  })
  statusCode?: number = HttpStatus.OK;

  @Expose()
  @ApiProperty({
    description: 'Error message',
    type: String,
  })
  message?: string;

  @Expose()
  @ApiProperty({
    description: 'Error status',
    type: Object,
  })
  error?: string;

  @Expose()
  @ApiProperty({
    description: 'Payload',
    type: Object,
  })
  data?: T;

  @Expose()
  @ApiProperty({
    description: 'url',
    type: Object,
  })
  urls?: { [key: string]: string };

  @Expose()
  @ApiProperty({
    description: 'Elements in the response',
    type: Number,
  })
  length?: number;

  @Expose()
  @ApiProperty({
    description: 'Answer sum',
    type: Number,
  })
  sum?: number | Record<string, number>;

  @Expose()
  @ApiProperty({
    description: 'Exchange id',
    type: String,
  })
  exchangeId?: string;

  @Expose()
  @ApiProperty({
    description: 'Last update',
    type: Date,
  })
  updated?: string;

  @Expose()
  @ApiProperty({
    description: 'Current page',
    type: Number,
  })
  page?: number;

  @Expose()
  @ApiProperty({
    description: 'Total records in dataset',
    type: Number,
  })
  totalItems?: number;

  @Expose()
  @ApiProperty({
    description: 'Records per page',
    type: Number,
  })
  itemsPerPage?: number;

  @Expose()
  @ApiProperty({
    description: 'Sort field',
    type: String,
  })
  sort?: string;

  @Expose()
  @ApiProperty({
    description: 'Sort order (1 or -1)',
    type: Number,
  })
  sortOrder?: 1 | -1;
}
