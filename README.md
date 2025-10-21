# MomCare Expo 👋

MomCare addresses the gaps urban Indian mothers face in getting timely, culturally relevant prenatal guidance by combining clinically vetted content, multilingual support, and AI-driven personalization so that busy families receive evidence-based reminders, risk alerts, and wellness tips without relying solely on fragmented online advice.

## Project Progress & Features

- **Phase 1 – MVP (Complete):** Supabase infrastructure, secure authentication, chat and voice assistants, memory/RAG pipeline, dashboard, and five tracking screens (symptoms, kicks, nutrition, goals, alerts).
- **Phase 2 – Advanced Features (Complete):** GPT-4o vision image analysis, background job worker, meal logging, posture assessment, image picker, and history surfacing in profile.
- **Phase 3 – Discovery (Complete):** Explore hub with curated resources, search and filtering, bookmarking, and sharing flows.
- **Phase 4 – Edge Functions Migration (Complete):** Unified `lib/supabase-api.ts`, Supabase Edge Functions (`chat-handler`, `voice-handler`, `data-api`, `file-upload`), and decommissioned legacy AI utilities.

## Technical Overview

### User Flow Diagram

```mermaid
flowchart TD
   A[User Launches App] --> B{New or Returning?}
   B -- New --> C[Onboarding & Profile Setup]
   B -- Returning --> D[Personalized Dashboard]
   C --> D
   D --> E[Tracking Modules]
   D --> F[AI Assistant Chat/Voice]
   E --> G[Insights & Reminders]
   F --> G
   G --> H[Risk Alerts & Care Recommendations]
   H --> I[Doctor Referral & Follow-up]
```

### System Architecture Diagram

```mermaid
flowchart LR
   Client[Expo Mobile Client] -->|Auth & Session| SupabaseAuth[Supabase Auth]
   Client -->|API Calls| EdgeFns[Supabase Edge Functions]
   EdgeFns -->|CRUD & RLS| Database[(Postgres + pgvector)]
   EdgeFns -->|Storage Ops| Storage[[Supabase Storage]]
   EdgeFns -->|AI Requests| OpenAI[OpenAI GPT-4o Services]
   EdgeFns -->|Background Jobs| Worker[Background Job Queue]
   subgraph Security & Observability
      Logs[Structured Logging]
      Policies[RLS Policies]
   end
   EdgeFns --> Logs
   Database --> Policies
```

### Upcoming Enhancements

- Personalized real-time voice coaching that adapts prompts and tone to the user's trimester, symptoms, and language preferences.
- Secure upload of medical test reports with embeddings for context-aware conversations between the user and AI assistant.
- Expanded Edge Function support for ingesting clinical documents and aligning AI responses with physician-approved guidelines.

## Business Opportunity

MomCare can evolve into a sustainable digital maternal-care platform by layering premium guidance on top of the core companion experience, giving expectant parents confidence and clinicians actionable touchpoints.

- Personalized care plans tuned to specific symptoms, medical history, and wellness goals.
- Location-aware doctor and clinic recommendations with referral or lead fees.
- Optional telemedicine sessions, partner bundles with hospitals, and sponsored wellness programs.
