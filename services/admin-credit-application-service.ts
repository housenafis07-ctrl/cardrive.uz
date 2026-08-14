import "server-only";
import { AdminCreditApplicationRepository } from "@/repositories/admin-credit-application-repository";
import { CreditApplicationService } from "@/services/credit-application-service";
export class AdminCreditApplicationService { constructor(private readonly repository=new AdminCreditApplicationRepository(),private readonly creditApplications=new CreditApplicationService()){} listAll(options:{sort?:"newest"|"oldest"}={}){return this.repository.listAll(options);} async syncApplicationStatus(applicationId:string,actorId:string){const result=await this.creditApplications.syncApplicationStatusAsAdmin({applicationId});await this.repository.audit(actorId,"credit_application.status_synced","credit_application",applicationId);return result;} }
