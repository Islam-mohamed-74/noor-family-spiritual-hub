import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
import { User } from "@/types";

// ---------------------------------------------------------------------------
// Internal mapper
// ---------------------------------------------------------------------------

export function mapSupabaseUserToUser(data: any): User {
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    familyId: data.family_id || "",
    avatar: data.avatar || "👤",
  };
}

// ---------------------------------------------------------------------------
// Family member queries
// ---------------------------------------------------------------------------

export async function getFamilyMembers(familyId?: string): Promise<User[]> {
  try {
    let fid = familyId;
    if (!fid) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: profile } = await supabase
        .from("users")
        .select("family_id")
        .eq("id", user.id)
        .single();

      if (!profile?.family_id) return [];
      fid = profile.family_id;
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("family_id", fid);

    if (error) {
      console.error("Error fetching family members:", error);
      return [];
    }

    return (data || []).map(mapSupabaseUserToUser);
  } catch (error) {
    console.error("Error getting family members:", error);
    return [];
  }
}

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

export async function updateUserProfile(
  userId: string,
  patch: { name?: string; avatar?: string },
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", userId);
    if (error) return { error: error.message };
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Unknown error" };
  }
}
