import { Body, Controller, Get, Param, Post, Sse } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { uuid } from 'uuidv4';
import { EventPattern, Payload } from '@nestjs/microservices';

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
    return this.gatewayService.fetchOrderStatus(orderId);
  }

  @EventPattern('order_update')
  handleOrderUpdate(@Payload() data: any) {
    console.log(
      `processing order_update event with data ${JSON.stringify(data)}`,
    );
    this.gatewayService.sendUpdate(data?.orderId, data);
  }
}
