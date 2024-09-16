import { Controller, Get } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { Ctx, MessagePattern, RmqContext } from '@nestjs/microservices';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @MessagePattern({ cmd: 'check_inventory' })
  getOrders(@Ctx() context: RmqContext) {
    console.log(context.getMessage());
    console.log('processing the message from inventory');

    return {
      stock: true,
    };
  }
}
