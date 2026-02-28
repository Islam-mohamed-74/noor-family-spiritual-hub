import { supabase } from "@/lib/supabase";
import { Family } from "@/types";

// ---------------------------------------------------------------------------
// Family CRUD
// ---------------------------------------------------------------------------

export async function getFamily(familyId?: string): Promise<Family | null> {
  try {
    let fid = familyId;
    if (!fid) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("users")
        .select("family_id")
        .eq("id", user.id)
        .single();

      if (!profile?.family_id) return null;
      fid = profile.family_id;
    }

    const { data, error } = await supabase
      .from("families")
      .select("*")
      .eq("id", fid)
      .single();

    if (error) {
      console.error("Error fetching family:", error);
      return null;
    }

    const { data: members } = await supabase
      .from("users")
      .select("id")
      .eq("family_id", fid);

    return {
      id: data.id,
      name: data.name,
      members: members?.map((m) => m.id) || [],
      sharedKhatma: {
        targetPages: data.shared_khatma_target || 0,
        completedPages: data.shared_khatma_completed || 0,
      },
    };
  } catch (error) {
    console.error("Error getting family:", error);
    return null;
  }
}

export async function updateFamily(
  family: Partial<Family> & { id: string },
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from("families")
      .update({
        name: family.name,
        shared_khatma_target: family.sharedKhatma?.targetPages,
        shared_khatma_completed: family.sharedKhatma?.completedPages,
      })
      .eq("id", family.id);

    if (error) {
      console.error("Error updating family:", error);
      return { error: error.message };
    }

    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error updating family:", error);
    return { error: message };
  }
}

// ---------------------------------------------------------------------------
// Family creation & joining
// ---------------------------------------------------------------------------

export async function createFamily(
  name: string,
  userId: string,
): Promise<{ family?: Family; error?: string }> {
  try {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const familyId = crypto.randomUUID();

    // Do NOT use .select() here — the RLS SELECT policy requires family_id to already be
    // set on the user row, which hasn't happened yet. Pre-generate the ID instead.
    const { error: familyError } = await supabase
      .from("families")
      .insert({ id: familyId, name, invite_code: inviteCode });
    if (familyError) return { error: familyError.message };

    const { error: userError } = await supabase
      .from("users")
      .update({ family_id: familyId, role: "admin" })
      .eq("id", userId);
    if (userError) return { error: userError.message };

    return {
      family: {
        id: familyId,
        name,
        members: [userId],
        sharedKhatma: { targetPages: 0, completedPages: 0 },
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function joinFamilyByCode(
  code: string,
  userId: string,
): Promise<{ family?: Family; error?: string }> {
  try {
    const { data: family, error } = await supabase
      .from("families")
      .select("*")
      .eq("invite_code", code.toUpperCase().trim())
      .single();
    if (error || !family) return { error: "رمز الدعوة غير صحيح" };

    const { error: userError } = await supabase
      .from("users")
      .update({ family_id: family.id })
      .eq("id", userId);
    if (userError) return { error: userError.message };

    const { data: members } = await supabase
      .from("users")
      .select("id")
      .eq("family_id", family.id);

    return {
      family: {
        id: family.id,
        name: family.name,
        members: members?.map((m: any) => m.id) || [],
        sharedKhatma: {
          targetPages: family.shared_khatma_target || 0,
          completedPages: family.shared_khatma_completed || 0,
        },
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}

// ---------------------------------------------------------------------------
// Invite code
// ---------------------------------------------------------------------------

export async function getInviteCode(familyId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("families")
      .select("invite_code")
      .eq("id", familyId)
      .single();
    if (error || !data) return null;
    if (data.invite_code) return data.invite_code;

    // Generate one if missing
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await supabase
      .from("families")
      .update({ invite_code: code })
      .eq("id", familyId);
    return code;
  } catch {
    return null;
  }
}
