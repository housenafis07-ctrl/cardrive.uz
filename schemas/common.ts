import { z } from "zod";
export const idSchema = z.string().uuid();
export const uzbekPhoneSchema = z.string().regex(/^\+998\d{9}$/, "Use +998XXXXXXXXX format");
export const slugSchema = z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
