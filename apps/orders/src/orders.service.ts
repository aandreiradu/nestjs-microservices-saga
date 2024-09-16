import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { lastValueFrom, timeout } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { PlaceOrderDTO } from './dto/order.dto';

@Injectable()
export class OrdersService {
  private readonly logger: Logger = new Logger(OrdersService.name);

  constructor(
    @Inject('INVENTORY_SERVICE') private readonly inventoryClient: ClientProxy,
  ) {}

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
