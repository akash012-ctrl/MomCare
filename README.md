# MomCare Expo 👋

MomCare addresses the gaps urban Indian mothers face in getting timely, culturally relevant prenatal guidance by combining clinically vetted content, multilingual support, and AI-driven personalization so that busy families receive evidence-based reminders, risk alerts, and wellness tips without relying solely on fragmented online advice.

## Project Progress & Features

- **Phase 1 – MVP (Complete):** Supabase infrastructure, secure authentication, chat and voice assistants, memory/RAG pipeline, dashboard, and five tracking screens (symptoms, kicks, nutrition, goals, alerts).
- **Phase 2 – Advanced Features (Complete):** GPT-4o vision image analysis, background job worker, meal logging, posture assessment, image picker, and history surfacing in profile.
- **Phase 3 – Discovery (Complete):** Explore hub with curated resources, search and filtering, bookmarking, and sharing flows.
- **Phase 4 – Edge Functions Migration (Complete):** Unified `lib/supabase-api.ts`, Supabase Edge Functions (`chat-handler`, `voice-handler`, `data-api`, `file-upload`), and decommissioned legacy AI utilities.
- **Phase 5 – Multilingual Support with Realtime Voice (Complete (partially)):**
  - English and Hindi support in chat (gpt-4o-mini) with multilingual system prompts
  - Realtime voice via WebRTC + OpenAI Realtime API with language-aware transcription (Whisper)
  - Language preference stored per user in `user_profiles` table with auto-retrieval on session restore
  - Language selector UI in profile screen with 🇬🇧 English / 🇮🇳 हिंदी toggle
  - All edge functions updated: `chat-handler` (v6), `realtime-token` (v2) with language parameters
  - Frontend wiring complete: chat and voice screens pass `preferredLanguage` to respective handlers

## Technical Overview

### User Flow Diagram

```mermaid
flowchart TD
    A["App Launch — LIVE"] --> B{Authenticated?}
    B -- No --> C["Sign Up / Login — LIVE"]
    C --> D["Profile Setup — LIVE"]
    B -- Yes --> D
    D --> E["Personalized Dashboard — LIVE"]
    E --> F["Tracking Modules — LIVE"]
    E --> G["AI Assistant (Text) — LIVE"]
    G --> H["chat-handler Edge Function — LIVE"]
    H --> I["Contextual Response with Language Support — LIVE"]
    E --> V["Realtime Voice Entry (WebRTC) — Pending"]
    V --> W["Realtime Token Request — LIVE"]
    W --> X["realtime-token Edge Function — LIVE"]
    X --> Y["Multilingual Voice Session with Whisper Transcription — LIVE"]
    D --> LS["Language Selector (Profile Screen) — LIVE"]
    LS --> LP["Set preferred_language in user_profiles — LIVE"]
    LP --> RET["Language Retrieved on Session Restore — LIVE"]
    E --> J["Image Upload Flow — PENDING"]
    J --> K["file-upload Edge Function — PENDING"]
    K --> L["Vision Processing Queue — PENDING"]
    L --> M["Automated Alerts & Doctor Escalation — PENDING"]
```

### System Architecture Diagram

```mermaid
flowchart LR
    Client["Expo App — LIVE"] --> Auth["Supabase Auth — LIVE"]
    Client --> ChatEF["chat-handler Edge Function — LIVE"]
    Client --> VoiceEF["realtime-token Edge Function — LIVE"]
    Client --> FileEF["file-upload Edge Function — PENDING"]
    Client --> LS["Language Selector Component — LIVE"]
    LS --> DB
    DataEF --> DB["Postgres + pgvector + user_profiles.preferred_language — LIVE"]
    ChatEF --> DB
    ChatEF --> OpenAI["OpenAI GPT-4o-mini Mini with Language Support (EN/HI) — LIVE"]
    VoiceEF --> OpenAI
    VoiceEF --> Realtime_voice_model[" gpt-realtime-mini Language-Aware — LIVE"]
    FileEF --> Storage["Supabase Storage — PENDING"]
    FileEF --> Jobs["Background Jobs Queue — PENDING"]
    Jobs --> Alerts["Realtime Notifications — PENDING"]
    DB --> Policies["RLS Policies — LIVE"]
```

Legend: LIVE = implemented • PENDING = in progress

Pending items: Image uploads with embeddings and the background job dispatcher must be completed before automated insights and alerts can go live.

### Upcoming Enhancements

- Secure upload of medical test reports with embeddings for context-aware conversations between the user and AI assistant.
- Extended language support: Auto-detect user language preference from device locale (Phase 6).
- Enhanced voice synthesis: Integrate Hindi TTS (currently using English voice for both languages).
- Expanded Edge Function support for ingesting clinical documents and aligning AI responses with physician-approved guidelines.

## Business Opportunity

MomCare can evolve into a sustainable digital maternal-care platform by layering premium guidance on top of the core companion experience, giving expectant parents confidence and clinicians actionable touchpoints.

- Personalized care plans tuned to specific symptoms, medical history, and wellness goals.
- Location-aware doctor and clinic recommendations with referral or lead fees.
- Optional telemedicine sessions, partner bundles with hospitals, and sponsored wellness programs.
