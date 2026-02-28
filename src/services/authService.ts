import { createClient } from "@/lib/supabase/client";
const supabase = createClient();
import type { Session } from "@supabase/supabase-js";
import type { User } from "@/types";

// Types for user profile
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: "admin" | "member";
  family_id: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  user?: UserProfile;
  session?: Session;
  error?: string;
}

/** Maps a Supabase UserProfile row to the app's User shape. */
export function mapProfileToUser(profile: UserProfile): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    familyId: profile.family_id || "",
    avatar: profile.avatar,
  };
}

/**
 * Fetches a user's profile row, or auto-creates one from auth metadata
 * for accounts that were created outside the app (e.g. Supabase dashboard).
 */
async function getOrCreateProfile(
  userId: string,
  fallback: { email: string; name: string; avatar: string },
): Promise<UserProfile | null> {
  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }

  if (profile) return profile;

  // Profile missing — auto-create from auth metadata
  const newProfile: UserProfile = {
    id: userId,
    email: fallback.email,
    name: fallback.name,
    avatar: fallback.avatar,
    role: "member",
    family_id: null,
  };
  const { error: insertError } = await supabase
    .from("users")
    .upsert(newProfile, { onConflict: "id", ignoreDuplicates: true });
  if (insertError) {
    console.error("Error creating user profile:", insertError);
    return null;
  }
  return newProfile;
}

// Sign up a new user
export async function signUp(
  email: string,
  password: string,
  name: string,
  avatar: string,
): Promise<AuthResponse> {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: "Failed to create user" };
    }

    // Create user profile
    const profileData = {
      id: authData.user.id,
      email,
      name,
      avatar,
      role: "member" as const,
      family_id: null,
    };

    const { error: profileError } = await supabase
      .from("users")
      .upsert(profileData, { onConflict: "id", ignoreDuplicates: true });

    if (profileError) {
      return { error: profileError.message };
    }

    return {
      user: profileData,
      session: authData.session || undefined,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Sign in existing user
export async function signIn(
  email: string,
  password: string,
): Promise<AuthResponse> {
  try {
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: "Failed to sign in" };
    }

    const profile = await getOrCreateProfile(authData.user.id, {
      email: authData.user.email ?? "",
      name:
        authData.user.user_metadata?.name ??
        authData.user.email?.split("@")[0] ??
        "User",
      avatar: authData.user.user_metadata?.avatar ?? "👤",
    });

    if (!profile) {
      return { error: "Failed to load user profile" };
    }

    return { user: profile, session: authData.session };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Sign out current user
export async function signOut(): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: error.message };
    }
    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Get current user profile
export async function getCurrentUser(): Promise<UserProfile | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    return getOrCreateProfile(user.id, {
      email: user.email ?? "",
      name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
      avatar: user.user_metadata?.avatar ?? "👤",
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Get current session
export async function getCurrentSession(): Promise<Session | null> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

// Listen to auth state changes
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void,
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return subscription;
}

// Create user profile (for admin or manual creation)
export async function createUserProfile(
  userId: string,
  userData: Omit<UserProfile, "id" | "created_at" | "updated_at">,
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase.from("users").insert({
      id: userId,
      ...userData,
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

// Get user profile by ID
export async function getUserProfile(
  userId: string,
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "created_at">>,
): Promise<{ error?: string }> {
  try {
    const { error } = await supabase
      .from("users")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
