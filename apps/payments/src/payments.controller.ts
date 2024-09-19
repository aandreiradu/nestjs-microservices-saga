import { Controller, Get } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Ctx, MessagePattern, RmqContext } from '@nestjs/microservices';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern({ cmd: 'initiate_payment' })
  generatePaymentLink(@Ctx() context: RmqContext) {
    console.log(context.getMessage());
    console.log('processing the message from payments');

    return 'https://www.google.com';
  }
}
