# SalonDesk — Voice Concierge & Semantic RAG Architecture

SalonDesk features a full-duplex conversational voice agent and an intelligent text concierge powered by LiveKit RTC, Deepgram Speech-to-Text, pluggable LLMs, and PostgreSQL `pgvector`.

---

## 1. High-Level Architecture

Both voice and text pipelines share a single source of truth: `retrieve_context()` querying the entity-linked `knowledge_chunk` table in PostgreSQL.

```
Browser Mic ──────► LiveKit Room ◄───── JWT Token via POST /api/v1/livekit/token
                          │
                          ▼
            Python Voice Worker (`agent.py`)
       [Deepgram STT] ──► [retrieve_context] ──► [LLM Tools] ──► [TTS]
                                │
                                ▼
              PostgreSQL `knowledge_chunk` (pgvector)
              (Organizations, Services, Policies, FAQs)
                                ▲
                                │
Browser Chat Widget ──► POST /api/v1/chat (Semantic Text Concierge)
```

---

## 2. Semantic RAG Setup & Embedding Ingestion

SalonDesk uses `sentence-transformers/all-minilm` embeddings to map natural language styling requests (e.g., *"I want clean knotless braids on Saturday afternoon"*) to real database entities.

### Step 1: Start Ollama & Pull Embedding Model (Local Dev)
```bash
docker compose up -d ollama
ollama pull all-minilm
```

### Step 2: Index Live Catalog into pgvector
Run the semantic ingestion pipeline to generate embeddings for active organizations, approved services, and cancellation policies:

```bash
make ingest-knowledge
```

Or execute directly from `backend/`:
```bash
cd backend
uv run python -m scripts.ingest_knowledge
```

---

## 3. Realtime Voice Agent Setup

### Required Environment Variables (in `.env`)
```bash
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
DEEPGRAM_API_KEY=your-deepgram-key

# LLM Selection
LLM_PROVIDER=groq     # groq | openai | ollama
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-120b
```

### Starting the Worker
```bash
make voice-agent
```
Or directly:
```bash
cd backend && uv run python agent.py start
```

---

## 4. Grounding Principles & AI Safety

1. **No Hallucinated Availability or Pricing**:
   The voice and chat agents cannot invent services or open appointment slots. All responses must be grounded in ORM rows returned by `retrieve_context` and live availability queries (`execute_get_salon_services`, `check_stylist_shift`).
2. **Context Timeout Bounds**:
   Vector search queries are executed per-turn with strict timeout thresholds to keep speech latency under 500ms.
3. **Structured Service Hydration**:
   When the agent recommends a service, it emits an interactive service card payload directly into the client interface, allowing the user to 1-tap book without re-entering details.

