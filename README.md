# MomCare Expo 👋

MomCare addresses the gaps urban Indian mothers face in getting timely, culturally relevant prenatal guidance by combining clinically vetted content, multilingual support, and AI-driven personalization so that busy families receive evidence-based reminders, risk alerts, and wellness tips without relying solely on fragmented online advice.

## Project Progress & Features

- **Phase 1 – MVP (Complete):** Supabase infrastructure, secure authentication, chat and voice assistants, memory/RAG pipeline, dashboard, and five tracking screens (symptoms, kicks, nutrition, goals, alerts).
- **Phase 2 – Advanced Features (Complete):** GPT-4o vision image analysis, background job worker, meal logging, posture assessment, image picker, and history surfacing in profile.
- **Phase 3 – Discovery (Complete):** Explore hub with curated resources, search and filtering, bookmarking, and sharing flows.
- **Phase 4 – Edge Functions Migration (partially complete):** Unified `lib/supabase-api.ts`, Supabase Edge Functions (`chat-handler`, `voice-handler`, `data-api`, `file-upload`), and decommissioned legacy AI utilities.

## Technical Overview

### User Flow Diagram

```mermaid
flowchart TD
   subgraph Access
      A[App Launch] --> B{Authenticated?}
      B -- No --> C[Signup / Login]
      C --> D[Create Secure Session]
      B -- Yes --> E[Resume Session]
      D --> E
   end

   subgraph Onboarding
      E --> F{Profile Complete?}
      F -- No --> G[Capture Pregnancy Timeline]
      G --> H[Collect Health History & Preferences]
      H --> I[Set Language & Notification Opt-ins]
      I --> J[Sync with Supabase Profile]
      F -- Yes --> J
   end

   subgraph Daily Hub
      J --> K[Personalized Home Dashboard]
      K --> L[Symptom & Vital Logging]
      K --> M[Kick Counter & Movement Alerts]
      K --> N[Nutrition & Goals Tracking]
      K --> O[Image Analysis Workflows]
      O --> P[Upload Meal/Posture Photo]
      P --> Q[Edge Function Analysis]
      Q --> R[Insights Stored & Displayed]
   end

   subgraph Conversational Support
      K --> S[AI Assistant Entry]
      S --> T{Voice or Text?}
      T -- Text --> U[Chat Interface]
      T -- Voice --> V[Real-time Voice Session]
      U --> W[Context Retrieval from Supabase]
      V --> W
      W --> X[Generate Response via GPT-4o]
      X --> Y[Deliver Guidance, Tasks, Reassurance]
   end

   subgraph Proactive Intelligence
      R --> Z[Personalized Reminders]
      Y --> Z
      L --> AA[Anomaly Detection]
      M --> AA
      N --> AA
      AA --> AB{Risk Level}
      AB -- Medium --> AC[Suggest Lifestyle & Follow-up]
      AB -- High --> AD[Escalate to Urgent Alert]
   end

   subgraph Care Continuity
      AD --> AE[Doctor Recommendation by Location]
      AE --> AF[Schedule Consultation / Telemedicine]
      AC --> AG[Add Tasks to Checklist]
      AF --> AG
      AG --> AH[Track Completion & Update Plan]
      AH --> K
   end

   subgraph Learning Loop
      UserArtifacts[Test Reports, Journal Entries] --> AI[Document Upload Flow]
      AI --> AJ[Embed & Index for Context]
      AJ --> W
      AJ --> AK[Clinical History Timeline]
      AK --> K
   end
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
