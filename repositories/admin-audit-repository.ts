import "server-only";
import { createServiceRoleClient } from "@/supabase/server";
export type AuditEntry={id:string;action:string;entityType:string;entityId:string;metadata:Record<string,unknown>;createdAt:string;actorId:string|null};
export class AdminAuditRepository{async forEntity(entityType:string,entityId:string):Promise<AuditEntry[]>{const r=await createServiceRoleClient().from("audit_logs").select("id,action,entity_type,entity_id,metadata,created_at,actor_id").eq("entity_type",entityType).eq("entity_id",entityId).order("created_at",{ascending:false});if(r.error)return [];return (r.data??[]).map((x:any)=>({id:x.id,action:x.action,entityType:x.entity_type,entityId:x.entity_id,metadata:x.metadata??{},createdAt:x.created_at,actorId:x.actor_id??null}));}}
