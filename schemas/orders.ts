import { z } from "zod";
import { idSchema, uzbekPhoneSchema } from "./common";
export const orderSchema = z.object({ carId: idSchema, purchaseType: z.enum(["cash","online","credit","installment"]), phone: uzbekPhoneSchema, notes: z.string().max(2000).optional() });
export const otpSchema = z.object({ phone: uzbekPhoneSchema, code: z.string().regex(/^\d{4,8}$/), purpose: z.enum(["login","order"]) });
export const creditApplicationSchema = z.object({ orderId: idSchema, bankId: idSchema });
