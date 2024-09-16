import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class GatewayService {
  private readonly logger: Logger = new Logger(GatewayService.name);
  constructor(@Inject('ORDERS_SERVICE') private rabbitClient: ClientProxy) {}
  async placeOrder(order: any) {
    try {
      await lastValueFrom(
        this.rabbitClient.emit('create_order', JSON.stringify(order)),
      );

      return {
        isSuccess: true,
        message: 'Order placed successfully!',
      };
    } catch (error) {
      this.logger.warn(
        `Failed to place order with details ${JSON.stringify(order)}`,
      );
      this.logger.error(JSON.stringify(error));

      throw new ServiceUnavailableException(
        'Failed to place order. Try again later',
      );
    }
  }

  async fetchOrderStatus(orderId: string) {
    try {
      const orderStatus = await lastValueFrom(
        this.rabbitClient.send('fetch_orderStatus', orderId),
      );

      this.logger.log('orderStatus is');
      this.logger.log(JSON.stringify(orderStatus));

      return orderStatus;
    } catch (error) {
      this.logger.warn(`Failed to check order status with id ${orderId}`);
      this.logger.error(JSON.stringify(error));

      throw new ServiceUnavailableException(
        'Failed to retrieve order status. Try again later',
      );
    }
  }
}
