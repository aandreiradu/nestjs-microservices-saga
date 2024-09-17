import {
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { PlaceOrderDTO } from './dto/order.dto';
import { ORDERS_STATUSES } from '@app/common/constants/services';

@Controller()
export class OrdersController {
  private readonly logger: Logger = new Logger(OrdersController.name);
  constructor(private readonly ordersService: OrdersService) {}

  @EventPattern('create_order')
  async handleOrderPlaced(@Payload() data: any) {
    return this.ordersService.handleOrderPlaced(data);
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
}
