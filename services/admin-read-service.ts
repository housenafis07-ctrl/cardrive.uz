import "server-only";
import { AdminRefinementRepository } from "@/repositories/admin-refinement-repository";
export class AdminReadService { constructor(private readonly repository=new AdminRefinementRepository()){} brand(id:string){return this.repository.brand(id);} model(id:string){return this.repository.model(id);} car(id:string){return this.repository.car(id);} }
