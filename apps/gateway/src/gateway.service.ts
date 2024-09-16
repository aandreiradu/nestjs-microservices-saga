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
        this.rabbitClient.emit('order_placed', JSON.stringify(order)),
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
}
