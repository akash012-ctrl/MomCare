import { useFocusEffect, useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useCallback, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { LanguageSelector } from "@/components/language-selector";
import { AnalysisHistorySection } from "@/components/profile/analysis-history-section";
import { DueDateCard } from "@/components/profile/due-date-card";
import { ProfileHeader } from "@/components/profile/profile-header";
import { SettingsSection } from "@/components/profile/settings-section";
import { PregnancyCalendar } from "@/components/ui/pregnancy-calendar";
import { PregnancyStartDatePicker } from "@/components/ui/pregnancy-start-date-picker";
import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import type { ImageAnalysisResult } from "@/lib/image-analysis-types";
import { getCurrentUserId } from "@/lib/rls-helpers";
import { supabase } from "@/lib/supabase";

const { colors, spacing } = MotherhoodTheme;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, preferredLanguage, updateLanguagePreference } =
    useAuth();
  const [mealHistory, setMealHistory] = useState<ImageAnalysisResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pregnancyStartDate, setPregnancyStartDate] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingLanguage, setIsUpdatingLanguage] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'calendar'>('settings');

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.replace("/welcome" as any);
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const loadPregnancyData = useCallback(async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from("user_profiles")
        .select("pregnancy_start_date")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error loading pregnancy data:", error);
        return;
      }

      if (data?.pregnancy_start_date) {
        setPregnancyStartDate(data.pregnancy_start_date);
      }
    } catch (err) {
      console.error("Error in loadPregnancyData:", err);
    }
  }, []);

  const handleUpdatePregnancyDate = async (newDate: string) => {
    try {
      setIsUpdatingProfile(true);
      const userId = await getCurrentUserId();

      if (!userId) {
        setError("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({ pregnancy_start_date: newDate })
        .eq("id", userId);

      if (error) throw error;

      setPregnancyStartDate(newDate);
      setError(null);
    } catch (err) {
      console.error("Error updating pregnancy date:", err);
      setError(err instanceof Error ? err.message : "Failed to update date");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLanguageChange = async (language: "en" | "hi") => {
    try {
      setIsUpdatingLanguage(true);
      await updateLanguagePreference(language);
      setError(null);
    } catch (err) {
      console.error("Error updating language preference:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update language"
      );
    } finally {
      setIsUpdatingLanguage(false);
    }
  };

  const handleUpdateName = async (newName: string) => {
    try {
      setIsUpdatingProfile(true);
      const userId = await getCurrentUserId();

      if (!userId) {
        setError("Not authenticated");
        return;
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({ full_name: newName })
        .eq("id", userId);

      if (error) throw error;

      setError(null);
    } catch (err) {
      console.error("Error updating name:", err);
      setError(err instanceof Error ? err.message : "Failed to update name");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const fetchAnalysisHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = await getCurrentUserId();

      if (!userId) {
        setError("Not authenticated");
        return;
      }

      const { data: mealData, error: mealError } = await supabase
        .from("image_analysis_results")
        .select("*")
        .eq("user_id", userId)
        .eq("analysis_type", "meal")
        .order("created_at", { ascending: false })
        .limit(10);

      if (mealError) throw mealError;
      setMealHistory((mealData || []) as ImageAnalysisResult[]);
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAnalysisHistory();
      loadPregnancyData();
    }, [fetchAnalysisHistory, loadPregnancyData])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
        >
          <ProfileHeader
            name={user?.name || "Mama"}
            email={user?.email ?? undefined}
          />
        </MotiView>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <Pressable
            style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
              Settings
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
            onPress={() => setActiveTab('calendar')}
          >
            <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
              Calendar
            </Text>
          </Pressable>
        </View>

        {/* Settings Tab Content */}
        {activeTab === 'settings' && (
          <>
            {pregnancyStartDate ? (
              <PregnancyStartDatePicker
                initialDate={pregnancyStartDate}
                initialName={user?.name || ""}
                onDateChange={handleUpdatePregnancyDate}
                onNameChange={handleUpdateName}
                isLoading={isUpdatingProfile}
              />
            ) : null}

            <LanguageSelector
              selectedLanguage={preferredLanguage}
              onLanguageChange={handleLanguageChange}
              isLoading={isUpdatingLanguage}
            />

            <AnalysisHistorySection
              mealHistory={mealHistory}
              loading={loading}
              error={error}
            />

            <SettingsSection
              onSignOut={handleSignOut}
              isSigningOut={isSigningOut}
            />
          </>
        )}

        {/* Calendar Tab Content */}
        {activeTab === 'calendar' && (
          <View style={{ gap: spacing.xxxl }}>
            {pregnancyStartDate && (
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 500 }}
              >
                <DueDateCard
                  pregnancyStartDate={pregnancyStartDate}
                  language={preferredLanguage || 'en'}
                />
              </MotiView>
            )}

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 500, delay: 100 }}
            >
              <PregnancyCalendar
                pregnancyStartDate={pregnancyStartDate || undefined}
                onDateSelect={(date) => console.log("Selected date:", date)}
              />
            </MotiView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingTop: spacing.xxxl,
    gap: spacing.xxxl,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});
