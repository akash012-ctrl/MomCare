import { Tabs } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

import { AuthGuard } from "@/components/auth-guard";
import { MotherhoodTabBar } from "@/components/navigation/motherhood-tab-bar";
import { PregnancyDateRequiredModal } from "@/components/ui/pregnancy-date-required-modal";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

export default function TabLayout() {
  const { user } = useAuth();
  const [showDateModal, setShowDateModal] = useState(false);
  const [isCheckingDate, setIsCheckingDate] = useState(true);

  useEffect(() => {
    const checkPregnancyDate = async () => {
      if (!user?.id) {
        setIsCheckingDate(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("pregnancy_start_date")
          .eq("id", user.id)
          .maybeSingle(); // Use maybeSingle instead of single to handle missing records gracefully

        if (error && error.code !== "PGRST116") {
          console.error("Error checking pregnancy date:", error);
          setIsCheckingDate(false);
          return;
        }

        // Show modal if user doesn't have pregnancy_start_date set
        // This blocks access until date is selected
        setShowDateModal(!data?.pregnancy_start_date);
      } catch (err) {
        console.error("Error in checkPregnancyDate:", err);
        setShowDateModal(false); // Don't block on error
      } finally {
        setIsCheckingDate(false);
      }
    };

    checkPregnancyDate();
  }, [user?.id]);

  const handleDateSelected = useCallback(async (date: string) => {
    if (!user?.id) return;

    try {
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 means not found, which is expected for new users
        throw fetchError;
      }

      if (existingProfile) {
        // Profile exists, update it
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ pregnancy_start_date: date })
          .eq("id", user.id);

        if (updateError) throw updateError;
      } else {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from("user_profiles")
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.name || null,
            pregnancy_start_date: date,
            preferences: {},
          });

        if (insertError) throw insertError;
      }

      setShowDateModal(false);
    } catch (err) {
      console.error("Error saving pregnancy date:", err);
      alert("Failed to save pregnancy date. Please try again.");
      throw err;
    }
  }, [user?.id, user?.email, user?.name]);

  // Don't render tabs until we've checked for pregnancy date
  if (isCheckingDate) {
    return null;
  }

  return (
    <>
      <PregnancyDateRequiredModal
        visible={showDateModal}
        onDateSelected={handleDateSelected}
      />
      <AuthGuard>
        <Tabs
          tabBar={(props) => <MotherhoodTabBar {...props} />}
          screenOptions={{
            headerShown: false,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
            }}
          />
          <Tabs.Screen
            name="assistant"
            options={{
              title: "Assistant",
              tabBarStyle: { display: "flex" },
            }}
            listeners={{
              focus: () => {
                // Tab bar will be hidden via the MotherhoodTabBar component keyboard listener
              },
            }}
          />
          <Tabs.Screen
            name="track"
            options={{
              title: "Track",
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
            }}
          />
        </Tabs>
      </AuthGuard>
    </>
  );
}
