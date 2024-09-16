import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { uuid } from 'uuidv4';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  @Post('orders')
  async placeOrder(@Body() orderDTO: any) {
    const orderId = uuid();
    orderDTO.orderId = orderId;

    await this.gatewayService.placeOrder(orderDTO);

    return {
      orderId,
      status: 'Order is being processed',
    };
  }

  @Get('orders/:orderId')
  async getOrderStatus(@Param('orderId') orderId: string) {
    return { orderId };
  }
}
