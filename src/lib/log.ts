import { db } from "@/lib/db";

export async function logActivity(
  actor: string,
  action: string,
  entity: string,
  entityId?: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await db.activityLog.create({
      data: { actor, action, entity, entityId, meta: (meta ?? undefined) as never },
    });
  } catch (e) {
    console.error("[activity-log]", e);
  }
}
