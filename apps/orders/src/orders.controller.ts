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
  private ordersStatuses = new Map();
  constructor(private readonly ordersService: OrdersService) {}

  @EventPattern('create_order')
  async handleOrderPlaced(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      const orderData = JSON.parse(data) as PlaceOrderDTO;

      this.ordersStatuses.set(orderData.orderId, ORDERS_STATUSES.PROCESSING);

      const stockAvailable = await this.ordersService.checkInventory(orderData);

      if (!stockAvailable) {
        this.ordersStatuses.set(
          orderData.orderId,
          ORDERS_STATUSES.OUT_OF_STOCK,
        );
        return true;
      }

      this.ordersStatuses.set(
        orderData.orderId,
        ORDERS_STATUSES.STOCK_CONFIRMED,
      );

      return true;
    } catch (error) {
      console.error('failed to process order_placed event');
      throw new InternalServerErrorException(
        'failed to process order_placed event',
      );
    }
  }

  @MessagePattern('fetch_orderStatus')
  async handleFetchOrderStatus(@Payload() orderId: string) {
    try {
      this.logger.debug(
        `Processing fetch_orderStatus for orderId ${JSON.stringify(orderId)}`,
      );
      const existingOrder = this.ordersStatuses.get(orderId);

      if (!existingOrder) {
        this.logger.warn(`Order with id ${orderId} was not found`);
        return {
          isSuccess: false,
          message: 'Order not found',
        };
      }

      return {
        isSuccess: true,
        orderStatus: existingOrder,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch order status for orderId ${orderId}`);
      this.logger.error(JSON.stringify(error));

      throw new InternalServerErrorException('Failed to retrieve order status');
    }
  }
}
