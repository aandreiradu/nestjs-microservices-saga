import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, Subject, lastValueFrom } from 'rxjs';

export interface CustomMessageEvent<T = any> {
  data: T;
  event?: string;
  id?: string;
}
@Injectable()
export class GatewayService {
  private readonly logger: Logger = new Logger(GatewayService.name);
  private orderUpdates = new Map<string, Subject<CustomMessageEvent>>();

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

  sendUpdate(orderId: string, update: any) {
    const event: CustomMessageEvent = {
      data: update,
      id: orderId,
      event: 'order-update',
    };

    if (this.orderUpdates.has(orderId)) {
      this.orderUpdates.get(orderId).next(event);
    }
  }

  getOrderUpdates(orderId: string): Observable<CustomMessageEvent> {
    if (!this.orderUpdates.has(orderId)) {
      this.orderUpdates.set(orderId, new Subject<MessageEvent>());
    }

    return this.orderUpdates.get(orderId).asObservable();
  }

  async fetchOrderStatus(orderId: string) {
    try {
      const orderStatus = await lastValueFrom(
        this.rabbitClient.send('fetch_orderStatus', orderId),
      );

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
