export type UserRole = "customer" | "manager" | "admin";
export type PurchaseType = "cash" | "online" | "credit" | "installment";
export type OrderStatus = "pending" | "confirmed" | "processing" | "completed" | "cancelled";
export type StockStatus = "available" | "reserved" | "sold" | "coming_soon";
export type OtpPurpose = "login" | "order";
export interface AuthenticatedUser { id: string; role: UserRole; phone: string | null; }
