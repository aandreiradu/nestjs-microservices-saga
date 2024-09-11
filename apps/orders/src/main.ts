import { NestFactory } from '@nestjs/core';
import { OrdersModule } from './orders.module';
import { RmqService } from '@app/common/rmq/rmq.service';

async function bootstrap() {
  const app = await NestFactory.create(OrdersModule);
  const rmqOptions = app.get<RmqService>(RmqService);
  app.connectMicroservice(rmqOptions.getOptions('ORDERS_SERVICE'));
  await app.startAllMicroservices();
}
bootstrap();
