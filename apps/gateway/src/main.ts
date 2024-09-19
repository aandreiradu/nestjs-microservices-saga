import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);

  app.enableCors();

  await app.listen(3000);

  console.log('HTTP Gateway listening on port 3000');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'orders-updates-queue',
    },
  });

  await app.startAllMicroservices();
  console.log('Microservice Gateway started');
}
bootstrap();
