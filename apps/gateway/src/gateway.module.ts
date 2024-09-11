import { Module } from '@nestjs/common';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { RmqModule } from '@app/common/rmq/rmq.module';

@Module({
  imports: [RmqModule.register({ name: 'ORDERS_SERVICE' })],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class GatewayModule {}
