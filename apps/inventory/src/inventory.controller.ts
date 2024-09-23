import { Controller, Get } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  RmqContext,
} from '@nestjs/microservices';

@Controller()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @EventPattern('check_inventory')
  getOrders(@Ctx() context: RmqContext) {
    console.log(context.getMessage());
    console.log('processing the message from inventory');

    return true;
  }
}
