import "server-only";
import { redirect } from "next/navigation";
import type { AuthenticatedUser, UserRole } from "@/types/domain";
const administrativeRoles: readonly UserRole[] = ["admin", "manager"];
export function canManage(user: AuthenticatedUser): boolean { return administrativeRoles.includes(user.role); }
export function requireAdministrativeRole(user: AuthenticatedUser | null): asserts user is AuthenticatedUser { if (!user || !canManage(user)) redirect("/forbidden"); }
export function requireOwnership(user: AuthenticatedUser | null, customerId: string): asserts user is AuthenticatedUser { if (!user || (user.id !== customerId && !canManage(user))) redirect("/forbidden"); }
