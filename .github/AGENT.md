# AI Agent Guidelines

## What to DO ✅

### Documentation
- **Only create explanatory documents when explicitly requested**
- Reference `ai-sdk.dev` for AI SDK patterns
- Use examples from `super.prompt.md` for implementation
- Document AI-specific setup in this file

### Code Structure
- Write modular, well-structured code
- Place nested components in their appropriate folders
- Export components intended for reuse

### AI Integration (AI SDK)
- **Keep ALL AI code in these dedicated files**:
  - `lib/ai-client.ts` - AI SDK provider initialization and utilities
  - `lib/ai-memory.ts` - Conversation memory and embeddings management
  - `app/api/chat+api.ts` - Chat API route handler

- **Use these AI SDK features**:
  - `streamText()` for streaming text generation
  - `useChat()` hook from `@ai-sdk/react` for UI integration
  - `embed()` and `embedMany()` for semantic memory
  - `experimental_transcribe()` for speech-to-text
  - `experimental_generateSpeech()` for text-to-speech
  - Tool calling for structured responses

- **Conversation History**:
  - Store in Supabase (table: `conversations`)
  - Use embeddings for semantic search and context retrieval
  - Implement retrieval-augmented generation (RAG) pattern

- **Provider Management**:
  - Default to OpenAI (`gpt-4o-mini`)
  - Allow provider switching via environment variables
  - Store user provider preferences in database

- **Error Handling**:
  - Use AI SDK error types (`NoTranscriptGeneratedError`, `NoSpeechGeneratedError`)
  - Implement retry logic for failed requests
  - Log errors with context to Supabase

### Supabase Configuration
- Initialize the Supabase client **once** in a secure location
- Use this single client instance throughout the application

- **Required Supabase Tables for AI**:
  - `conversations` - Full conversation history with embeddings
  - `message_embeddings` - Embeddings for semantic search
  - `user_health_context` - Pregnancy/health data for AI context
  - `ai_memory` - Semantic memory and retrieved context

### API Routes
- Create `app/api/chat+api.ts` for Expo API routes
- Use `streamText()` for streaming responses
- Include user context from Supabase in system prompt
- Handle authentication via Bearer token

### Additional Capabilities
- **Web Search**: Use `#fetch` when additional web search is required
- **Supabase MCP**: Use `#supabase` MCP to check current status of:
  - Database state
  - Storage state
  - Functions
  - Background jobs
  - Make changes accordingly based on current state

## What to AVOID ❌

- **Do NOT** scatter AI-related code across multiple files
- **Do NOT** create documentation unless explicitly asked
- **Do NOT** initialize multiple Supabase clients
- **Do NOT** hardcode AI provider settings (use environment variables)
- **Do NOT** skip error handling for AI operations
- **Do NOT** forget to include user context in AI prompts
- **Do NOT** ignore authentication in API routes