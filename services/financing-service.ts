import "server-only";
import { FinancingRepository } from "@/repositories/financing-repository";
export class FinancingService {
  constructor(private readonly repository = new FinancingRepository()) {}
  getActiveBanks() { return this.repository.getActiveBanks(); }
  getActiveProgramsWithCars() { return this.repository.getActiveProgramsWithCars(); }
  getApplicableProgramsForCar(carId: string) { return this.repository.getApplicableProgramsForCar(carId); }
  getBankCreditProgramsForUsedCar(price: number, currency: string) { return this.repository.getBankCreditProgramsForUsedCar(price, currency); }
  getProgramById(id: string) { return this.repository.getProgramById(id); }
}