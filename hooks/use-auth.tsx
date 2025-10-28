import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useContext, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type {
  AuthContextType,
  SignInParams,
  SignUpParams,
  User,
} from "@/lib/types";

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Separate component for provider logic to reduce complexity
function AuthProviderComponent({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Only true during explicit auth operations
  const [authError, setAuthError] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<"en" | "hi">("en");

  // Restore session on app launch
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Don't set isLoading to true - let user interact with login screen
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session?.user) {
          // Load full user profile from database
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", data.session.user.id)
            .single();

          setUser({
            id: data.session.user.id,
            email: data.session.user.email ?? "",
            name: profile?.full_name ?? data.session.user.user_metadata?.name,
            avatar_url: profile?.avatar_url,
            created_at: profile?.created_at,
            email_verified: data.session.user.email_confirmed_at != null,
          });

          // Set preferred language from profile
          if (profile?.preferred_language) {
            setPreferredLanguage(profile.preferred_language as "en" | "hi");
          }
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
        // Don't show error to user on app launch - this is background check
      }
    };

    restoreSession();

    // Subscribe to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Load full user profile on auth state change
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
            name: profile?.full_name ?? session.user.user_metadata?.name,
            avatar_url: profile?.avatar_url,
            created_at: profile?.created_at,
            email_verified: session.user.email_confirmed_at != null,
          });

          // Set preferred language from profile
          if (profile?.preferred_language) {
            setPreferredLanguage(profile.preferred_language as "en" | "hi");
          }
        } else {
          setUser(null);
          setPreferredLanguage("en"); // Reset to default
        }
      }
    );
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async ({ name, email, password }: SignUpParams) => {
      try {
        setAuthError(null);
        setIsLoading(true);

        // Validate password strength
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        });

        if (error) {
          const errorMsg = error.message || "Sign up failed";
          setAuthError(errorMsg);
          throw new Error(errorMsg);
        }

        if (data.user) {
          // Create user profile in public.user_profiles table
          const { error: profileError } = await supabase
            .from("user_profiles")
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: name,
              preferences: {},
            });

          if (profileError) {
            console.error("Failed to create user profile:", profileError);
            // Don't throw - user is created, profile creation can be retried
          }

          setUser({
            id: data.user.id,
            email: data.user.email ?? "",
            name,
            email_verified: false,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Sign up failed";
        setAuthError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const signIn = useCallback(async ({ email, password }: SignInParams) => {
    try {
      setAuthError(null);
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Provide clear error message
        const errorMsg = error.message || "Invalid email or password";
        setAuthError(errorMsg);
        throw new Error(errorMsg);
      }

      if (data.user) {
        // Load full user profile from database
        const { data: profile, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", data.user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          // Still set user even if profile fetch fails
        }

        setUser({
          id: data.user.id,
          email: data.user.email ?? "",
          name: profile?.full_name ?? data.user.user_metadata?.name,
          avatar_url: profile?.avatar_url,
          created_at: profile?.created_at,
          email_verified: data.user.email_confirmed_at != null,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign in failed";
      setAuthError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setAuthError(null);
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      await AsyncStorage.removeItem("auth");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Sign out failed";
      setAuthError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const updateLanguagePreference = useCallback(
    async (language: "en" | "hi") => {
      if (!user) return;
      try {
        setAuthError(null);
        const { error } = await supabase
          .from("user_profiles")
          .update({ preferred_language: language })
          .eq("id", user.id);

        if (error) throw error;
        setPreferredLanguage(language);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update language preference";
        setAuthError(errorMessage);
        throw err;
      }
    },
    [user]
  );

  const resetPassword = useCallback(async (email: string) => {
    try {
      setAuthError(null);
      setIsLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "momcare://reset-password",
      });

      if (error) throw error;

      return "Password reset link sent to your email";
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Password reset failed";
      setAuthError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    try {
      if (!user?.email) {
        throw new Error("No email found");
      }

      setAuthError(null);
      setIsLoading(true);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      // Success - no need to set anything, just complete
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to resend verification email";
      setAuthError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoading,
    authError,
    signUp,
    signIn,
    signOut,
    clearError,
    resetPassword,
    preferredLanguage,
    updateLanguagePreference,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthProviderComponent>{children}</AuthProviderComponent>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
