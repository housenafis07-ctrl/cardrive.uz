import { z } from "zod";

export const idSchema = z.string().uuid();
export const uzbekPhoneSchema = z.string().regex(/^\+998\d{9}$/, "Use +998XXXXXXXXX format");

export function normalizeUzbekPhone(value: string): string {
  const raw = value.trim();
  const digits = raw.replace(/\D/g, "");

  if (digits.startsWith("998")) return `+${digits}`;
  if (digits.startsWith("8") && digits.length === 10) return `+998${digits.slice(1)}`;
  if (digits.length === 9) return `+998${digits}`;

  return raw;
}

export const slugSchema = z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
