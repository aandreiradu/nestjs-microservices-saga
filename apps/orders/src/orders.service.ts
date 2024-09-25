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
import { error } from 'console';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Model } from 'mongoose';
import { OrdersRepository } from './orders.repository';

@Injectable()
export class OrdersService {
  private readonly logger: Logger = new Logger(OrdersService.name);

  constructor(
    @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy,
    @Inject('PAYMENT_SERVICE') private readonly paymentClient: ClientProxy,
    @Inject('ORDERS_UPDATES') private readonly ordersUpdatesClient: ClientProxy,

    private readonly ordersRepository: OrdersRepository,
  ) {}

  async handleOrderPlaced(orderMessage: string): Promise<void> {
    try {
      const orderData = JSON.parse(orderMessage) as PlaceOrderDTO;
      const order = await this.ordersRepository.createOrder({
        ...Object(orderData),
        status: ORDERS_STATUSES.PROCESSING,
      });

      this.inventoryClient.emit('check_inventory', JSON.stringify(order));

      const stockAvailable = await this.checkInventory(orderData);

      if (!stockAvailable) {
        await this.ordersRepository.updateOrderById(order.orderId, {
          status: ORDERS_STATUSES.OUT_OF_STOCK,
        });
        return;
      }

      await this.ordersRepository.updateOrderById(order.orderId, {
        ...Object(order),
        status: ORDERS_STATUSES.STOCK_CONFIRMED,
      });

      const paymentLink = await lastValueFrom(
        this.paymentClient
          .send({ cmd: 'initiate_payment' }, JSON.stringify(order))
          .pipe(timeout(5000)),
      );

      if (!paymentLink) {
        this.logger.error(
          `Failed to generate payment link for order ${JSON.stringify(error)}`,
        );
        return;
      }

      await this.ordersRepository.updateOrderById(order.orderId, {
        status: ORDERS_STATUSES.AWAITING_PAYMENT,
      });
    } catch (error) {
      console.error('failed to process order_placed event');
      throw new InternalServerErrorException(
        'failed to process order_placed event',
      );
    }
  }

  async handleInventoryCheckEvent(
    inventoryCheckPayload: string,
  ): Promise<void> {
    try {
      const inventoryCheckData = JSON.parse(inventoryCheckPayload) as Order & {
        stockConfirmed: boolean;
      };

      if (!inventoryCheckData) {
        await this.ordersRepository.updateOrderById(
          inventoryCheckData.orderId,
          {
            status: ORDERS_STATUSES.OUT_OF_STOCK,
          },
        );

        return;
      }

      await this.ordersRepository.updateOrderById(inventoryCheckData.orderId, {
        status: ORDERS_STATUSES.STOCK_CONFIRMED,
      });

      this.paymentClient.send(
        'initiate_payment',
        JSON.stringify('inventoryCheckData'),
      );

      await this.ordersRepository.updateOrderById(inventoryCheckData.orderId, {
        status: ORDERS_STATUSES.AWAITING_PAYMENT,
      });
    } catch (error) {
      this.logger.warn(`Failed to handle event inventory_check`);
      this.logger.error(JSON.stringify(inventoryCheckPayload));
      this.logger.error(error);
      this.logger.error(JSON.stringify(error));
    }
  }

  async fetchOrderStatus(orderId: string) {
    try {
      const existingOrder = null;
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
