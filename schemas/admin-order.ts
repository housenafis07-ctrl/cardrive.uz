import { z } from "zod";
import { idSchema } from "@/schemas/common";
export const updateOrderStatusInputSchema=z.object({orderId:idSchema,newStatus:z.enum(["pending","confirmed","processing","completed","cancelled"])});
