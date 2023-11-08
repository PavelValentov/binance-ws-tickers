import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common';
import { AppService } from './app.service';
import { HTTP_RESPONSE } from '@exchanges/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SymbolOperation } from './api.dto';

@Controller()
export class AppController {
  constructor(private readonly service: AppService) {}

  @Get('/')
  @ApiTags('api')
  @ApiOperation({
    description: `Get API health`,
  })
  getData() {
    return this.service.getData();
  }

  @Get('/get-symbols')
  @ApiTags('exchange')
  @ApiOperation({
    description: `Get allowed symbol list`,
  })
  getSymbols() {
    return this.service.getSymbols();
  }

  @Post('add-symbol')
  @ApiTags('exchange')
  @ApiOperation({
    description: `Add a new symbol into the feeder`,
  })
  async addSymbol(
    @Body(new ValidationPipe({ transform: true }))
    body: SymbolOperation,
  ): Promise<HTTP_RESPONSE<string[]>> {
    return this.service.addSymbol(body);
  }

  @Post('delete-symbol')
  @ApiTags('exchange')
  @ApiOperation({
    description: `Delete a symbol from the feeder`,
  })
  async deleteSymbol(
    @Body(new ValidationPipe({ transform: true }))
    body: SymbolOperation,
  ): Promise<HTTP_RESPONSE<string[]>> {
    return this.service.deleteSymbol(body);
  }
}
