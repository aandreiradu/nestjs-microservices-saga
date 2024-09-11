import { Body, Controller, Get, Post } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { OrdersService } from 'apps/orders/src/orders.service';

@Controller()
export class GatewayController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('place-order')
  async placeOrder(@Body() orderDTO: any) {
    return this.ordersService.placeOrder(orderDTO);
  }
}
