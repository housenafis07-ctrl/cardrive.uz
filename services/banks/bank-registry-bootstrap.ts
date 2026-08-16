import "server-only";
import { BankProviderRegistry } from "./bank-registry";

let registry: BankProviderRegistry | null = null;

/**
 * Builds the application-wide bank provider registry.
 *
 * Phase 5 restores the provider abstraction, but no real bank API adapter is
 * configured yet. Keeping the registry empty is intentional: callers will
 * receive the existing "No bank provider configured" error instead of
 * pretending that a bank integration is available.
 */
export function getBankProviderRegistry(): BankProviderRegistry {
  if (!registry) registry = new BankProviderRegistry();
  return registry;
}
