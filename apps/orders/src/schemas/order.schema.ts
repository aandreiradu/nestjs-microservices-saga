import { ORDERS_STATUSES } from '@app/common/constants/services';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true, type: [{ productId: String, quantity: Number }] })
  items: Array<{ productId: string; quantity: number }>;

  @Prop({ required: true, enum: Object.keys(ORDERS_STATUSES) })
  status: string;

  @Prop({ required: true, type: Number })
  totalAmount: number;

  @Prop({ type: Date })
  paymentCompletedAt?: Date;

  @Prop({ type: Date })
  inventoryCheckedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
