📱 Detailed LLM Prompts for Web to React Native Expo Conversion

## 🚀 PHASE 4: SUPABASE EDGE FUNCTIONS ARCHITECTURE (Updated October 2025)

### ⚠️ IMPORTANT: Single Source of Truth

All backend operations **MUST** use **Supabase Edge Functions** as the single source of truth.
Do NOT create local libraries for AI, API operations, or data management.

### Architecture Overview

```
Client (React Native)
    ↓
lib/supabase-api.ts (Type-safe wrapper)
    ↓
Supabase Edge Functions
    ├─ chat-handler (AI + Memory)
    ├─ voice-handler (STT + TTS)
    ├─ data-api (CRUD all data)
    └─ file-upload (Image analysis)
    ↓
Backend Services
    ├─ OpenAI API (gpt-4o-mini, whisper, tts-1, gpt-4o-vision)
    ├─ Supabase Database
    └─ Supabase Storage
```

### Do NOT Create

❌ `lib/ai-client.ts` - Use Edge Function instead  
❌ `lib/ai-memory.ts` - Use chat-handler Edge Function  
❌ `app/api/chat+api.ts` - Use chat-handler Edge Function  
❌ `app/api/voice+api.ts` - Use voice-handler Edge Function  
❌ `lib/api.ts` - Use data-api Edge Function  
❌ Local embedding generation - Use chat-handler  
❌ Local conversation storage - Use database via data-api

### DO Use

✅ `lib/supabase-api.ts` - Import functions from here  
✅ Edge Functions - Deploy to Supabase for all operations  
✅ Database - Let Edge Functions handle RLS and access  
✅ Storage - Upload files via Edge Function wrapper

### Example: Chat Operation

**WRONG** (Don't do this):

```typescript
// ❌ WRONG: Local AI logic
import { streamText } from "ai";
import { aiModel, MOTHERLY_SYSTEM_PROMPT } from "./ai-client";

const result = streamText({
  model: aiModel,
  system: MOTHERLY_SYSTEM_PROMPT,
  messages,
});
```

**RIGHT** (Do this):

```typescript
// ✅ RIGHT: Use Edge Function via unified API client
import { sendChatMessage } from "@/lib/supabase-api";

const response = await sendChatMessage(
  messages,
  userId,
  conversationId,
  true // include memory context
);
```

### Available Edge Functions (Already Deployed)

#### 1. **chat-handler**

```typescript
import { sendChatMessage, getConversationHistory } from "@/lib/supabase-api";

// Send message with AI response
const response = await sendChatMessage(
  [{ role: "user", content: "What should I eat?" }],
  userId,
  conversationId,
  true // include memory
);

// Get conversation history
const history = await getConversationHistory(userId, conversationId);
```

#### 2. **voice-handler**

```typescript
import { transcribeAudio, generateSpeech } from "@/lib/supabase-api";

// Convert speech to text
const transcript = await transcribeAudio(audioBase64, userId);

// Convert text to speech
const audioResponse = await generateSpeech("Hello there!", userId);
```

#### 3. **data-api**

```typescript
import {
  saveSymptom,
  getSymptoms,
  saveKick,
  getKicks,
  saveNutrition,
  getNutrition,
  saveGoal,
  getGoals,
  updateGoal,
  saveAlert,
  getAlerts,
  updateAlert,
  getProfile,
  updateProfileData,
} from "@/lib/supabase-api";

// All data operations
await saveSymptom(userId, { symptom_type: "nausea", severity: 3 });
await saveKick(userId, { count: 12, date: "2025-10-18" });
```

#### 4. **file-upload**

```typescript
import {
  uploadAndAnalyzeImage,
  getImageAnalysisResults,
} from "@/lib/supabase-api";

// Upload and analyze
const result = await uploadAndAnalyzeImage(
  userId,
  "meal.jpg",
  base64Image,
  "meal", // or 'posture', 'general', 'ultrasound'
  "meal-images" // storage bucket
);

// Get past results
const results = await getImageAnalysisResults(userId, "meal");
```

---

🎯 Project Setup & Configuration

Prompt 1: Project Configuration & Dependencies

```
Convert a web-based pregnancy app to React Native Expo. Set up the following:



DEPENDENCIES TO INSTALL:

@react-navigation/native and @react-navigation/bottom-tabs for navigation
@react-navigation/stack for stack navigation
@supabase/supabase-js for Supabase integration
expo-av for audio recording and playback
expo-file-system for file operations
expo-image-picker for image uploads
expo-speech for text-to-speech
react-native-async-storage for local storage
react-native-dotenv for environment variables


THEME CONFIGURATION:

Primary color: #F8BBD0 (soft pink)
Secondary color: #CE93D8 (lavender)
Accent color: #FFDAB9 (peach)
Background: #FFF5F7 (light pink)
All components use 12-16px border radius
Soft shadows throughout
Motherhood-inspired warm color palette


- use ai-sdk with supabase for the assistant functionality
Providers & Integrations:
  https://ai-sdk.dev/docs/getting-started/expo
  https://ai-sdk.dev/providers/ai-sdk-providers
  https://ai-sdk.dev/providers/community-providers
  https://ai-sdk.dev/providers/adapters
  https://ai-sdk.dev/providers/observability
- Embeddings & Memory:
  https://ai-sdk.dev/docs/ai-sdk-core/embeddings#embeddings
  https://ai-sdk.dev/providers/community-providers/supermemory#supermemory
  https://supermemory.ai/docs/intro

Create a theme configuration file that exports these colors and styling constants for use throughout the app.
```

Prompt 2: Navigation Structure

```
Create a React Native navigation structure for a pregnancy tracking app with:



NAVIGATION HIERARCHY:

Root Navigator (Stack):
Welcome Screen
Login Screen
Onboarding Carousel
Main App (Tab Navigator)


Bottom Tab Navigator (shown after authentication):
Home Tab (Home icon)
Assistant Tab (MessageCircle icon)
Track Tab (ClipboardList icon) - nested stack with:
Symptom Log
Kick Counter
Nutrition Coach
Goals & Achievements
Alerts
Profile Tab (User icon)


STYLING REQUIREMENTS:

Bottom tabs with soft pink (#F8BBD0) active color
Rounded top corners on tab bar
Active tab indicator (pink line on top)
Icon scaling animation on active
White background with subtle shadow


Use @react-navigation/bottom-tabs and @react-navigation/stack. Include proper TypeScript types for navigation props.
```

---

🔐 Authentication & Context

Prompt 3: AuthContext for React Native

```
Convert a web AuthContext to React Native Expo with:



CONTEXT FEATURES:

User state management (id, email, name)
Access token storage using AsyncStorage
Sign up function calling Supabase edge function at /signup endpoint
Sign in with email/password using Supabase auth
Sign out with session cleanup
Auto-restore session on app launch from AsyncStorage
Loading state during session check


SUPABASE INTEGRATION:

Import from '@supabase/supabase-js'
Use environment variables for SUPABASE_URL and SUPABASE_ANON_KEY
Handle auth state persistence with AsyncStorage
Properly typed TypeScript interfaces for User and AuthContext


ERROR HANDLING:

Network errors with user-friendly messages
Invalid credentials handling
Session expiration
Token refresh logic


Include proper React Native AsyncStorage imports and error boundaries.
```

---

🌐 API & Supabase Integration

Prompt 4: API Utility for React Native

```
Convert web API utility to React Native with fetch calls to Supabase Edge Functions:



BASE URL: `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-058278d0`



API METHODS TO IMPLEMENT:

getProfile(accessToken) - GET /profile
updateProfile(data, accessToken) - PUT /profile
saveSymptom(data, accessToken) - POST /symptoms
getSymptoms(accessToken) - GET /symptoms
saveKick(data, accessToken) - POST /kicks
getKicks(accessToken) - GET /kicks
saveNutrition(data, accessToken) - POST /nutrition
getNutrition(date, accessToken) - GET /nutrition?date=
saveGoals(data, accessToken) - POST /goals
getGoals(accessToken) - GET /goals
saveAlert(data, accessToken) - POST /alerts
getAlerts(accessToken) - GET /alerts
sendMessage(message, conversationHistory, accessToken) - POST /chat
transcribeAudio(audioBlob, accessToken) - POST /transcribe
analyzeImage(imageUri, question, accessToken) - POST /analyze-image


ERROR HANDLING:

Network connectivity errors
Timeout handling (30s timeout)
JSON parsing errors
401 Unauthorized (redirect to login)
Generic error fallbacks with user-friendly messages


Use TypeScript interfaces for all request/response types. Include proper Authorization headers with Bearer tokens.
```

Prompt 5: Supabase Client Setup

````
Create a Supabase client singleton for React Native:



REQUIREMENTS:

Import createClient from '@supabase/supabase-js'
Use expo-constants for environment variables
Store SUPABASE_URL and SUPABASE_ANON_KEY
Configure AsyncStorage for session persistence
Enable auto-refresh for auth tokens
Proper TypeScript typing


CONFIGURATION:
```typescript
const supabaseUrl = Constants.expoConfig.extra.SUPABASE_URL
const supabaseAnonKey = Constants.expoConfig.extra.SUPABASE_ANON_KEY
````

Create singleton pattern to prevent multiple instances. Export createClient function that returns the configured Supabase client.

```

---

## 🤖 AI SDK Integration (Streaming AI with Supabase Memory)

Prompt 5b: AI SDK Setup with OpenAI Provider

```

⚠️ **DEPRECATED** - Use Supabase Edge Functions instead

### Previous Setup (DEPRECATED - Do Not Use)

These sections describe the old local AI library approach that has been REMOVED and replaced with Supabase Edge Functions.

❌ **SETUP FILE: lib/ai-client.ts** - DELETED

- This file initialized OpenAI models locally
- Functionality now in Edge Function: `supabase/functions/chat-handler`

❌ **MEMORY SETUP: lib/ai-memory.ts** - DELETED

- This file managed conversation memory and embeddings locally
- Functionality now in Edge Function: `supabase/functions/chat-handler`
- Embeddings stored in: `supabase/functions/memory-store`

### Current Architecture (Use This)

All AI operations now use **Supabase Edge Functions** accessed via `lib/supabase-api.ts`:

```typescript
// ✅ CORRECT: Use unified API client
import { sendChatMessage, getConversationHistory } from "@/lib/supabase-api";

// All AI logic happens in chat-handler Edge Function
const response = await sendChatMessage(messages, userId);
```

🔒 **Benefits of Edge Functions**:

- Private API keys stay on backend only
- Single source of truth - no code duplication
- Automatic RLS policy enforcement
- Easy to update without app redeployment
- Centralized logging and monitoring

---

**Old Documentation Archive** (Reference Only - Don't Implement)

The following was the previous local implementation approach. It is documented here for historical reference only. DO NOT create these files or use this approach.

DEPRECATED: lib/ai-client.ts would have contained:

```typescript
// ❌ DEPRECATED - This code should NOT be created
// Use supabase-api.ts and Edge Functions instead
import { openai } from "@ai-sdk/openai";
export const aiModel = openai("gpt-4o-mini");
export const embeddingModel = openai.textEmbeddingModel(
  "text-embedding-3-small"
);
```

DEPRECATED: lib/ai-memory.ts would have contained:

```typescript
// ❌ DEPRECATED - This code should NOT be created
// Use supabase-api.ts and chat-handler Edge Function instead
import { embed, embedMany } from "ai";
export async function saveConversationLocally(userId, messages) {
  // This approach stored data locally only
  // Now Edge Functions handle all persistence
}
  query: string,
  limit: number = 2
) {
  // Load user's conversation history
  const conversations = await loadConversationFromDatabase(userId);

  // Embed the current query
  const { embedding: queryEmbedding } = await embed({
    model: embeddingModel,
    value: query,
  });

  // Find most similar using cosine similarity
  const similarities = conversations.map((conv) => ({
    conv,
    similarity: cosineSimilarity(queryEmbedding, conv.embedding),
  }));

  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// Prepare memory context for AI response
export async function prepareMemoryContext(
  userId: string,
  currentMessage: string
) {
  // Load recent conversation history (last 100 messages)
  const recentMessages = await loadConversationFromDatabase(
    userId,
    undefined,
    100
  );

  // Find similar past conversations for context (RAG pattern)
  const similar = await findSimilarConversations(userId, currentMessage, 2);

  // Build context string
  let context = "\nRELEVANT PREVIOUS CONTEXT:\n";
  similar.forEach((s, i) => {
    context += `\n${i + 1}. ${s.conv.messages
      .map((m) => m.content)
      .join(" / ")}`;
  });

  return context;
}

// Save conversation to Supabase
export async function saveConversationToDatabase(
  userId: string,
  messages: ConversationMessage[]
) {
  const { error } = await supabase.from("conversations").insert({
    user_id: userId,
    messages,
    embedding: messages.length > 0 ? messages[0].embedding : null,
    updated_at: new Date().toISOString(),
  });

  if (error) console.error("Save conversation error:", error);
}

// Load from Supabase
export async function loadConversationFromDatabase(
  userId: string,
  limit: number = 100
) {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}
```

❌ **DEPRECATED API ROUTE: app/api/chat+api.ts** - DELETED

This file previously handled chat streaming locally. The functionality is now in the Edge Function: `supabase/functions/chat-handler`.

```typescript
// ❌ DEPRECATED - DO NOT CREATE
// This was the old local implementation using AI SDK
// import { streamText } from "ai";
// import { aiModel, MOTHERLY_SYSTEM_PROMPT } from "@/lib/ai-client";
// export async function POST(request: Request) {
//   // This approach processed everything on the server
//   // Now moved to Supabase Edge Functions for better security
// }
```

✅ **Current Implementation**: Use `lib/supabase-api.ts` instead

```typescript
// ✅ CORRECT - Use Edge Function via API client
import { sendChatMessage } from "@/lib/supabase-api";

const response = await sendChatMessage(
  messages,
  userId,
  conversationId,
  true // include memory context
);
```

SUPABASE SCHEMA:

```sql
-- Modern approach: Let Edge Functions handle all logic
-- Database tables for storing results only

create table conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id),
  messages jsonb not null,
  embedding vector(1536),
  topics text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index conversations_user_id on conversations(user_id);

-- Enable RLS
alter table conversations enable row level security;
create policy conversations_user_access on conversations
  for select using (auth.uid() = user_id);
```

POLYFILLS: polyfills.ts

```typescript
import { Platform } from "react-native";

if (Platform.OS !== "web") {
  async function setupPolyfills() {
    try {
      // structuredClone polyfill
      if (!global.structuredClone) {
        const mod = await import("@ungap/structured-clone");
        global.structuredClone = mod.default;
      }

      // Stream text encoding polyfills
      const streamMod = await import("@stardazed/streams-text-encoding");
      if (!global.TextEncoderStream)
        global.TextEncoderStream = streamMod.TextEncoderStream;
      if (!global.TextDecoderStream)
        global.TextDecoderStream = streamMod.TextDecoderStream;
    } catch (e) {
      console.debug("Polyfills not available", e);
    }
  }

  setupPolyfills();
}
export {};
```

Import in app/\_layout.tsx: `import "@/polyfills";`

````

❌ **DEPRECATED**: AI SDK React Integration with useChat Hook - DO NOT USE

The old approach used `useChat` hook from `@ai-sdk/react` to handle streaming. This is now replaced with direct Edge Function calls via `lib/supabase-api.ts`.

Old implementation (DO NOT CREATE):
```typescript
// ❌ DEPRECATED - DO NOT USE
// import { useChat } from "@ai-sdk/react";
// import { DefaultChatTransport } from "ai";
// This approach required local API routes which are now removed
````

✅ **Current Assistant Screen**: app/(tabs)/assistant.tsx

Uses `sendChatMessage()` from `lib/supabase-api.ts`:

```typescript
import { sendChatMessage, getConversationHistory } from "@/lib/supabase-api";
import { useAuth } from "@/hooks/use-auth";

export default function AssistantScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = async (content: string) => {
    setIsProcessing(true);
    try {
      // All AI logic happens in Edge Function
      const response = await sendChatMessage(
        [...messages, { role: "user" as const, content }],
        user.id,
        conversationId,
        true // include memory/RAG context
      );

      // Edge Function handles streaming, memory, RAG all automatically
      if (response?.message) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant" as const, content: response.message },
        ]);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View>
      <FlatList data={messages} renderItem={renderMessage} />
      <ChatInput onSend={handleSendMessage} isLoading={isProcessing} />
    </View>
  );
}
```

KEY FEATURES (All in Edge Function):

1. ✅ Streaming responses (gpt-4o-mini)
2. ✅ Automatic memory context (RAG - Retrieval Augmented Generation)
3. ✅ Conversation history management
4. ✅ Pregnancy data enrichment
5. ✅ Error handling and retries

---

### Advanced: Semantic Search with Embeddings (Edge Function)

❌ **DEPRECATED**: Local embedding generation - DO NOT DO THIS

Old approach (DO NOT CREATE):

```typescript
// ❌ DEPRECATED
// import { cosineSimilarity } from "ai";
// export async function findRelatedTopics(query: string) {
//   // Local embedding generation is expensive and slow
// }
```

✅ **Current Approach**: Edge Functions handle all embeddings

The `chat-handler` Edge Function:

- Generates embeddings server-side
- Performs vector similarity search in Supabase
- Injects relevant context automatically
- Manages cost tracking

All via single call:

```typescript
const response = await sendChatMessage(
  messages,
  userId,
  conversationId,
  true // includeMemory=true triggers RAG automatically
);
```

---

### Polyfills (If Needed)

Modern Edge Functions don't require client-side AI SDK polyfills. The `lib/supabase-api.ts` handles all HTTP communication.

If you need polyfills for other reasons (Web APIs, streams, etc.), add to `polyfills.ts`:

```typescript
import { Platform } from "react-native";

if (Platform.OS !== "web") {
  // Add polyfills here if needed for third-party libraries
  // Most modern code doesn't require these anymore
}
```

---

**Summary: Migration Complete** ✅

```
OLD ARCHITECTURE                  NEW ARCHITECTURE
=====================================
Local: ai-client.ts        →  Edge Function: chat-handler
Local: ai-memory.ts        →  Edge Function: memory-store
Local: /api/chat route     →  Edge Function: chat-handler
Local: embeddings          →  Edge Function: embedding-search
App UI                     →  lib/supabase-api.ts wrapper
                           →  Supabase Edge Functions
                           →  OpenAI APIs (backend only)
```

All local AI code has been **DELETED** and replaced with Supabase Edge Functions for security, simplicity, and maintainability.

````

TRANSCRIPTION (SPEECH-TO-TEXT):

Use AI SDK's experimental_transcribe for voice input:

```typescript
import { experimental_transcribe as transcribe } from "ai";

async function transcribeAudio(audioUri: string) {
  const buffer = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const transcript = await transcribe({
    model: openai.transcription("whisper-1"),
    audio: buffer,
  });

  return transcript.text;
}
```

SPEECH GENERATION (TEXT-TO-SPEECH):

```typescript
import { experimental_generateSpeech as generateSpeech } from "ai";

async function speakAIResponse(text: string) {
  const audio = await generateSpeech({
    model: openai.speech("tts-1"),
    text,
    voice: "alloy", // warm, friendly voice
  });

  // Play audio
  const sound = new Audio.Sound();
  await sound.loadAsync({ uri: audio.audioData });
  await sound.playAsync();
}
```

TOOL CALLING FOR STRUCTURED RESPONSES:

```typescript
import { tool } from "ai";
import { z } from "zod";

const symptomTool = tool({
  description: "Log a pregnancy symptom with severity",
  inputSchema: z.object({
    symptom: z.string(),
    severity: z.number().min(1).max(5),
    notes: z.string().optional(),
  }),
  execute: async (params) => {
    // Save to database
    await saveSymptom(params);
    return `Logged: ${params.symptom}`;
  },
});

// Use in streamText
const result = streamText({
  model: aiModel,
  messages,
  tools: { symptom_logger: symptomTool },
});
```

PROVIDER SWITCHING:

```typescript
// Easy switch between providers by changing environment variable
const providers = {
  openai: () => openai("gpt-4o-mini"),
  anthropic: () => anthropic("claude-3-5-sonnet-20241022"),
  google: () => google("gemini-2.0-flash"),
};

const selectedProvider = process.env.EXPO_PUBLIC_AI_PROVIDER || "openai";
export const aiModel = providers[selectedProvider]();
```

```

---

```

```



---



📱 Screen Components


Prompt 6: WelcomeScreen Component
```

Create a React Native Welcome Screen for a pregnancy app:

LAYOUT:

Full screen gradient background (pink #F8BBD0 to peach #FFDAB9)
Centered content with SafeAreaView
Heart icon (24x24) with small circle overlay (design: heart with dot inside)
App name "MomCare" in large text
Tagline "Your AI Pregnancy Companion"
Large rounded "Get Started" button (white bg, dark text, 16px radius)

STYLING:

Use LinearGradient from expo-linear-gradient
Shadow on button
Smooth animations on mount (fade in)
Pressable button with scale animation on press

NAVIGATION:

onPress of "Get Started" navigates to Login screen

Use React Native's View, Text, Pressable, StyleSheet. Include proper TypeScript typing for navigation props.

```



Prompt 7: LoginScreen Component
```

Create a React Native Login/Signup screen:

UI ELEMENTS:

Gradient background (pink to peach)
White rounded card (24px radius) with shadow
Toggle between Sign In / Sign Up modes
Form fields:
Full Name (only in signup mode) with UserIcon
Email with MailIcon
Password with LockIcon
Error message display (red background, rounded)
Submit button (pink, disabled state when loading)
Toggle text "Already have account? Sign In" / "Don't have account? Sign Up"

FUNCTIONALITY:

useAuth hook for signIn/signUp
Form validation (name required for signup)
Loading spinner during authentication
Error handling with user-friendly messages
Auto-navigate to Onboarding on successful login

ICONS: Use @expo/vector-icons or react-native-vector-icons

STYLING:

TextInput with custom styling
Rounded inputs (12px radius)
Icon positioning (absolute left)
Keyboard avoiding view for iOS
TouchableOpacity for toggle button

```


Prompt 8: OnboardingCarousel Component
```

Create a React Native onboarding carousel with 3 slides:

SLIDES DATA:

AI Assistant - MessageCircle icon - "Get instant answers to pregnancy questions"
Smart Reminders - Bell icon - "Never miss vitamins, appointments, health checks"
Track Everything - Activity icon - "Monitor symptoms, kicks, nutrition, wellness"

IMPLEMENTATION:

Use react-native-snap-carousel or FlatList with pagingEnabled
Gradient icon backgrounds (pink to purple, 32x32 rounded squares)
Page indicator dots (active is wider, pink color)
Next/Previous buttons
"Start My Journey" button on last slide
Smooth animations between slides

STYLING:

Centered content
Large icons (16x16 inside colored squares)
Readable text hierarchy
Bottom-aligned navigation
Pink accent color (#F8BBD0)

Navigate to Home screen on completion.

```



Prompt 9: HomeDashboard Component
```

Create a React Native Home Dashboard:

LAYOUT SECTIONS:

Header with gradient background (pink to light pink, rounded bottom 32px):
"Hello, {userName} 👋"
"Week 26 • 2nd Trimester"

Weekly Status Card (offset negative margin):
Mango emoji (large)
"Baby is as big as a mango!"
"About 14 inches long"
ChevronRight navigation to chat

Feature Grid (2 columns):
Ask AI Assistant (purple bg) → chat
Log Symptom (peach bg) → symptom
Kick Counter (pink bg) → kicks
My Goals (green bg) → goals

Quick Tips (scrollable cards):
"Eat iron-rich foods..."
"Stay hydrated..."
"Watch for swelling..."

STYLING:

ScrollView with SafeAreaView
Rounded cards (16px radius)
Shadow on cards
Touchable with press animation
Color-coded icons
Left border accent on tips

FUNCTIONALITY:

Load user name from AuthContext
Navigate to respective screens on card press
Pull-to-refresh capability

```


Prompt 10: AssistantChat Component
```

Create a React Native AI chat screen with multimodal capabilities:

UI COMPONENTS:

Header (pink gradient):
"AI Assistant" title
Subtitle: "Ask me anything about your pregnancy"

Message List (FlatList):
User messages: right-aligned, peach background
AI messages: left-aligned, white background with shadow
Image previews for uploaded images
"Listen" button on AI messages (text-to-speech)
Loading indicator (3 bouncing dots) while AI responds

Input Area (bottom, sticky):
Voice recorder button (mic icon, pulsing when recording)
Image upload button (camera icon)
Text input (flex: 1)
Send button (pink circle)

FUNCTIONALITY:

Voice Recording:
Use expo-av Audio.Recording
Request microphone permissions
Show recording duration
Stop and upload to /transcribe endpoint
Display transcribed text in input

Image Upload:
Use expo-image-picker
Convert to base64
Send to /analyze-image endpoint
Display image in chat with AI analysis

Text-to-Speech:
Use expo-speech
Cancel previous speech before starting new
Visual feedback (speaking icon)

Chat API:
Send to /chat endpoint with conversation history
Maintain last 10 messages for context
Handle loading states
Error handling with retry

SAMPLE QUESTIONS:

Display 3 sample questions when conversation is empty
Populate input on tap (don't auto-send)

STYLING:

Max message width 80%
Rounded messages (16px)
KeyboardAvoidingView for iOS
Inverted FlatList (messages bottom-up)
Smooth animations

```


Prompt 11: SymptomLog Component
```

Create a React Native symptom logging screen:

HEADER:

Purple gradient background (rounded bottom)
"Log Today's Symptoms"
Current date with calendar icon

FORM INPUTS:

Mood Slider:
5 emoji states: 😢 😟 😐 😊 😄
Slider (0-4 range)
Large selected emoji, others dimmed
Use @react-native-community/slider

Blood Pressure:
Two side-by-side inputs
Systolic / Diastolic labels
Numeric keyboard type
"/" separator between

Weight & Sleep (2 columns):
Weight (kg) - numeric input
Sleep (hrs) - numeric input

Notes:
Multiline TextInput (4 rows)
Placeholder: "Any other symptoms..."

Action Buttons:
"Save Log" (pink, with save icon)
Success state (green background, checkmark)
"AI Review My Logs" (white with purple border, sparkles icon)

FUNCTIONALITY:

Save to /symptoms endpoint
Include date, mood (0-4), BP object, weight, sleep, notes
Show success feedback (green card for 3 seconds)
Clear form after save option
Validation for required fields

STYLING:

ScrollView with KeyboardAwareScrollView
Rounded inputs (12px)
Card-based sections
Consistent padding
Light pink backgrounds on inputs

```


Prompt 12: KickCounter Component
```

Create a React Native kick counter screen:

UI LAYOUT:

Header (gradient pink to purple):
"Track Baby Kicks"
"Tap the button when you feel a kick"

Timer Display (card):
Large time format: MM:SS
"Time Elapsed" label

Kick Count (card):
Giant number (72px font)
Pink color (#F8BBD0)
"Kick Count" label

Status Badge:
✅ "Normal range" (green) if >= 10 kicks
⏱️ "Keep tracking" (orange) if 5-9 kicks
👶 "Start counting" (gray) if < 5 kicks

Main Kick Button:
Large circular button (192px diameter)
👣 emoji (large)
Gradient background (pink)
Ripple effect on press
Centered

Control Buttons (row):
Play/Pause button (toggle timer)
Reset button (restart counter)

Save Button:
"Finish & Save"
Only show if kicks > 0
Saves to /kicks endpoint

FUNCTIONALITY:

Timer: Use setInterval, start on first kick
Auto-start timer on first kick press
Kick button always pressable (increments count)
Save includes: kickCount, duration (seconds), date
Success feedback then auto-reset after 2s
Info card: "You should feel at least 10 movements within 2 hours"

ANIMATIONS:

Button scale on press
Ripple effect
Number count animation
Success confetti (optional with react-native-confetti-cannon)

```


Prompt 13: NutritionCoach Component
```

Create a React Native nutrition tracking screen:

SECTIONS:

Today's Focus Card (gradient pink to purple):
Apple icon
"Today's Focus" heading
Nutrition tip: "Add iron-rich foods like spinach, lentils..."

Water Intake Card:
Droplets icon + "Water Intake" title
"+ Glass" button (purple)
Progress bar showing X/8 glasses
8 water glass visualization (filled vs empty)
Filled glasses show 💧 emoji
Empty glasses are dashed borders

Daily Nutrition Checklist:
4 items with emoji, text, checkbox
🥬 "Add 1 bowl of leafy greens" - checkmark or circle
🥜 "Snack on nuts for protein"
🥛 "Have 3 servings of dairy"
🍊 "Eat vitamin C rich fruits"
Completed items: strikethrough text, green background

Today's Meals Card:
List of logged meals
"+ Add Meal" button
Each meal: 🍱 emoji + meal name

AI Ask Button:
"Ask: Is my diet okay today?"
Sparkles icon
White background, peach border

Sample Weekly Menu (collapsible):
Breakfast, Lunch, Snack, Dinner suggestions
Scrollable

FUNCTIONALITY:

Load nutrition data from /nutrition endpoint (by date)
Add water: increment count, save to backend
Toggle checklist items (local state + save)
Meals input modal
Persist data daily

STYLING:

ScrollView
Rounded cards
Color-coded backgrounds
Progress animations

```


Prompt 14: GoalsAchievements Component
```

Create a React Native goals and achievements screen:

HEADER:

Green gradient (success colors)
"Goals & Achievements"
"Track your progress and celebrate wins!"

WEEKLY GOALS SECTION:

Card with Target icon
"Weekly Goals" title
4 progress items:
💧 Drink 2L water daily - 4/7 progress
📝 Log symptoms daily - 6/7 progress
👣 Track kicks 3x/week - 2/3 progress
😊 Mood journaling - 5/7 progress
Each has:
Emoji + label
Progress bar (peach color)
X/Y completion text

ACHIEVEMENTS GRID:

Trophy icon + "Achievements" title
2 column grid of badges
Each badge:
Circular icon background (color-coded)
Award icon (or lock icon if not earned)
Badge title
Description
Checkmark overlay if earned
Opacity 60% if not earned

BADGES:

Hydration Hero (purple) - earned
Symptom Logger Pro (pink) - earned
Kick Counter (peach) - earned
Wellness Warrior (gray) - locked
Nutrition Champion (gray) - locked
Sleep Master (gray) - locked

MOTIVATION CARD:

Gradient background (pink to purple)
🎉 emoji
"You're doing great!"
Progress summary text

WEEKLY CHALLENGE:

Light pink background
"💡 Weekly Challenge"
Challenge description
Progress bar to unlock next badge

FUNCTIONALITY:

Load from /goals endpoint
Real-time progress updates
Achievement unlock animations
Confetti on new achievement

STYLING:

ScrollView
Grid layout (2 columns)
Circular badges
Gradient cards
Shadow effects

```


Prompt 15: Profile Component
```

Create a React Native profile and settings screen:

HEADER:

Purple to pink gradient
Rounded bottom (32px)
User avatar (circular, 96px)
User name from AuthContext
"Week 26 • 3rd Trimester"
Due date: "February 14, 2026"
Email address (if available)

SECTIONS:

Personal Information Card:
Age: 28 years
Height: 165 cm
Pre-pregnancy weight: 58 kg
Current weight: 65 kg
"Edit Information" button (pink text)

Medical Information Card:
Toggle switches for conditions:
Gestational Diabetes (off)
High Blood Pressure (off)
Vegetarian Diet (on)
Use Switch component from react-native

Notifications Card:
Bell icon + "Notifications" title
3 toggle switches:
Push Notifications (on) - "Receive app notifications"
Pill Reminders (on) - "Daily vitamin reminders"
Kick Count Reminders (off) - "Remind to track baby kicks"
Each has title + subtitle

Preferences Card:
Language selector → "English" with ChevronRight
Theme selector → "Motherhood (Pink)" with ChevronRight
Globe and Palette icons

About Section:
"MomCare v1.0.0"
Privacy Policy link
Terms of Service link

Sign Out Button (if logged in):
Full width
White background
Red border (#EF9A9A)
Red text
LogOut icon
Calls signOut from AuthContext

FUNCTIONALITY:

Load profile from /profile endpoint
Update toggles save to backend
Navigation to edit screens
Confirmation dialog on sign out

STYLING:

ScrollView with SafeAreaView
Rounded cards
Proper spacing
Icon alignment

```


Prompt 16: Alerts Component
```

Create a React Native alerts and notifications screen:

HEADER:

Red/pink gradient (#EF9A9A)
"Alerts & Reminders"
"Important health notifications"

ALERT ITEMS (FlatList):
Each alert card:

Icon background (colored square, 12px radius)
Alert icon (warning, info, or bell)
Title (large text)
Date/time
Message description
"View Details →" link
Border-left accent color

SAMPLE ALERTS:

Blood Pressure High (warning - red):
AlertTriangle icon
"Aug 24, 2025"
"Your BP reading of 145/95 is higher than normal..."

No Kick Count (info - orange):
Info icon
"Aug 22, 2025"
"You haven't tracked baby kicks recently..."

Appointment Reminder (info - purple):
AlertCircle icon
"Tomorrow"
"Prenatal checkup at 10:00 AM with Dr. Smith"

EMERGENCY CONTACTS CARD:

Gradient background (pink to purple)
Phone icon
"Emergency Contacts" title
Dr. Smith (OB-GYN) - "Call" button
Emergency: 911 - "Call" button
Use Linking.openURL('tel:911')

WHEN TO SEEK CARE CARD:

Light pink background
"⚠️ When to Seek Immediate Care"
Bullet list:
Severe headache or vision changes
Heavy vaginal bleeding
Severe abdominal pain
Decreased fetal movement
Signs of preterm labor
"Talk to AI About Symptoms" button

FUNCTIONALITY:

Load alerts from /alerts endpoint
Mark as read on tap
Navigate to detail screen
Phone call integration
Pull to refresh

STYLING:

ScrollView
Card shadows
Color-coded alerts
Touchable cards with press feedback

```


---



🧩 Reusable Components


Prompt 17: RoundedCard Component
```

Create a reusable RoundedCard component for React Native:

PROPS:

children: ReactNode
onPress?: () => void (optional)
className/style?: custom styling
backgroundColor?: string (default white)

FEATURES:

16px border radius
White background (or custom)
Subtle shadow (elevation 2 on Android, shadowOpacity 0.1 on iOS)
Padding: 16px
If onPress provided:
Use Pressable instead of View
Add press animation (scale 0.98)
Add ripple effect (Android)
Change shadow on press

USAGE:

```tsx
<RoundedCard onPress={() => navigate("Chat")}>
  <Text>Content</Text>
</RoundedCard>
```

Export as default. Use TypeScript for props interface.

```



Prompt 18: CircleIconButton Component
```

Create a circular icon button for React Native:

PROPS:

children: ReactNode (icon)
onPress: () => void
size?: 'sm' | 'md' | 'lg' (default 'md')
variant?: 'primary' | 'secondary' | 'accent'
isAnimating?: boolean (for pulse effect)

SIZES:

sm: 40px diameter
md: 48px diameter
lg: 64px diameter

VARIANTS:

primary: #F8BBD0 background
secondary: #CE93D8 background
accent: #FFDAB9 background

FEATURES:

Circular (borderRadius: size/2)
Shadow
Pressable with scale animation
If isAnimating: pulse animation using Animated API
Centered icon

Use Animated.View for pulse effect. TypeScript interface for props.

```



Prompt 19: ProgressPill Component
```

Create a progress bar component for React Native:

PROPS:

current: number
total: number
label: string
color?: string (default #FFDAB9 peach)

LAYOUT:

Label and "X/Y" on same row (space between)
Progress bar below (height 8px, rounded full)
Background: light pink (#FFF5F7)
Foreground: color prop, animated width

ANIMATION:

Use Animated.View
Animate width change smoothly (300ms)
Percentage: (current/total) \* 100

USAGE:

```tsx
<ProgressPill current={4} total={7} label="Drink water daily" />
```

TypeScript props interface. Export as default.

```



Prompt 20: VoiceRecorder Component
```

Create a voice recorder component for React Native using expo-av:

PROPS:

onTranscription: (text: string) => void

STATE:

isRecording: boolean
recordingDuration: number (seconds)

FUNCTIONALITY:

Request Permissions:
Use Audio.requestPermissionsAsync()
Show alert if denied

Recording:
Use Audio.Recording
Configure: Audio.RecordingOptionsPresets.HIGH_QUALITY
Start/stop on button press
Update duration every second

Transcription:
Convert recording to base64
Send to /transcribe endpoint
Call onTranscription with result text
Handle errors (show alert)

UI:

CircleIconButton
Mic icon (normal state)
Square icon (recording state)
Pulse animation when recording
Red/orange color when recording
Duration timer display (optional)

ERROR HANDLING:

Permission denied: alert with instructions
Transcription failed: fallback message
Network errors

Use expo-av Audio.Recording. Export as default component.

```



---



🤖 AI Features Implementation


Prompt 21: Chat with OpenAI GPT-4o-mini
```

Implement AI chat functionality in React Native for the AssistantChat screen:

REQUIREMENTS:

Maintain conversation history (array of messages)
Send user message + last 10 messages to /chat endpoint
Display loading indicator while waiting
Handle multimodal input (text, voice, image)

MESSAGE FLOW:

User types or speaks message
Add user message to chat UI
Show loading dots
POST to /chat with:
message: string
conversationHistory: array (last 10)
Receive AI response
Add to chat and conversationHistory
Hide loading

ERROR HANDLING:

Network failure: retry option
Timeout (30s): cancel and show error
Invalid response: generic fallback message
OpenAI API errors: helpful error message

CONVERSATION PERSISTENCE:

Store in AsyncStorage with user ID
Load on component mount
Clear on sign out

STATE MANAGEMENT:

messages: array of {role, content, timestamp}
loading: boolean
conversationHistory: for API context

Use React hooks (useState, useEffect) and proper TypeScript typing.

```



Prompt 22: Voice Transcription with Whisper
```

Implement voice-to-text transcription using OpenAI Whisper for React Native:

AUDIO RECORDING SETUP:

Import expo-av Audio
Request permissions: Audio.requestPermissionsAsync()
Configure recording options:

```typescript
Audio.RecordingOptionsPresets.HIGH_QUALITY;
```

RECORDING FLOW:

Start recording: Audio.Recording.createAsync()
Track duration with timer
Stop recording: recording.stopAndUnloadAsync()
Get URI: recording.getURI()

TRANSCRIPTION:

Read file as base64 or blob
Create FormData:
audio: File/Blob
model: 'whisper-1'
POST to /transcribe endpoint
Extract text from response
Populate text input with transcribed text

ERROR HANDLING:

Microphone permission denied
Recording failed
API errors
No speech detected

UI FEEDBACK:

Recording indicator (pulsing red circle)
Duration timer
Waveform animation (optional)
Success/error toast messages

Use expo-file-system for file operations. Proper cleanup on unmount.

```



Prompt 23: Image Analysis with GPT-4o-mini Vision
```

Implement image upload and AI analysis for React Native:

IMAGE SELECTION:

Use expo-image-picker
Request permissions: ImagePicker.requestMediaLibraryPermissionsAsync()
Launch picker:

```typescript
ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
  base64: true,
});
```

IMAGE PROCESSING:

Get base64 or URI from result
Compress if > 5MB (use expo-image-manipulator)
Convert to base64 if needed

AI ANALYSIS:

Display image preview in chat
Add loading state
POST to /analyze-image:
imageUrl: base64 data URI
question: "Please analyze this image..."
Receive AI analysis
Display in chat bubble

USE CASES:

Ultrasound images
Food labels
Medication packages
Exercise postures
Skin conditions (rashes, etc.)

ERROR HANDLING:

Image too large
Invalid format
API errors
Vision API not available

Show progress indicator. Handle cancellation.

```



Prompt 24: Text-to-Speech Implementation
```

Implement text-to-speech for AI responses in React Native using expo-speech:

FEATURES:

"Listen" button on each AI message
Play AI response out loud
Stop previous speech before new one
Visual indicator when speaking

IMPLEMENTATION:

```typescript
import * as Speech from "expo-speech";

const speakText = async (text: string) => {
  // Stop any ongoing speech
  await Speech.stop();

  // Speak with options
  await Speech.speak(text, {
    language: "en-US",
    pitch: 1.1,
    rate: 0.9,
    voice: "female", // if available
  });
};
```

UI FEATURES:

Speaker icon on AI messages
Play icon (default) / Speaking animation (active)
Volume control (optional)
Pause/resume (optional)

CONFIGURATION:

Warm, motherly voice settings
Appropriate speech rate for comprehension
Slightly higher pitch for feminine tone
Clear enunciation

ERROR HANDLING:

TTS not available
Language not supported
Interruption handling

CLEANUP:

Stop speech on:
Component unmount
User navigates away
New message sent
User taps stop

Use Speech.isSpeakingAsync() to check state. Proper async/await handling.

```



---



🔧 Backend / Supabase Functions


Prompt 25: Server Index - Main Routes
```

For the Supabase Edge Function server (Deno), implement these routes in index.tsx:

SETUP:

Import Hono framework
Enable CORS
Add logger middleware
Create Supabase admin client with SERVICE_ROLE_KEY

AUTH MIDDLEWARE:

Extract Bearer token from Authorization header
Verify with supabase.auth.getUser(token)
Attach userId to context
Return 401 if invalid

ROUTES TO IMPLEMENT:

POST /signup - Create user, initialize profile in KV store
GET /profile - Return user profile
PUT /profile - Update user profile
POST /symptoms - Save symptom log
GET /symptoms - Get all user symptom logs
POST /kicks - Save kick count
GET /kicks - Get kick count history
POST /nutrition - Save nutrition data (daily)
GET /nutrition?date= - Get nutrition for specific date
POST /goals - Save/update goals
GET /goals - Get user goals
POST /alerts - Create alert
GET /alerts - Get user alerts
POST /chat - AI chat with OpenAI GPT-4o-mini
POST /transcribe - Whisper speech-to-text
POST /analyze-image - GPT-4o-mini Vision image analysis

ERROR HANDLING:

Log all errors with console.log
Return JSON errors with proper status codes
Include error messages in response

Each route should use KV store for data persistence. Prefix all keys with userId.

```



Prompt 26: AI Chat Endpoint Implementation
```

Implement POST /chat endpoint in Supabase Edge Function:

REQUEST BODY:

message: string
conversationHistory: array of {role, content}

IMPLEMENTATION STEPS:

Extract userId from auth middleware
Load user context:
Profile: kv.get(`profile:${userId}`)
Recent symptoms: kv.getByPrefix(`symptom:${userId}:`)
Goals: kv.get(`goals:${userId}`)

Build system prompt:
Import MOTHERLY_SYSTEM_PROMPT
Use buildUserContext() function
Append user data to prompt

Prepare messages for OpenAI:

```typescript
const messages = [
  { role: "system", content: systemPrompt + userContext },
  ...conversationHistory.slice(-10),
  { role: "user", content: message },
];
```

Call OpenAI API:
URL: https://api.openai.com/v1/chat/completions
Model: gpt-4o-mini (fallback to gpt-3.5-turbo)
Temperature: 0.7
Max tokens: 500
Authorization: Bearer ${OPENAI_API_KEY}

Extract response: data.choices[0].message.content
Return: { response: string }

ERROR HANDLING:

Missing API key: return friendly fallback
Model not found: retry with gpt-3.5-turbo
Rate limit: return error message
Network errors: log and return error

Use environment variable OPENAI_API_KEY from Deno.env.

```



Prompt 27: Transcribe Endpoint (Whisper)
```

Implement POST /transcribe endpoint for speech-to-text:

REQUEST:

Form data with audio file
Field name: 'audio'
Supported formats: webm, mp4, mp3, wav

IMPLEMENTATION:

Extract audio file from formData:

```typescript
const formData = await c.req.formData();
const audioFile = formData.get("audio");
```

Validate file:
Check size (< 25MB)
Check type (audio/\*)

Forward to OpenAI Whisper:
URL: https://api.openai.com/v1/audio/transcriptions
FormData: audio file + model: 'whisper-1'
Authorization: Bearer ${OPENAI_API_KEY}

Extract transcription: data.text
Return: { text: string }

ERROR HANDLING:

No file provided: 400 error
File too large: 413 error
Invalid format: 415 error
Whisper API errors: log and return error
No API key: return error

Log file size and type for debugging. Use Deno fetch for API call.

```



Prompt 28: Image Analysis Endpoint (GPT-4o-mini Vision)
```

Implement POST /analyze-image endpoint for image analysis:

REQUEST BODY:

imageUrl: string (base64 data URI or URL)
question: string (optional, default prompt about pregnancy)

IMPLEMENTATION:

Get userId from auth
Load user profile for context
Build prompt:
Default: "Please analyze this image and provide pregnancy-related insights"
Use custom question if provided
Include user context (week, trimester)

Call OpenAI Vision API:

```typescript
POST https://api.openai.com/v1/chat/completions
{
  model: 'gpt-4o-mini-vision-preview',
  messages: [
    {
      role: 'system',
      content: MOTHERLY_SYSTEM_PROMPT + userContext
    },
    {
      role: 'user',
      content: [
        { type: 'text', text: question },
        { type: 'image_url', image_url: { url: imageUrl } }
      ]
    }
  ],
  max_tokens: 500
}
```

Extract analysis: data.choices[0].message.content
Return: { analysis: string }

ERROR HANDLING:

Invalid image URL/format
Image too large
Vision model not available
API errors

SAFETY NOTES:

Include medical disclaimers in responses
Suggest doctor consultation for concerning images
Warm, supportive tone

```


Prompt 29: Motherly Prompt Configuration
```

Create the motherly-prompt.ts file with AI system prompt:

EXPORT 1: MOTHERLY_SYSTEM_PROMPT

Define the "Motherly" AI assistant persona
Empathetic, warm, supportive tone
Pregnancy expert with medical knowledge
Always includes disclaimers (not a doctor)
Concise for voice-first interactions
Emotional support capabilities
Safety-focused (urgent symptoms → doctor)

KEY CHARACTERISTICS:

Use emojis sparingly (💕, 🤱, 👶, 🎉)
Break long responses into shorter messages
Personalize using user name and pregnancy week
Celebrate milestones
Provide evidence-based advice
Non-judgmental, encouraging

EXPORT 2: buildUserContext() function

Takes: profile, recentLogs (symptom logs), goals
Returns: formatted string with:
User name
Current week and trimester
Due date
Age, height, weight
Recent health logs (last 3 days)
Current goals and progress
Any medical conditions

This context is appended to system prompt for personalization.

Use TypeScript. Export both as named exports.

```



Prompt 30: KV Store Utility
```

The kv_store.tsx file is already provided by the system. Document its usage:

AVAILABLE FUNCTIONS:

kv.get(key: string) - Returns single value or null
kv.set(key: string, value: any) - Stores value
kv.del(key: string) - Deletes key
kv.mget(keys: string[]) - Returns array of values
kv.mset(entries: [string, any][]) - Sets multiple
kv.mdel(keys: string[]) - Deletes multiple
kv.getByPrefix(prefix: string) - Returns all matching keys

DATA STRUCTURE CONVENTIONS:

Profile: `profile:${userId}`
Symptoms: `symptom:${userId}:${timestamp}`
Kicks: `kick:${userId}:${timestamp}`
Nutrition: `nutrition:${userId}:${date}` (YYYY-MM-DD)
Goals: `goals:${userId}`
Alerts: `alert:${userId}:${timestamp}`

USAGE EXAMPLES:

```typescript
// Save symptom
await kv.set(`symptom:${userId}:${Date.now()}`, {
  mood: 3,
  bloodPressure: { systolic: 120, diastolic: 80 },
  weight: 65,
  sleep: 7,
  notes: "Feeling good",
  createdAt: new Date().toISOString(),
});

// Get all symptoms
const symptoms = await kv.getByPrefix(`symptom:${userId}:`);

// Get nutrition for today
const today = new Date().toISOString().split("T")[0];
const nutrition = await kv.get(`nutrition:${userId}:${today}`);
```

Do NOT modify this file. It's a protected system file.

```



---



🎨 Styling & Theme


Prompt 31: Global Theme Configuration
```

Create a theme.ts file for React Native with the motherhood color palette:

EXPORT OBJECT:

```typescript
export const theme = {
  colors: {
    primary: "#F8BBD0", // Soft pink
    secondary: "#CE93D8", // Lavender
    accent: "#FFDAB9", // Peach
    surface: "#FFF5F7", // Light pink
    background: "#FFF5F7", // Light pink
    text: {
      primary: "#333333",
      secondary: "#777777",
    },
    success: "#A5D6A7", // Soft green
    warning: "#FFDAB9", // Peach
    error: "#EF9A9A", // Rosy red
    white: "#FFFFFF",
    border: "rgba(0, 0, 0, 0.08)",
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
  },

  typography: {
    // Will use default system fonts
    // Can add custom fonts later
  },
};
```

Use throughout app for consistent theming. Import as: `import { theme } from './theme'`

```



---



📦 Environment & Configuration


Prompt 32: Environment Configuration
```

Set up environment variables for React Native Expo:

CREATE app.config.js (or app.json):

```javascript
export default {
  expo: {
    name: "MomCare",
    slug: "momcare",
    version: "1.0.0",
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      SUPABASE_PROJECT_ID: process.env.SUPABASE_PROJECT_ID,
    },
  },
};
```

CREATE .env file:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_PROJECT_ID=your-project-id
```

ACCESS IN CODE:

```typescript
import Constants from "expo-constants";

const supabaseUrl = Constants.expoConfig.extra.SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig.extra.SUPABASE_ANON_KEY;
```

Add to .gitignore: .env

Install: expo-constants

Document in README: how to set up environment variables.

```



---



✅ Testing & Validation Prompts


Prompt 33: Feature Testing Checklist
```

Create comprehensive testing checklist for the React Native app:

AUTHENTICATION:

[ ] Sign up creates user and profile
[ ] Sign in loads session
[ ] Session persists on app restart
[ ] Sign out clears session
[ ] Invalid credentials show error
[ ] Network errors handled gracefully

NAVIGATION:

[ ] Bottom tabs navigate correctly
[ ] Back navigation works
[ ] Deep linking (if implemented)
[ ] Auth redirects work

DATA PERSISTENCE:

[ ] Symptom logs save and load
[ ] Kick counter saves data
[ ] Nutrition data persists daily
[ ] Goals update correctly
[ ] Profile edits save

AI FEATURES:

[ ] Chat sends and receives messages
[ ] Voice recording and transcription works
[ ] Image upload and analysis works
[ ] Text-to-speech plays correctly
[ ] Conversation history maintained
[ ] Error handling for API failures

PERMISSIONS:

[ ] Microphone permission request
[ ] Camera/photo library permissions
[ ] Graceful permission denial handling

UI/UX:

[ ] All screens render correctly
[ ] Loading states show
[ ] Error messages display
[ ] Animations smooth
[ ] Responsive layouts
[ ] Keyboard handling works

Create manual testing script with steps for each feature.

```



---



This comprehensive set of prompts covers every aspect of converting your web pregnancy app to React Native. Each prompt is detailed enough for an LLM to generate the appropriate code while maintaining the motherhood theme, user experience, and functionality of the original web app.

393
852
```
````
