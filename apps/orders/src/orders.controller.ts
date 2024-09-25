import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class OrdersController {
  private readonly logger: Logger = new Logger(OrdersController.name);
  constructor(private readonly ordersService: OrdersService) {}

  @EventPattern('create_order')
  async handleOrderPlaced(@Payload() data: any) {
    await this.ordersService.handleOrderPlaced(data);
  }

  @MessagePattern('fetch_orderStatus')
  async handleFetchOrderStatus(@Payload() orderId: string) {
    try {
      this.logger.debug(
        `Processing fetch_orderStatus for orderId ${JSON.stringify(orderId)}`,
      );
      return this.ordersService.fetchOrderStatus(orderId);
    } catch (error) {
      this.logger.error(`Failed to fetch order status for orderId ${orderId}`);
      this.logger.error(JSON.stringify(error));

      throw new InternalServerErrorException('Failed to retrieve order status');
    }
  }

  @MessagePattern('inventory_check')
  async handleInventoryCheck(@Payload() inventoryCheckPayload) {
    await this.ordersService.handleInventoryCheckEvent(inventoryCheckPayload);
  }
}
