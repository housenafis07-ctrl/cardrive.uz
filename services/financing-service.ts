import "server-only";
import { FinancingRepository } from "@/repositories/financing-repository";
export class FinancingService { constructor(private readonly repository = new FinancingRepository()) {} getActiveBanks() { return this.repository.getActiveBanks(); } getApplicableProgramsForCar(carId: string) { return this.repository.getApplicableProgramsForCar(carId); } getProgramById(id: string) { return this.repository.getProgramById(id); } }
