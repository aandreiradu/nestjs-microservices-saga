import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class OrdersService {
  private readonly logger: Logger = new Logger(OrdersService.name);
  constructor(@Inject('ORDERS_SERVICE') private rabbitClient: ClientProxy) {}

  async placeOrder(order: any) {
    try {
      await lastValueFrom(
        this.rabbitClient.emit('order_placed', JSON.stringify(order)),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to place order with details ${JSON.stringify(order)}`,
      );
      this.logger.error(error);

      throw new ServiceUnavailableException(
        'Failed to place order. Try again later',
      );
    }
  }
}
