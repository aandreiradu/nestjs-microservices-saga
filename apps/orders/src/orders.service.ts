import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { lastValueFrom, timeout } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { PlaceOrderDTO } from './dto/order.dto';
import { ORDERS_STATUSES } from '@app/common/constants/services';

@Injectable()
export class OrdersService {
  private readonly logger: Logger = new Logger(OrdersService.name);
  private ordersStatuses = new Map();

  constructor(
    @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy,
  ) {}

  async handleOrderPlaced(order: string): Promise<boolean> {
    try {
      const orderData = JSON.parse(order) as PlaceOrderDTO;
      this.ordersStatuses.set(orderData.orderId, ORDERS_STATUSES.PROCESSING);

      const stockAvailable = await this.checkInventory(orderData);

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

  async fetchOrderStatus(orderId: string) {
    try {
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
  async checkInventory(order: PlaceOrderDTO) {
    try {
      const response = await lastValueFrom<boolean>(
        this.inventoryClient
          .send({ cmd: 'check_inventory' }, JSON.stringify(order))
          .pipe(timeout(5000)),
      );

      return response;
    } catch (error) {
      this.logger.warn(
        `Failed to check inventory for order with details ${JSON.stringify(
          order,
        )}`,
      );
      this.logger.error(JSON.stringify(error));

      throw new ServiceUnavailableException(
        'Failed to check inventory. Try again later',
      );
    }
  }
}
