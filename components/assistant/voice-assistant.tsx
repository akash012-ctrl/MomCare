import Ionicons from "@expo/vector-icons/Ionicons";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    PressableStateCallbackType,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";
import { RTCView } from "react-native-webrtc";

import type { AssistantMessage } from "@/components/assistant/types";
import { MotherhoodTheme } from "@/constants/theme";
import { useRealtimeVoice } from "@/hooks/use-realtime-voice";
import { getSupabase } from "@/lib/supabase";
import {
    getProfile,
    type NutritionLog,
    type SymptomLog,
    type UserProfile,
} from "@/lib/supabase-api";
import type { User } from "@/lib/types";

const { colors, spacing, typography, radii, shadows } = MotherhoodTheme;

type Language = "en" | "hi";

type DateBounds = { start: string; end: string };

type VoiceTranscript = ReturnType<typeof useRealtimeVoice>["transcripts"][number];

type VoiceStatus = ReturnType<typeof useRealtimeVoice>["status"];

type VoiceConnectionOptions = {
    user: User | null;
    language: Language;
    instructions: string;
};

type VoiceConnectionControls = {
    status: VoiceStatus;
    transcripts: VoiceTranscript[];
    partialAssistantText: string;
    isAssistantSpeaking: boolean;
    isUserSpeaking: boolean;
    error: string | null;
    remoteStreamUrl: string | null;
    connecting: boolean;
    connected: boolean;
    isActivationActive: boolean;
    primaryDisabled: boolean;
    primaryButtonLabel: string;
    primaryButtonIcon: string;
    handlePrimaryAction: () => void;
};

interface ContextSummaryRow {
    id: string;
    label: string;
    value: string;
}

interface VoiceContextState {
    profile: UserProfile | null;
    todayMood: SymptomLog | null;
    todayMeals: NutritionLog[];
    contextLoading: boolean;
    contextError: string | null;
}

interface VoiceDerivedData {
    displayName: string;
    moodSummary: string | null;
    mealSummaries: string[];
    totalCalories: number;
    mealInstructionSummary: string;
    todayLabel: string;
    dueDateLabel: string | null;
    pregnancyStartLabel: string | null;
    sessionInstructions: string;
    contextSummaryRows: ContextSummaryRow[];
}

function getTodayBounds(): DateBounds {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start: start.toISOString(), end: end.toISOString() };
}

function formatDateLabel(date: Date, language: Language): string {
    const locale = language === "hi" ? "hi-IN" : "en-US";
    return date.toLocaleDateString(locale, {
        month: "long",
        day: "numeric",
        year: "numeric",
    });
}

function formatDisplayDate(iso: string | null | undefined, language: Language): string | null {
    if (!iso) return null;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) {
        return iso;
    }
    return formatDateLabel(parsed, language);
}

function formatTimeLabel(iso: string | null | undefined, language: Language): string {
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

function moodSeverityLabel(severity: number | null | undefined, language: Language): string {
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

function buildMoodSummary(mood: SymptomLog | null, language: Language): string | null {
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

function buildMealSummaries(meals: NutritionLog[], language: Language): string[] {
    if (!meals.length) {
        return [];
    }

    return meals.slice(0, 3).map((meal) => {
        const descriptor = meal.meal_type ? titleCase(meal.meal_type) : language === "hi" ? "भोजन" : "Meal";
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
    return meals.reduce((total, meal) => total + (meal.calories ?? 0), 0);
}

function buildMealInstructionSummary(meals: NutritionLog[], language: Language): string {
    if (!meals.length) {
        return "";
    }

    const descriptors = meals.slice(0, 3).map((meal) => {
        const label = meal.meal_type ? titleCase(meal.meal_type) : language === "hi" ? "भोजन" : "Meal";
        const calories = typeof meal.calories === "number"
            ? `${Math.round(meal.calories)} kcal`
            : language === "hi"
                ? "कैलोरी नहीं"
                : "kcal unknown";
        return `${label} ${calories}`;
    });

    return descriptors.join(", ");
}

function createPregnancyRows(
    profile: UserProfile | null,
    language: Language,
    dueDateLabel: string | null,
    pregnancyStartLabel: string | null,
): ContextSummaryRow[] {
    const rows: ContextSummaryRow[] = [];

    if (typeof profile?.pregnancy_week === "number") {
        rows.push({
            id: "preg-week",
            label: language === "hi" ? "गर्भ सप्ताह" : "Pregnancy week",
            value: `${profile.pregnancy_week}`,
        });
    }

    if (typeof profile?.trimester === "number") {
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

    return rows;
}

function createMoodRows(moodSummary: string | null, language: Language): ContextSummaryRow[] {
    if (!moodSummary) {
        return [];
    }

    return [
        {
            id: "mood",
            label: language === "hi" ? "आज की मन:स्थिति" : "Mood today",
            value: moodSummary,
        },
    ];
}

function createNutritionRows(
    mealSummaries: string[],
    totalCalories: number,
    language: Language,
): ContextSummaryRow[] {
    if (!mealSummaries.length) {
        return [];
    }

    const entries: ContextSummaryRow[] = [
        {
            id: "meals",
            label: language === "hi" ? "भोजन लॉग" : "Meals logged",
            value: mealSummaries.join("\n"),
        },
    ];

    const roundedCalories = Math.round(totalCalories);
    const calorieValue = roundedCalories > 0
        ? `${roundedCalories} kcal`
        : language === "hi"
            ? "कैलोरी उपलब्ध नहीं"
            : "Calories not logged";

    entries.push({
        id: "calories",
        label: language === "hi" ? "अनुमानित कैलोरी" : "Estimated calories",
        value: calorieValue,
    });

    return entries;
}

function buildContextSummaryRows(params: {
    profile: UserProfile | null;
    moodSummary: string | null;
    mealSummaries: string[];
    totalCalories: number;
    language: Language;
    dueDateLabel: string | null;
    pregnancyStartLabel: string | null;
}): ContextSummaryRow[] {
    const {
        profile,
        moodSummary,
        mealSummaries,
        totalCalories,
        language,
        dueDateLabel,
        pregnancyStartLabel,
    } = params;

    return [
        ...createPregnancyRows(profile, language, dueDateLabel, pregnancyStartLabel),
        ...createMoodRows(moodSummary, language),
        ...createNutritionRows(mealSummaries, totalCalories, language),
    ];
}

function getBaseInstructionLines(language: Language, displayName: string, todayLabel: string): string[] {
    return [
        language === "hi"
            ? "आप MomCare की विनम्र हिंदी बोलने वाली सहायक हैं जो गर्भवती माताओं की देखभाल में मदद करती हैं।"
            : "You are MomCare's polite, warm English-speaking companion supporting a pregnant mother.",
        language === "hi" ? `आज की तारीख ${todayLabel} है।` : `Today is ${todayLabel}.`,
        language === "hi"
            ? `${displayName} नाम से संबोधित करें और हमेशा सम्मानजनक स्वर रखें।`
            : `Address her as ${displayName} and keep a respectful tone.`,
        language === "hi"
            ? "चिकित्सकीय किसी भी सलाह में डॉक्टर या दाई से संपर्क करने की अनुशंसा अवश्य करें।"
            : "For any medical concern, advise her to consult healthcare professionals.",
    ];
}

function getPregnancyInstructionLines(params: {
    profile: UserProfile | null;
    language: Language;
    dueDateLabel: string | null;
    pregnancyStartLabel: string | null;
}): string[] {
    const { profile, language, dueDateLabel, pregnancyStartLabel } = params;

    const pregnancyWeekLine = typeof profile?.pregnancy_week === "number"
        ? language === "hi"
            ? `वह गर्भावस्था के सप्ताह ${profile.pregnancy_week} में हैं, उसी चरण की ज़रूरतों पर ध्यान दें।`
            : `She is in pregnancy week ${profile.pregnancy_week}; tailor guidance to this stage.`
        : null;

    const trimesterLine = typeof profile?.trimester === "number"
        ? language === "hi"
            ? `वर्तमान त्रैमास ${profile.trimester} है, संबंधित टिप्स साझा करें।`
            : `Her current trimester is ${profile.trimester}; weave in trimester-appropriate tips.`
        : null;

    const startLine = pregnancyStartLabel
        ? language === "hi"
            ? `गर्भ की अनुमानित शुरुआत ${pregnancyStartLabel} को हुई।`
            : `Pregnancy likely started around ${pregnancyStartLabel}.`
        : null;

    const dueDateLine = dueDateLabel
        ? language === "hi"
            ? `अनुमानित ड्यू डेट ${dueDateLabel} है।`
            : `Estimated due date is ${dueDateLabel}.`
        : null;

    return [pregnancyWeekLine, trimesterLine, startLine, dueDateLine].filter(
        (line): line is string => Boolean(line),
    );
}

function getMoodInstructionLines(moodSummary: string | null, language: Language): string[] {
    if (moodSummary) {
        return [
            language === "hi"
                ? `आज की मन:स्थिति जानकारी: ${moodSummary} इसे सहानुभूति से स्वीकार करें।`
                : `Today's mood log: ${moodSummary} Acknowledge it with empathy.`,
        ];
    }

    return [
        language === "hi"
            ? "आज मन:स्थिति दर्ज नहीं है; आवश्यक लगे तो नम्रता से पूछें।"
            : "No mood log today; ask gently how she is feeling if helpful.",
    ];
}

function getMealInstructionLines(params: {
    mealInstructionSummary: string;
    totalCalories: number;
    language: Language;
}): string[] {
    const { mealInstructionSummary, totalCalories, language } = params;

    if (!mealInstructionSummary) {
        return [
            language === "hi"
                ? "आज भोजन लॉग नहीं है; पोषण पर कोमलता से प्रेरित करें।"
                : "No meals logged today; encourage gentle, attainable nutrition tips.",
        ];
    }

    const roundedCalories = Math.round(totalCalories);
    const caloriePhrase = roundedCalories > 0
        ? `${roundedCalories} kcal`
        : language === "hi"
            ? "कैलोरी दर्ज नहीं"
            : "calories not logged";

    return [
        language === "hi"
            ? `आज दर्ज भोजन: ${mealInstructionSummary}. कुल अनुमानित कैलोरी ${caloriePhrase} है।`
            : `Meals logged today: ${mealInstructionSummary}. Estimated calories ${caloriePhrase}.`,
    ];
}

function getAssistantGuidanceLines(language: Language): string[] {
    return [
        language === "hi"
            ? "जब नवीनतम दिशानिर्देश, समाचार या स्थान से जुड़ी जानकारी चाहिए हो तो web_search टूल से संक्षिप्त प्रश्न पूछें और स्रोतों का उल्लेख करें।"
            : "Use the web_search tool for up-to-date guidance, news, or location-specific questions. Send concise queries and cite leading sources.",
        language === "hi"
            ? "प्रतिक्रियाएँ अधिकतर तीन वाक्यों में रखें, जब तक उपयोगकर्ता अधिक विस्तार न माँगे।"
            : "Keep responses to roughly three sentences unless she asks for more detail.",
        language === "hi"
            ? "यदि जानकारी अधूरी लगे तो पहले सम्मानपूर्वक स्पष्टता प्राप्त करें।"
            : "If information is missing, politely ask follow-up questions before advising.",
    ];
}

function buildSessionInstructions(params: {
    language: Language;
    displayName: string;
    todayLabel: string;
    profile: UserProfile | null;
    dueDateLabel: string | null;
    pregnancyStartLabel: string | null;
    moodSummary: string | null;
    mealInstructionSummary: string;
    totalCalories: number;
    userId: string | null | undefined;
}): string {
    const {
        language,
        displayName,
        todayLabel,
        profile,
        dueDateLabel,
        pregnancyStartLabel,
        moodSummary,
        mealInstructionSummary,
        totalCalories,
        userId,
    } = params;

    const segments = [
        ...getBaseInstructionLines(language, displayName, todayLabel),
        ...getPregnancyInstructionLines({ profile, language, dueDateLabel, pregnancyStartLabel }),
        ...getMoodInstructionLines(moodSummary, language),
        ...getMealInstructionLines({ mealInstructionSummary, totalCalories, language }),
        ...getAssistantGuidanceLines(language),
    ];

    if (userId) {
        segments.push(`User ID: ${userId}.`);
    }

    const compiled = segments.join(" ");
    if (compiled.trim().length === 0) {
        return language === "hi" ? "आप MomCare की सहायक हैं।" : "You are MomCare's assistant.";
    }

    return compiled;
}

async function fetchVoiceContextData(
    userId: string,
    language: Language,
    bounds: DateBounds,
): Promise<VoiceContextState> {
    const supabaseClient = getSupabase();
    const result: VoiceContextState = {
        profile: null,
        todayMood: null,
        todayMeals: [],
        contextLoading: false,
        contextError: null,
    };

    try {
        result.profile = await getProfile(userId);
    } catch (profileError) {
        console.warn("Voice assistant profile fetch failed", profileError);
        result.contextError = language === "hi" ? "प्रोफ़ाइल डेटा उपलब्ध नहीं।" : "Profile data is currently unavailable.";
    }

    try {
        const { data, error } = await supabaseClient
            .from("symptoms")
            .select("id,symptom_type,severity,notes,occurred_at")
            .eq("user_id", userId)
            .eq("symptom_type", "mood")
            .gte("occurred_at", bounds.start)
            .lt("occurred_at", bounds.end)
            .order("occurred_at", { ascending: false })
            .limit(1);

        if (error) throw error;
        result.todayMood = (data?.[0] ?? null) as SymptomLog | null;
    } catch (moodError) {
        console.warn("Voice assistant mood fetch failed", moodError);
        if (!result.contextError) {
            result.contextError = language === "hi"
                ? "आज की मन:स्थिति नहीं मिली।"
                : "Mood entry for today could not be loaded.";
        }
    }

    try {
        const { data, error } = await supabaseClient
            .from("nutrition_logs")
            .select("id,meal_type,calories,notes,logged_at")
            .eq("user_id", userId)
            .gte("logged_at", bounds.start)
            .lt("logged_at", bounds.end)
            .order("logged_at", { ascending: true });

        if (error) throw error;
        result.todayMeals = (data ?? []) as NutritionLog[];
    } catch (mealError) {
        console.warn("Voice assistant meals fetch failed", mealError);
        if (!result.contextError) {
            result.contextError = language === "hi"
                ? "आज के भोजन डेटा में समस्या है।"
                : "Unable to load meal logs for today.";
        }
    }

    return result;
}

function useVoiceContextState(user: User | null, language: Language): VoiceContextState {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [todayMood, setTodayMood] = useState<SymptomLog | null>(null);
    const [todayMeals, setTodayMeals] = useState<NutritionLog[]>([]);
    const [contextLoading, setContextLoading] = useState(false);
    const [contextError, setContextError] = useState<string | null>(null);

    useEffect(() => {
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

        const bounds = getTodayBounds();

        const loadContext = async () => {
            setContextLoading(true);
            setContextError(null);

            const contextResult = await fetchVoiceContextData(user.id, language, bounds);

            if (cancelled) {
                return;
            }

            setProfile(contextResult.profile);
            setTodayMood(contextResult.todayMood);
            setTodayMeals(contextResult.todayMeals);
            setContextError(contextResult.contextError);
            setContextLoading(false);
        };

        void loadContext();

        return () => {
            cancelled = true;
        };
    }, [language, user?.id]);

    return {
        profile,
        todayMood,
        todayMeals,
        contextLoading,
        contextError,
    };
}

function useVoiceDerivedData(
    user: User | null,
    language: Language,
    context: VoiceContextState,
): VoiceDerivedData {
    const displayName = useMemo(() => {
        const fromUser = user?.name?.trim().split(" ")[0];
        if (fromUser) {
            return fromUser;
        }
        const fromProfile = context.profile?.full_name?.trim().split(" ")[0];
        if (fromProfile) {
            return fromProfile;
        }
        return language === "hi" ? "माँ" : "Mom";
    }, [context.profile?.full_name, language, user?.name]);

    const moodSummary = useMemo(
        () => buildMoodSummary(context.todayMood, language),
        [context.todayMood, language],
    );

    const mealSummaries = useMemo(
        () => buildMealSummaries(context.todayMeals, language),
        [context.todayMeals, language],
    );

    const totalCalories = useMemo(
        () => sumMealCalories(context.todayMeals),
        [context.todayMeals],
    );

    const mealInstructionSummary = useMemo(
        () => buildMealInstructionSummary(context.todayMeals, language),
        [context.todayMeals, language],
    );

    const todayLabel = useMemo(
        () => formatDateLabel(new Date(), language),
        [language],
    );

    const dueDateLabel = useMemo(
        () => formatDisplayDate(context.profile?.due_date, language),
        [context.profile?.due_date, language],
    );

    const pregnancyStartLabel = useMemo(
        () => formatDisplayDate(context.profile?.pregnancy_start_date, language),
        [context.profile?.pregnancy_start_date, language],
    );

    const sessionInstructions = useMemo(
        () =>
            buildSessionInstructions({
                language,
                displayName,
                todayLabel,
                profile: context.profile,
                dueDateLabel,
                pregnancyStartLabel,
                moodSummary,
                mealInstructionSummary,
                totalCalories,
                userId: user?.id,
            }),
        [
            context.profile,
            displayName,
            dueDateLabel,
            language,
            mealInstructionSummary,
            moodSummary,
            pregnancyStartLabel,
            todayLabel,
            totalCalories,
            user?.id,
        ],
    );

    const contextSummaryRows = useMemo(
        () =>
            buildContextSummaryRows({
                profile: context.profile,
                moodSummary,
                mealSummaries,
                totalCalories,
                language,
                dueDateLabel,
                pregnancyStartLabel,
            }),
        [
            context.profile,
            dueDateLabel,
            language,
            mealSummaries,
            moodSummary,
            pregnancyStartLabel,
            totalCalories,
        ],
    );

    return {
        displayName,
        moodSummary,
        mealSummaries,
        totalCalories,
        mealInstructionSummary,
        todayLabel,
        dueDateLabel,
        pregnancyStartLabel,
        sessionInstructions,
        contextSummaryRows,
    };
}

function describePrimaryButton(connected: boolean, language: Language): { label: string; icon: string } {
    if (connected) {
        return {
            label: language === "hi" ? "सेशन समाप्त करें" : "End Voice Session",
            icon: "stop-circle",
        };
    }

    return {
        label: language === "hi" ? "सेशन शुरू करें" : "Start Voice Session",
        icon: "mic",
    };
}

function useVoiceConnectionControls(options: VoiceConnectionOptions): VoiceConnectionControls {
    const { user, language, instructions } = options;
    const voice = useRealtimeVoice({ language, instructions });

    const connecting = voice.status === "connecting";
    const connected = voice.status === "connected";
    const isActivationActive = connected && (voice.isAssistantSpeaking || voice.isUserSpeaking);
    const primaryDisabled = connecting || !user?.id;
    const { label: primaryButtonLabel, icon: primaryButtonIcon } = describePrimaryButton(connected, language);

    const handlePrimaryAction = useCallback(async () => {
        if (!user?.id) {
            return;
        }

        try {
            if (connected) {
                await voice.disconnect();
            } else {
                await voice.connect();
            }
        } catch (sessionError) {
            console.warn("Voice session toggle failed", sessionError);
        }
    }, [connected, user?.id, voice]);

    return {
        status: voice.status,
        transcripts: voice.transcripts,
        partialAssistantText: voice.partialAssistantText,
        isAssistantSpeaking: voice.isAssistantSpeaking,
        isUserSpeaking: voice.isUserSpeaking,
        error: voice.error,
        remoteStreamUrl: voice.remoteStreamUrl,
        connecting,
        connected,
        isActivationActive,
        primaryDisabled,
        primaryButtonLabel,
        primaryButtonIcon,
        handlePrimaryAction,
    };
}

interface VoiceAssistantProps {
    user: User | null;
    language: Language;
}

export function VoiceAssistant({ user, language }: VoiceAssistantProps): React.ReactElement {
    const transcriptsRef = useRef<FlatList<AssistantMessage>>(null);
    const context = useVoiceContextState(user, language);
    const derived = useVoiceDerivedData(user, language, context);
    const voice = useVoiceConnectionControls({
        user,
        language,
        instructions: derived.sessionInstructions,
    });

    return (
        <View style={styles.voiceContainer}>
            <VoiceHeroCard
                connected={voice.connected}
                connecting={voice.connecting}
                isActivationActive={voice.isActivationActive}
                displayName={derived.displayName}
                language={language}
                primaryButtonLabel={voice.primaryButtonLabel}
                primaryButtonIcon={voice.primaryButtonIcon}
                primaryDisabled={voice.primaryDisabled}
                onPrimaryAction={voice.handlePrimaryAction}
                userPresent={!!user?.id}
            />

            <VoiceContextView
                rows={derived.contextSummaryRows}
                loading={context.contextLoading}
                error={context.contextError}
                language={language}
            />

            <VoiceErrorBanner error={voice.error} />
        </View>
    );
}

interface VoiceHeroCardProps {
    connected: boolean;
    connecting: boolean;
    isActivationActive: boolean;
    displayName: string;
    language: Language;
    primaryButtonLabel: string;
    primaryButtonIcon: string;
    primaryDisabled: boolean;
    onPrimaryAction: () => void;
    userPresent: boolean;
}

function VoiceHeroCard({
    connected,
    connecting,
    isActivationActive,
    displayName,
    language,
    primaryButtonLabel,
    primaryButtonIcon,
    primaryDisabled,
    onPrimaryAction,
    userPresent,
}: VoiceHeroCardProps): React.ReactElement {
    const subtitle = connected
        ? language === "hi"
            ? `${displayName} जी, मैं ध्यान से सुन रही हूँ।`
            : `I'm listening, ${displayName}.`
        : language === "hi"
            ? "बस बटन दबाएं और चर्चा शुरू करें।"
            : "Tap start and speak naturally.";

    const waveformStyle: StyleProp<ViewStyle> = [
        styles.voiceWaveform,
        isActivationActive ? styles.voiceWaveformActive : null,
        connected ? styles.voiceWaveformConnected : null,
    ];

    const buttonStyle = ({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> => [
        styles.voicePrimaryButton,
        connected ? styles.voicePrimaryButtonConnected : null,
        primaryDisabled ? styles.voicePrimaryButtonDisabled : null,
        pressed && !primaryDisabled ? styles.voicePrimaryButtonPressed : null,
    ];

    return (
        <View style={styles.voiceHeroCard}>
            <MotiView
                from={{ scale: 0.95, opacity: 0.85 }}
                animate={{ scale: isActivationActive ? 1.08 : 1, opacity: 1 }}
                transition={{ type: "timing", duration: 300 }}
                style={waveformStyle}
            >
                <Ionicons
                    name={connected ? "mic" : "mic-outline"}
                    size={64}
                    color={colors.surface}
                />
            </MotiView>

            <Text style={styles.voiceTitle}>Voice Assistant</Text>
            <Text style={styles.voiceSubtitle}>{subtitle}</Text>

            <Pressable
                onPress={onPrimaryAction}
                disabled={primaryDisabled}
                style={buttonStyle}
            >
                <VoicePrimaryButtonContent
                    connecting={connecting}
                    primaryButtonIcon={primaryButtonIcon}
                    primaryButtonLabel={primaryButtonLabel}
                />
            </Pressable>

            {!userPresent && (
                <Text style={styles.voiceNote}>
                    Sign in to unlock realtime voice conversations.
                </Text>
            )}
        </View>
    );
}

function VoicePrimaryButtonContent({
    connecting,
    primaryButtonIcon,
    primaryButtonLabel,
}: {
    connecting: boolean;
    primaryButtonIcon: string;
    primaryButtonLabel: string;
}): React.ReactElement {
    if (connecting) {
        return <ActivityIndicator color={colors.surface} />;
    }

    return (
        <>
            <Ionicons
                name={primaryButtonIcon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={colors.surface}
            />
            <Text style={styles.voicePrimaryButtonText}>{primaryButtonLabel}</Text>
        </>
    );
}

interface VoiceConversationViewProps {
    connected: boolean;
    language: Language;
    remoteStreamUrl: string | null;
}

const VoiceConversationView = React.forwardRef<
    FlatList<AssistantMessage>,
    VoiceConversationViewProps
>(function VoiceConversationView({ connected, language, remoteStreamUrl }, ref) {
    return (
        <View style={styles.voiceContentArea}>
            <View style={styles.voiceEmptyTranscripts}>
                <Ionicons name="chatbubble-ellipses-outline" size={36} color={colors.primary} />

                <Text style={styles.voiceEmptyText}>
                    {connected
                        ? language === "hi"
                            ? "मैं आपको सुन रही हूँ। बस बोलना शुरू करें।"
                            : "I'm listening. Just start speaking."
                        : language === "hi"
                            ? "प्रारंभ बटन दबाकर बात करें।"
                            : "Press start to begin chatting."}
                </Text>
            </View>

            {remoteStreamUrl && (
                <RTCView
                    streamURL={remoteStreamUrl}
                    style={styles.voiceHiddenAudio}
                    zOrder={0}
                    objectFit="cover"
                />
            )}
        </View>
    );
});

interface VoiceContextViewProps {
    rows: ContextSummaryRow[];
    loading: boolean;
    error: string | null;
    language: Language;
}

function VoiceContextView({ rows, loading, error, language }: VoiceContextViewProps): React.ReactElement {
    return (
        <View style={styles.voiceContextCard}>
            <Text style={styles.voiceContextTitle}>
                {language === "hi" ? "आज का संदर्भ" : "Today's context"}
            </Text>

            {loading ? (
                <ActivityIndicator color={colors.primary} size="small" />
            ) : error ? (
                <Text style={styles.voiceContextError}>{error}</Text>
            ) : rows.length ? (
                rows.map((row) => (
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
    );
}

function VoiceErrorBanner({ error }: { error: string | null }): React.ReactElement | null {
    if (!error) {
        return null;
    }

    return (
        <View style={styles.voiceErrorBanner}>
            <Ionicons name="warning" size={16} color={colors.surface} />
            <Text style={styles.voiceErrorText}>{error}</Text>
        </View>
    );
}

const layoutStyles = StyleSheet.create({
    voiceContainer: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.lg,
        gap: spacing.lg,
    },
    voiceContentArea: {
        flex: 1,
        borderRadius: radii.lg,
        backgroundColor: colors.surface,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        ...shadows.soft,
    },
});

const heroStyles = StyleSheet.create({
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
});

const conversationStyles = StyleSheet.create({
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
    voiceHiddenAudio: {
        position: "absolute",
        width: 1,
        height: 1,
        opacity: 0,
    },
});

const contextStyles = StyleSheet.create({
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
});

const feedbackStyles = StyleSheet.create({
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
});

const styles = {
    ...layoutStyles,
    ...heroStyles,
    ...conversationStyles,
    ...contextStyles,
    ...feedbackStyles,
};
