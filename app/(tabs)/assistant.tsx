import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RTCView } from "react-native-webrtc";

import { ChatInput } from "@/components/assistant/chat-input";
import { MessageBubble } from "@/components/assistant/message-bubble";
import type { AssistantMessage } from "@/components/assistant/types";
import { MotherhoodTheme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useRealtimeVoice } from "@/hooks/use-realtime-voice";
import { getSupabase } from "@/lib/supabase";
import type {
  ChatMessage,
  NutritionLog,
  SymptomLog,
  UserProfile,
} from "@/lib/supabase-api";
import {
  getConversationHistory,
  getProfile,
  sendChatMessage,
} from "@/lib/supabase-api";

import type { User } from "@/lib/types";

const { colors, radii, spacing, typography, shadows } = MotherhoodTheme;

type TabType = "chat" | "voice";

function getTodayBounds(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function formatDateLabel(date: Date, language: "en" | "hi"): string {
  const locale = language === "hi" ? "hi-IN" : "en-US";
  return date.toLocaleDateString(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDisplayDate(iso: string | null | undefined, language: "en" | "hi"): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return formatDateLabel(parsed, language);
}

function formatTimeLabel(iso: string | null | undefined, language: "en" | "hi"): string {
  if (!iso) return "";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const locale = language === "hi" ? "hi-IN" : "en-US";
  return parsed.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function titleCase(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .toLowerCase()
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function moodSeverityLabel(severity: number | null | undefined, language: "en" | "hi"): string {
  if (!severity || Number.isNaN(severity)) {
    return language === "hi" ? "मन:स्थिति दर्ज नहीं" : "Mood not logged";
  }

  const clamped = Math.max(1, Math.min(5, Math.round(severity)));
  const labels: Record<number, { en: string; hi: string }> = {
    1: { en: "very low", hi: "बहुत कम" },
    2: { en: "low", hi: "कम" },
    3: { en: "steady", hi: "संतुलित" },
    4: { en: "positive", hi: "सकारात्मक" },
    5: { en: "uplifted", hi: "उत्साहित" },
  };

  const label = labels[clamped] ?? labels[3];
  return language === "hi" ? label.hi : label.en;
}

function buildMoodSummary(mood: SymptomLog | null, language: "en" | "hi"): string | null {
  if (!mood) {
    return null;
  }

  const descriptor = moodSeverityLabel(mood.severity, language);
  const note = typeof mood.notes === "string" ? mood.notes.trim() : "";
  const when = formatTimeLabel(mood.occurred_at, language);
  const timeSuffix = when ? ` (${when})` : "";

  if (note) {
    return language === "hi"
      ? `${descriptor} महसूस कर रही हैं${timeSuffix}. नोट: ${note}`
      : `${descriptor} mood logged${timeSuffix}. Note: ${note}`;
  }

  return language === "hi"
    ? `${descriptor} महसूस कर रही हैं${timeSuffix}.`
    : `${descriptor} mood recorded${timeSuffix}.`;
}

function buildMealSummaries(meals: NutritionLog[], language: "en" | "hi"): string[] {
  if (!meals.length) {
    return [];
  }

  return meals.slice(0, 3).map((meal) => {
    const descriptor = meal.meal_type
      ? titleCase(meal.meal_type)
      : language === "hi"
        ? "भोजन"
        : "Meal";
    const time = formatTimeLabel(meal.logged_at, language);
    const calories = typeof meal.calories === "number"
      ? `${Math.round(meal.calories)} kcal`
      : language === "hi"
        ? "कैलोरी उपलब्ध नहीं"
        : "Calories not logged";
    const note = typeof meal.notes === "string" ? meal.notes.trim() : "";

    const headline = time ? `${descriptor} · ${time}` : descriptor;
    const detailParts = [calories];
    if (note) {
      detailParts.push(note);
    }

    return `${headline}: ${detailParts.join(" — ")}`;
  });
}

function sumMealCalories(meals: NutritionLog[]): number {
  return meals.reduce((total, meal) => {
    const calories = typeof meal.calories === "number" ? meal.calories : 0;
    return total + calories;
  }, 0);
}

function TabSelector({
  activeTab,
  onTabChange,
}: {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}) {
  return (
    <View style={styles.tabContainer}>
      <Pressable
        onPress={() => onTabChange("chat")}
        style={[
          styles.tabButton,
          activeTab === "chat" && styles.tabButtonActive,
        ]}
      >
        <Ionicons
          name="chatbubbles"
          size={24}
          color={activeTab === "chat" ? colors.surface : colors.textSecondary}
        />
        <Text
          style={[
            styles.tabButtonText,
            activeTab === "chat" && styles.tabButtonTextActive,
          ]}
        >
          Chat Assistant
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onTabChange("voice")}
        style={[
          styles.tabButton,
          activeTab === "voice" && styles.tabButtonActive,
        ]}
      >
        <Ionicons
          name="mic"
          size={24}
          color={activeTab === "voice" ? colors.surface : colors.textSecondary}
        />
        <Text
          style={[
            styles.tabButtonText,
            activeTab === "voice" && styles.tabButtonTextActive,
          ]}
        >
          Voice Assistant
        </Text>
      </Pressable>
    </View>
  );
}

function VoiceAssistant({
  user,
  language,
}: {
  user: User | null;
  language: "en" | "hi";
}) {
  const transcriptListRef = useRef<FlatList<AssistantMessage>>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [todayMood, setTodayMood] = useState<SymptomLog | null>(null);
  const [todayMeals, setTodayMeals] = useState<NutritionLog[]>([]);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      setProfile(null);
      setTodayMood(null);
      setTodayMeals([]);
      setContextError(null);
      setContextLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const supabaseClient = getSupabase();
    const { start, end } = getTodayBounds();

    const fetchContext = async () => {
      setContextLoading(true);
      setContextError(null);

      let profileResult: UserProfile | null = null;
      let moodResult: SymptomLog | null = null;
      let mealsResult: NutritionLog[] = [];
      let failureMessage: string | null = null;

      try {
        profileResult = await getProfile(user.id);
      } catch (profileError) {
        console.warn("Voice assistant profile fetch failed", profileError);
        failureMessage =
          language === "hi"
            ? "प्रोफ़ाइल डेटा उपलब्ध नहीं।"
            : "Profile data is currently unavailable.";
      }

      try {
        const { data, error } = await supabaseClient
          .from("symptoms")
          .select("id,symptom_type,severity,notes,occurred_at")
          .eq("user_id", user.id)
          .eq("symptom_type", "mood")
          .gte("occurred_at", start)
          .lt("occurred_at", end)
          .order("occurred_at", { ascending: false })
          .limit(1);

        if (error) throw error;
        moodResult = (data?.[0] ?? null) as SymptomLog | null;
      } catch (moodError) {
        console.warn("Voice assistant mood fetch failed", moodError);
        if (!failureMessage) {
          failureMessage =
            language === "hi"
              ? "आज की मन:स्थिति नहीं मिली।"
              : "Mood entry for today could not be loaded.";
        }
      }

      try {
        const { data, error } = await supabaseClient
          .from("nutrition_logs")
          .select(
            "id,meal_type,calories,protein_g,iron_mg,calcium_mg,folic_acid_mcg,notes,logged_at"
          )
          .eq("user_id", user.id)
          .gte("logged_at", start)
          .lt("logged_at", end)
          .order("logged_at", { ascending: true });

        if (error) throw error;
        mealsResult = (data ?? []) as NutritionLog[];
      } catch (mealError) {
        console.warn("Voice assistant meals fetch failed", mealError);
        if (!failureMessage) {
          failureMessage =
            language === "hi"
              ? "आज के भोजन डेटा में समस्या है।"
              : "Unable to load meal logs for today.";
        }
      }

      if (cancelled) {
        return;
      }

      setProfile(profileResult);
      setTodayMood(moodResult);
      setTodayMeals(mealsResult);
      setContextError(failureMessage);
      setContextLoading(false);
    };

    void fetchContext();

    return () => {
      cancelled = true;
    };
  }, [language, user?.id]);

  const displayName = useMemo(() => {
    const fromUser = user?.name?.trim().split(" ")[0];
    if (fromUser) {
      return fromUser;
    }
    const fromProfile = profile?.full_name?.trim().split(" ")[0];
    if (fromProfile) {
      return fromProfile;
    }
    return language === "hi" ? "माँ" : "Mom";
  }, [language, profile?.full_name, user?.name]);

  const moodSummary = useMemo(
    () => buildMoodSummary(todayMood, language),
    [language, todayMood]
  );

  const mealSummaries = useMemo(
    () => buildMealSummaries(todayMeals, language),
    [language, todayMeals]
  );

  const totalCalories = useMemo(
    () => sumMealCalories(todayMeals),
    [todayMeals]
  );

  const mealInstructionSummary = useMemo(() => {
    if (!todayMeals.length) {
      return "";
    }

    const descriptors = todayMeals.slice(0, 3).map((meal) => {
      const label = meal.meal_type
        ? titleCase(meal.meal_type)
        : language === "hi"
          ? "भोजन"
          : "Meal";
      const calories = typeof meal.calories === "number"
        ? `${Math.round(meal.calories)} kcal`
        : language === "hi"
          ? "कैलोरी नहीं"
          : "kcal unknown";
      return `${label} ${calories}`;
    });

    return descriptors.join(", ");
  }, [language, todayMeals]);

  const todayLabel = useMemo(() => formatDateLabel(new Date(), language), [language]);
  const dueDateLabel = useMemo(
    () => formatDisplayDate(profile?.due_date, language),
    [language, profile?.due_date]
  );
  const pregnancyStartLabel = useMemo(
    () => formatDisplayDate(profile?.pregnancy_start_date, language),
    [language, profile?.pregnancy_start_date]
  );

  const sessionInstructions = useMemo(() => {
    const lines: string[] = [];

    lines.push(
      language === "hi"
        ? "आप MomCare की विनम्र हिंदी बोलने वाली सहायक हैं जो गर्भवती माताओं की देखभाल में मदद करती हैं।"
        : "You are MomCare's polite, warm English-speaking companion supporting a pregnant mother."
    );

    lines.push(
      language === "hi"
        ? `आज की तारीख ${todayLabel} है।`
        : `Today is ${todayLabel}.`
    );

    lines.push(
      language === "hi"
        ? `${displayName} नाम से संबोधित करें और हमेशा सम्मानजनक स्वर रखें।`
        : `Address her as ${displayName} and keep a respectful tone.`
    );

    lines.push(
      language === "hi"
        ? "चिकित्सकीय किसी भी सलाह में डॉक्टर या दाई से संपर्क करने की अनुशंसा अवश्य करें।"
        : "For any medical concern, advise her to consult healthcare professionals."
    );

    if (profile?.pregnancy_week) {
      lines.push(
        language === "hi"
          ? `वह गर्भावस्था के सप्ताह ${profile.pregnancy_week} में हैं, उसी चरण की ज़रूरतों पर ध्यान दें।`
          : `She is in pregnancy week ${profile.pregnancy_week}; tailor guidance to this stage.`
      );
    }

    if (profile?.trimester) {
      lines.push(
        language === "hi"
          ? `वर्तमान त्रैमास ${profile.trimester} है, संबंधित टिप्स साझा करें।`
          : `Her current trimester is ${profile.trimester}; weave in trimester-appropriate tips.`
      );
    }

    if (pregnancyStartLabel) {
      lines.push(
        language === "hi"
          ? `गर्भ की अनुमानित शुरुआत ${pregnancyStartLabel} को हुई।`
          : `Pregnancy likely started around ${pregnancyStartLabel}.`
      );
    }

    if (dueDateLabel) {
      lines.push(
        language === "hi"
          ? `अनुमानित ड्यू डेट ${dueDateLabel} है।`
          : `Estimated due date is ${dueDateLabel}.`
      );
    }

    if (moodSummary) {
      lines.push(
        language === "hi"
          ? `आज की मन:स्थिति जानकारी: ${moodSummary} इसे सहानुभूति से स्वीकार करें।`
          : `Today's mood log: ${moodSummary} Acknowledge it with empathy.`
      );
    } else {
      lines.push(
        language === "hi"
          ? "आज मन:स्थिति दर्ज नहीं है; आवश्यक लगे तो नम्रता से पूछें।"
          : "No mood log today; ask gently how she is feeling if helpful."
      );
    }

    if (todayMeals.length) {
      const roundedCalories = Math.round(totalCalories);
      const caloriePhrase = roundedCalories > 0
        ? `${roundedCalories} kcal`
        : language === "hi"
          ? "कैलोरी दर्ज नहीं"
          : "calories not logged";

      lines.push(
        language === "hi"
          ? `आज दर्ज भोजन: ${mealInstructionSummary}. कुल अनुमानित कैलोरी ${caloriePhrase} है।`
          : `Meals logged today: ${mealInstructionSummary}. Estimated calories ${caloriePhrase}.`
      );
    } else {
      lines.push(
        language === "hi"
          ? "आज भोजन लॉग नहीं है; पोषण पर कोमलता से प्रेरित करें।"
          : "No meals logged today; encourage gentle, attainable nutrition tips."
      );
    }

    lines.push(
      language === "hi"
        ? "जब नवीनतम दिशानिर्देश, समाचार या स्थान से जुड़ी जानकारी चाहिए हो तो web_search टूल से संक्षिप्त प्रश्न पूछें और स्रोतों का उल्लेख करें।"
        : "Use the web_search tool for up-to-date guidance, news, or location-specific questions. Send concise queries and cite leading sources."
    );

    lines.push(
      language === "hi"
        ? "प्रतिक्रियाएँ अधिकतर तीन वाक्यों में रखें, जब तक उपयोगकर्ता अधिक विस्तार न माँगे।"
        : "Keep responses to roughly three sentences unless she asks for more detail."
    );

    lines.push(
      language === "hi"
        ? "यदि जानकारी अधूरी लगे तो पहले सम्मानपूर्वक स्पष्टता प्राप्त करें।"
        : "If information is missing, politely ask follow-up questions before advising."
    );

    if (user?.id) {
      lines.push(`User ID: ${user.id}.`);
    }

    const compiled = lines.join(" ");
    return compiled.trim().length
      ? compiled
      : language === "hi"
        ? "आप MomCare की सहायक हैं।"
        : "You are MomCare's assistant.";
  }, [
    displayName,
    language,
    mealInstructionSummary,
    pregnancyStartLabel,
    profile?.pregnancy_week,
    profile?.trimester,
    dueDateLabel,
    moodSummary,
    todayMeals.length,
    todayLabel,
    totalCalories,
    user?.id,
  ]);

  const {
    status,
    transcripts,
    partialAssistantText,
    isAssistantSpeaking,
    isUserSpeaking,
    error: voiceError,
    connect,
    disconnect,
    remoteStreamUrl,
  } = useRealtimeVoice({
    language,
    instructions: sessionInstructions,
  });

  const contextSummaryRows = useMemo(() => {
    const rows: { id: string; label: string; value: string }[] = [];

    if (profile?.pregnancy_week) {
      rows.push({
        id: "preg-week",
        label: language === "hi" ? "गर्भ सप्ताह" : "Pregnancy week",
        value: `${profile.pregnancy_week}`,
      });
    }

    if (profile?.trimester) {
      rows.push({
        id: "trimester",
        label: language === "hi" ? "त्रैमास" : "Trimester",
        value: `${profile.trimester}`,
      });
    }

    if (pregnancyStartLabel) {
      rows.push({
        id: "preg-start",
        label: language === "hi" ? "गर्भ शुरुआत" : "Pregnancy start",
        value: pregnancyStartLabel,
      });
    }

    if (dueDateLabel) {
      rows.push({
        id: "due-date",
        label: language === "hi" ? "अनुमानित ड्यू डेट" : "Estimated due date",
        value: dueDateLabel,
      });
    }

    if (moodSummary) {
      rows.push({
        id: "mood",
        label: language === "hi" ? "आज की मन:स्थिति" : "Mood today",
        value: moodSummary,
      });
    }

    if (mealSummaries.length) {
      rows.push({
        id: "meals",
        label: language === "hi" ? "भोजन लॉग" : "Meals logged",
        value: mealSummaries.join("\n"),
      });

      const roundedCalories = Math.round(totalCalories);
      const calorieValue = roundedCalories > 0
        ? `${roundedCalories} kcal`
        : language === "hi"
          ? "कैलोरी उपलब्ध नहीं"
          : "Calories not logged";

      rows.push({
        id: "calories",
        label: language === "hi" ? "अनुमानित कैलोरी" : "Estimated calories",
        value: calorieValue,
      });
    }

    return rows;
  }, [
    dueDateLabel,
    language,
    mealSummaries,
    moodSummary,
    pregnancyStartLabel,
    profile?.pregnancy_week,
    profile?.trimester,
    totalCalories,
  ]);

  React.useEffect(() => {
    if (!transcripts.length && !partialAssistantText) {
      return;
    }
    transcriptListRef.current?.scrollToEnd({ animated: true });
  }, [partialAssistantText, transcripts.length]);

  const voiceMessages = useMemo(() => {
    const items = transcripts.map((entry) => ({
      id: entry.id,
      role: entry.role,
      content: entry.text,
      metadata: {
        timestamp: new Date(entry.timestamp).toISOString(),
      } as Record<string, unknown>,
    }));

    if (partialAssistantText.trim().length > 0) {
      items.push({
        id: "assistant-live",
        role: "assistant",
        content: partialAssistantText,
        metadata: {
          timestamp: new Date().toISOString(),
          live: true,
        } as Record<string, unknown>,
      });
    }

    return items as AssistantMessage[];
  }, [partialAssistantText, transcripts]);

  const connecting = status === "connecting";
  const connected = status === "connected";
  const errorMessage = voiceError;
  const isActivationActive =
    connected && (isAssistantSpeaking || isUserSpeaking);
  const primaryDisabled = connecting || !user?.id;
  const primaryButtonLabel = connected
    ? "End Voice Session"
    : "Start Voice Session";
  const primaryButtonIcon = connected ? "stop-circle" : "mic";

  const handlePrimaryAction = () => {
    if (!user?.id) return;

    if (connected) {
      void disconnect();
      return;
    }

    void connect().catch(() => undefined);
  };

  return (
    <View style={styles.voiceContainer}>
      <View style={styles.voiceHeroCard}>
        <MotiView
          from={{ scale: 0.95, opacity: 0.85 }}
          animate={{ scale: isActivationActive ? 1.08 : 1, opacity: 1 }}
          transition={{ type: "timing", duration: 300 }}
          style={[
            styles.voiceWaveform,
            isActivationActive && styles.voiceWaveformActive,
            connected && styles.voiceWaveformConnected,
          ]}
        >
          <Ionicons
            name={connected ? "mic" : "mic-outline"}
            size={64}
            color={colors.surface}
          />
        </MotiView>

        <Text style={styles.voiceTitle}>Voice Assistant</Text>
        <Text style={styles.voiceSubtitle}>
          {connected
            ? language === "hi"
              ? `${displayName} जी, मैं ध्यान से सुन रही हूँ।`
              : `I'm listening, ${displayName}.`
            : language === "hi"
              ? "बस बटन दबाएं और चर्चा शुरू करें।"
              : "Tap start and speak naturally."}
        </Text>

        <Pressable
          onPress={handlePrimaryAction}
          disabled={primaryDisabled}
          style={({ pressed }) => [
            styles.voicePrimaryButton,
            connected && styles.voicePrimaryButtonConnected,
            primaryDisabled && styles.voicePrimaryButtonDisabled,
            pressed && !primaryDisabled && styles.voicePrimaryButtonPressed,
          ]}
        >
          {connecting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <Ionicons
                name={primaryButtonIcon as any}
                size={20}
                color={colors.surface}
              />
              <Text style={styles.voicePrimaryButtonText}>
                {primaryButtonLabel}
              </Text>
            </>
          )}
        </Pressable>

        {!user?.id && (
          <Text style={styles.voiceNote}>
            Sign in to unlock realtime voice conversations.
          </Text>
        )}
      </View>

      <View style={styles.voiceContentArea}>
        {voiceMessages.length === 0 ? (
          <View style={styles.voiceEmptyTranscripts}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={36}
              color={colors.primary}
            />
            <Text style={styles.voiceEmptyTitle}>Realtime conversation</Text>
            <Text style={styles.voiceEmptyText}>
              {connected
                ? language === "hi"
                  ? "जब चाहें बोलना शुरू करें।"
                  : "Start speaking whenever you like."
                : language === "hi"
                  ? "प्रारंभ बटन दबाकर बात करें।"
                  : "Press start to begin chatting."}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={transcriptListRef}
            data={voiceMessages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble message={item} isUser={item.role === "user"} />
            )}
            contentContainerStyle={styles.voiceTranscriptList}
          />
        )}
      </View>

      <View style={styles.voiceContextCard}>
        <Text style={styles.voiceContextTitle}>
          {language === "hi" ? "आज का संदर्भ" : "Today's context"}
        </Text>
        {contextLoading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : contextError ? (
          <Text style={styles.voiceContextError}>{contextError}</Text>
        ) : contextSummaryRows.length ? (
          contextSummaryRows.map((row) => (
            <View key={row.id} style={styles.voiceContextRow}>
              <Text style={styles.voiceContextLabel}>{row.label}</Text>
              <Text style={styles.voiceContextValue}>{row.value}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.voiceContextValue}>
            {language === "hi"
              ? "आज तक कोई वैयक्तिक डेटा दर्ज नहीं।"
              : "No personalised data captured yet today."}
          </Text>
        )}
      </View>

      {remoteStreamUrl && (
        <RTCView
          streamURL={remoteStreamUrl}
          style={styles.voiceHiddenAudio}
          zOrder={0}
          objectFit="cover"
        />
      )}

      {errorMessage && (
        <View style={styles.voiceErrorBanner}>
          <Ionicons name="warning" size={16} color={colors.surface} />
          <Text style={styles.voiceErrorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

export default function AssistantScreen() {
  const { user, preferredLanguage } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("chat");
  const [draft, setDraft] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isHydrating, setIsHydrating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<AssistantMessage>>(null);

  React.useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  // Load conversation history on mount
  React.useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      if (!user?.id || !activeConversationId) {
        return;
      }

      try {
        setIsHydrating(true);
        // Load conversation history from Edge Function
        const history = await getConversationHistory(
          user.id,
          activeConversationId
        );

        if (isMounted && history?.length) {
          const hydrated = history.map((message, index: number) => ({
            id: `${index}-${message.role}-${Date.now()}`,
            ...message,
            metadata: {
              timestamp: new Date().toISOString(),
            },
          }));

          setMessages(hydrated);
        }
      } catch (hydrateError) {
        console.error("Failed to hydrate assistant chat:", hydrateError);
      } finally {
        if (isMounted) {
          setIsHydrating(false);
        }
      }
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, [user?.id, activeConversationId]);

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !user?.id) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create user message
      const userMessage: AssistantMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        metadata: { timestamp: new Date().toISOString() },
      };

      // Update UI optimistically
      setMessages((prev) => [...prev, userMessage]);
      setDraft("");
      setSelectedImage(null);

      // Send only last 2 messages to reduce token usage
      const messageList: ChatMessage[] = messages.slice(-2).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content || "",
      }));
      messageList.push({ role: "user" as const, content: trimmed });

      const response = await sendChatMessage(
        messageList,
        user.id,
        activeConversationId || undefined,
        true, // includeMemory
        preferredLanguage // language preference
      );

      if (response?.message) {
        const assistantMessage: AssistantMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: response.message,
          metadata: { timestamp: new Date().toISOString() },
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setActiveConversationId(response.conversationId);
      }
    } catch (sendError) {
      console.error("Failed to send assistant message:", sendError);
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Failed to send message"
      );

      // Remove the user message if it failed
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsProcessing(false);
    }
  };

  const assistantMessages = useMemo(
    () => messages as AssistantMessage[],
    [messages]
  );

  const showEmptyState = assistantMessages.length === 0 && !isHydrating;

  const handleStop = () => {
    setIsProcessing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Pregnancy Assistant</Text>
        <Text style={styles.headerSubtitle}>
          {user?.name ? `Hi ${user.name.split(" ")[0]} ` : ""}
        </Text>
      </View>

      <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "chat" ? (
        <>
          {showEmptyState ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="chatbubble-ellipses"
                size={48}
                color={colors.primary}
              />
              <Text style={styles.emptyStateTitle}>Start a Conversation</Text>
              <Text style={styles.emptyStateText}>
                Ask anything about your pregnancy, and I will guide you step by
                step.
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={assistantMessages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messageList}
              renderItem={({ item }) => (
                <MessageBubble message={item} isUser={item.role === "user"} />
              )}
              ListFooterComponent={
                isProcessing ? (
                  <MotiView
                    from={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      type: "timing",
                      duration: 800,
                      loop: true,
                    }}
                    style={styles.loadingContainer}
                  >
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={styles.loadingLabel}>
                      MomCare is thinking...
                    </Text>
                    <Pressable onPress={handleStop} style={styles.stopButton}>
                      <Ionicons
                        name="square"
                        size={14}
                        color={colors.primary}
                      />
                      <Text style={styles.stopButtonText}>Stop</Text>
                    </Pressable>
                  </MotiView>
                ) : null
              }
            />
          )}

          {error && (
            <View style={styles.feedbackBanner}>
              <Ionicons name="warning" size={16} color={colors.primary} />
              <Text style={styles.feedbackText}>
                {error || "Something went wrong. Please try again."}
              </Text>
              <Pressable onPress={() => setError(null)}>
                <Ionicons name="close" size={18} color={colors.primary} />
              </Pressable>
            </View>
          )}

          <KeyboardAvoidingView
            behavior={Platform.select({ ios: "padding", android: undefined })}
            style={styles.keyboardAvoid}
          >
            {selectedImage && (
              <View style={styles.imagePreviewBanner}>
                <Ionicons name="image" size={16} color={colors.primary} />
                <Text style={styles.imagePreviewText}>
                  Image attached for analysis
                </Text>
                <Pressable onPress={() => setSelectedImage(null)}>
                  <Ionicons
                    name="close"
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            )}
            <ChatInput
              draft={draft}
              onChangeDraft={setDraft}
              onSend={handleSend}
              onToggleImagePicker={() => { }}
              isSubmitting={isProcessing}
              hasImage={!!selectedImage}
            />
          </KeyboardAvoidingView>
        </>
      ) : (
        <VoiceAssistant user={user} language={preferredLanguage} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#F5D6DB",
  },
  headerTitle: {
    fontSize: typography.title,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: typography.title,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    maxWidth: 260,
  },
  messageList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  stopButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  stopButtonText: {
    fontSize: typography.caption,
    color: colors.primary,
    fontWeight: "500",
  },
  keyboardAvoid: {
    width: "100%",
  },
  imagePreviewBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.mutedPink,
    borderTopWidth: 1,
    borderTopColor: "#F5D6DB",
  },
  imagePreviewText: {
    flex: 1,
    fontSize: typography.label,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.mutedPink,
  },
  feedbackText: {
    flex: 1,
    fontSize: typography.caption,
    color: colors.textPrimary,
  },
  tabContainer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F5D6DB",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.surface,
  },
  voiceContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  voiceHeroCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    alignItems: "center",
    gap: spacing.md,
    ...shadows.soft,
  },
  voiceTitle: {
    fontSize: typography.headline,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  voiceSubtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  voiceNote: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },
  voiceWaveform: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  voiceWaveformActive: {
    backgroundColor: colors.secondary,
  },
  voiceWaveformConnected: {
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.7)",
  },
  voicePrimaryButton: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    width: "100%",
    ...shadows.card,
  },
  voicePrimaryButtonConnected: {
    backgroundColor: colors.danger,
  },
  voicePrimaryButtonDisabled: {
    opacity: 0.6,
  },
  voicePrimaryButtonPressed: {
    transform: [{ scale: 0.97 }],
  },
  voicePrimaryButtonText: {
    fontSize: typography.subtitle,
    fontWeight: "600",
    color: colors.surface,
  },
  voiceContentArea: {
    flex: 1,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.soft,
  },
  voiceTranscriptList: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  voiceEmptyTranscripts: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  voiceEmptyTitle: {
    fontSize: typography.subtitle,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  voiceEmptyText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  voiceContextCard: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    gap: spacing.xs,
    ...shadows.soft,
  },
  voiceContextTitle: {
    fontSize: typography.label,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  voiceContextRow: {
    marginTop: spacing.xs,
  },
  voiceContextLabel: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  voiceContextValue: {
    fontSize: typography.caption,
    color: colors.textPrimary,
    marginTop: 2,
  },
  voiceContextError: {
    fontSize: typography.caption,
    color: colors.danger,
  },
  voiceErrorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.danger,
  },
  voiceErrorText: {
    flex: 1,
    fontSize: typography.caption,
    color: colors.surface,
  },
  voiceHiddenAudio: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
