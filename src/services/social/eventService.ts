import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
import { FamilyEvent, EventType } from "@/types";
import { getFamilyId } from "@/services/family/familyService";

// ---------------------------------------------------------------------------
// Family Events Service  (Task 14)
// ---------------------------------------------------------------------------

export async function getFamilyEvents(
  familyId?: string,
): Promise<FamilyEvent[]> {
  try {
    const fid = familyId ?? (await getFamilyId());
    if (!fid) return [];

    const { data, error } = await supabase
      .from("family_events")
      .select("*")
      .eq("family_id", fid)
      .gte("event_date", new Date(Date.now() - 7 * 86400000).toISOString()) // past 7 days + future
      .order("event_date", { ascending: true });

    if (error) return [];

    return (data || []).map((e: any) => ({
      id: e.id,
      familyId: e.family_id,
      title: e.title,
      description: e.description ?? "",
      eventDate: e.event_date,
      eventType: (e.event_type as EventType) ?? "general",
      createdBy: e.created_by ?? "",
      createdAt: e.created_at,
    }));
  } catch {
    return [];
  }
}

export async function addFamilyEvent(
  event: Omit<FamilyEvent, "id" | "createdAt">,
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.from("family_events").insert({
      family_id: event.familyId,
      title: event.title,
      description: event.description ?? null,
      event_date: event.eventDate,
      event_type: event.eventType,
      created_by: event.createdBy,
    });
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function deleteFamilyEvent(
  id: string,
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from("family_events")
      .delete()
      .eq("id", id);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
