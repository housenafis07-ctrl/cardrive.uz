import "server-only";
import { orderSchema } from "@/schemas/orders";
import { OrderRepository } from "@/repositories/order-repository";
export class OrderService { constructor(private readonly orders = new OrderRepository()) {} async create(input: unknown, customerId: string, totalAmount: number, currency: string) { const value = orderSchema.parse(input); return this.orders.create({ orderNumber: `CD-${crypto.randomUUID()}`, customerId, carId: value.carId, purchaseType: value.purchaseType, totalAmount, currency, notes: value.notes }); } }
