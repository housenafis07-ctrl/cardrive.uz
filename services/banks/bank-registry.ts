import "server-only";
import type { BankProvider } from "./bank-provider";
export class BankProviderRegistry { private readonly providers = new Map<string, BankProvider>(); register(bankCode: string, provider: BankProvider): void { this.providers.set(bankCode, provider); } get(bankCode: string): BankProvider { const provider = this.providers.get(bankCode); if (!provider) throw new Error(`No bank provider configured for ${bankCode}`); return provider; } }
