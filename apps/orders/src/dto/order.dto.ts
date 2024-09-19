export class PlaceOrderDTO {
  constructor(
    public email: string,
    public quantity: number,

    public productName: string,

    public productId: string,

    public orderId: string,
  ) {}
}
