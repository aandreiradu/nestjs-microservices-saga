import { Injectable, Logger } from '@nestjs/common';
import { Order, OrderDocument } from './schemas/order.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class OrdersRepository {
  constructor(
    @InjectModel(Order.name) private ordermMdel: Model<OrderDocument>,
  ) {}

  async createOrder(orderDTO: Order): Promise<Order> {
    const order = new this.ordermMdel(orderDTO);

    await order.save();

    return order;
  }

  async updateOrderById(orderId: string, orderData: Omit<Order, 'orderId'>) {
    return this.ordermMdel.findOneAndUpdate(
      { orderId },
      { ...orderData },
      { new: true },
    );
  }
}
