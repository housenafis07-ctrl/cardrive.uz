import "server-only";
import { orderSchema } from "@/schemas/orders";
import { OrderRepository } from "@/repositories/order-repository";
import { CatalogRepository } from "@/repositories/catalog-repository";
import { FinancingService } from "@/services/financing-service";
import type { OrderStatus } from "@/types/domain";

export class OrderService {
  constructor(private readonly orders = new OrderRepository(), private readonly catalog = new CatalogRepository(), private readonly financing = new FinancingService()) {}
  async create(input: unknown, customerId: string) {
    const value = orderSchema.parse(input);
    const carResult = await this.catalog.getCarById(value.carId);
    if (!carResult.data) throw new Error("Avtomobil topilmadi yoki mavjud emas");
    const car = carResult.data;
    if (car.stock_status !== "available") throw new Error("Bu avtomobil hozircha buyurtma uchun mavjud emas");
    const financingSelected = value.purchaseType === "credit" || value.purchaseType === "installment";
    if (financingSelected && !value.financingProgramId) throw new Error("Kredit dasturini tanlang");
    if (!financingSelected && value.financingProgramId) throw new Error("Kredit dasturi faqat kredit yoki bo'lib to'lash uchun tanlanadi");
    if (value.financingProgramId) {
      const applicable = await this.financing.getApplicableProgramsForCar(value.carId);
      const program = applicable.data?.find((item) => item.id === value.financingProgramId);
      if (!program || !program.is_active) throw new Error("Tanlangan kredit dasturi bu avtomobil uchun mavjud emas");
      if (program.financing_type !== value.purchaseType) throw new Error("Tanlangan kredit dasturi to'lov turiga mos emas");
    }
    const duplicate = await this.orders.findRecentDuplicate(customerId, value.carId, value.purchaseType);
    if (duplicate.data) return duplicate;
    const created = await this.orders.create({ orderNumber: `CD-${crypto.randomUUID()}`, customerId, carId: value.carId, purchaseType: value.purchaseType, financingProgramId: value.financingProgramId, totalAmount: car.price, currency: car.currency, notes: value.notes });
    if (created.error || !created.data) throw new Error("Buyurtmani yaratib bo'lmadi");
    const history = await this.orders.createStatusHistory({ orderId: created.data.id, oldStatus: null, newStatus: "pending", changedBy: customerId });
    if (history.error) throw new Error("Buyurtma tarixini saqlab bo'lmadi");
    return created;
  }
  findForCustomer(customerId: string) { return this.orders.findForCustomer(customerId); }
  async findByIdForCustomer(orderId: string, customerId: string) { const order = await this.orders.findByIdForCustomer(orderId, customerId); if (!order.data) return { ...order, history: [] as unknown[] }; const history = await this.orders.findStatusHistory(orderId, customerId); return { ...order, history: history.data ?? [] }; }
  async advanceToConfirmedIfPending(orderId: string, currentStatus: OrderStatus) { if (currentStatus !== "pending") return null; const updated = await this.orders.updateStatus(orderId, "confirmed"); if (updated.error) throw new Error("Buyurtma holatini yangilab bo'lmadi"); const history = await this.orders.createStatusHistory({ orderId, oldStatus: "pending", newStatus: "confirmed", note: "Kredit arizasi tasdiqlanishi bilan avtomatik" }); if (history.error) throw new Error("Buyurtma tarixini saqlab bo'lmadi"); return updated.data; }
  async cancelIfOwned(orderId: string, customerId: string) { const order = await this.orders.findByIdForCustomer(orderId, customerId); if (!order.data) throw new Error("Buyurtma topilmadi yoki sizga tegishli emas"); const currentStatus = order.data.status as OrderStatus; if (currentStatus === "cancelled") return order.data; if (currentStatus !== "pending" && currentStatus !== "confirmed") throw new Error("Bu buyurtmani bekor qilib bo'lmaydi"); const updated = await this.orders.updateStatus(orderId, "cancelled"); if (updated.error) throw new Error("Buyurtmani bekor qilib bo'lmadi"); const history = await this.orders.createStatusHistory({ orderId, oldStatus: currentStatus, newStatus: "cancelled", changedBy: customerId }); if (history.error) throw new Error("Buyurtma tarixini saqlab bo'lmadi"); return updated.data; }
}
