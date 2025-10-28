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
          .single();

        if (error) {
          console.error("Error checking pregnancy date:", error);
        }

        // Show modal if user is logged in but hasn't set pregnancy date
        setShowDateModal(!data?.pregnancy_start_date);
      } catch (err) {
        console.error("Error in checkPregnancyDate:", err);
      } finally {
        setIsCheckingDate(false);
      }
    };

    checkPregnancyDate();
  }, [user?.id]);

  const handleDateSelected = useCallback(async (date: string) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ pregnancy_start_date: date })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      setShowDateModal(false);
    } catch (err) {
      console.error("Error saving pregnancy date:", err);
      throw err;
    }
  }, [user?.id]);

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
