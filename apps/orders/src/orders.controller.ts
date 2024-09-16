import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { PlaceOrderDTO } from './dto/order.dto';

@Controller()
export class OrdersController {
  private readonly logger: Logger = new Logger(OrdersController.name);
  constructor(private readonly ordersService: OrdersService) {}

  @EventPattern('order_placed')
  async handleOrderPlaced(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      const orderData = JSON.parse(data) as PlaceOrderDTO;
      console.log('orderData', orderData);

      const inventoryResponse = await this.ordersService.checkInventory(
        orderData,
      );
      console.log('inventoryResponse', inventoryResponse);
    } catch (error) {
      console.error('failed to process order_placed event');
      throw new InternalServerErrorException(
        'failed to process order_placed event',
      );
    }
  }
}
