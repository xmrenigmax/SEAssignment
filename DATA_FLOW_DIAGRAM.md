# Marcus Aurelius Chatbot - Data Flow Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│                          (React Frontend - Port 3000)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATION LAYER                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐     │
│  │   App.jsx   │  │ LandingPage  │  │  ChatPanel  │  │   Sidebar    │     │
│  │   (Router)  │──▶│   (Main UI)  │──▶│  (Chat UI)  │  │  (History)   │     │
│  └─────────────┘  └──────────────┘  └─────────────┘  └──────────────┘     │
│         │                                    │                               │
│         ▼                                    ▼                               │
│  ┌─────────────┐                    ┌──────────────┐                       │
│  │   Context   │                    │    Hooks     │                       │
│  │ Providers   │                    │              │                       │
│  ├─────────────┤                    ├──────────────┤                       │
│  │ ThemeContext│                    │   useChat    │◀──────────┐          │
│  │ ChatContext │◀───────────────────│ useLocalStorage         │          │
│  └─────────────┘                    │ useBackendHealth        │          │
│                                     │ useTypewriter │          │          │
│                                     └──────────────┘          │          │
└───────────────────────────────────────────│───────────────────┼──────────┘
                                            │                   │
                                            ▼                   │
                                    ┌──────────────┐           │
                                    │ LocalStorage │           │
                                    │   (Browser)  │           │
                                    └──────────────┘           │
                                            │                   │
                                            │ Sync              │
                                            ▼                   │
                    ┌───────────────────────────────────────────┘
                    │           HTTP/REST API Calls
                    │       (Fetch with JSON/FormData)
                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SERVER APPLICATION LAYER                            │
│                       (Express.js Backend - Port 5000)                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           server.js (Entry)                          │   │
│  │  • CORS Configuration                                                │   │
│  │  • Helmet Security                                                   │   │
│  │  • Rate Limiting (3000 req/15min)                                    │   │
│  │  • Body Parser (10MB limit)                                          │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       Middleware Layer                               │   │
│  │  ┌────────────────────┐         ┌────────────────────┐             │   │
│  │  │  rateLimitMiddleware│         │ uploadMiddleware   │             │   │
│  │  │  (Express Rate Limit)        │ (Multer - 4MB RAM) │             │   │
│  │  └────────────────────┘         └────────────────────┘             │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Routes (conversationRoutes.js)                   │   │
│  │  • GET    /api/health                                                │   │
│  │  • GET    /api/conversations                                         │   │
│  │  • GET    /api/conversations/:id                                     │   │
│  │  • POST   /api/conversations                                         │   │
│  │  • POST   /api/conversations/:id/messages ◀── [File Upload]        │   │
│  │  • POST   /api/conversations/import                                  │   │
│  │  • DELETE /api/conversations/:id                                     │   │
│  │  • DELETE /api/conversations                                         │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                            │
│                                 ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  Controller (conversationController.js)              │   │
│  │  • getAllConversations()                                             │   │
│  │  • getConversationById()                                             │   │
│  │  • createConversation()                                              │   │
│  │  • sendMessage() ◀───── Main Logic Hub                              │   │
│  │  • deleteConversation()                                              │   │
│  │  • importConversations()                                             │   │
│  └──────┬──────────────────────┬────────────────────────┬──────────────┘   │
│         │                      │                        │                   │
│         ▼                      ▼                        ▼                   │
│  ┌─────────────┐      ┌──────────────┐       ┌──────────────┐            │
│  │  Models     │      │   Services   │       │    Utils     │            │
│  │ (Mongoose)  │      │  (AI Logic)  │       │  (Engines)   │            │
│  │             │      │              │       │              │            │
│  │ Conversation│      │  aiService   │       │ logicEngine  │            │
│  │   Schema    │      │  .js         │       │  .js         │            │
│  │             │      │              │       │              │            │
│  │ Script      │      │ generateAI   │       │ checkScripted│            │
│  │   Schema    │      │ Response()   │       │ Response()   │            │
│  └──────┬──────┘      │              │       │              │            │
│         │             │ Hugging Face │       │ Natural NLP  │            │
│         │             │ API Call     │       │ • Tokenizer  │            │
│         │             │ Llama 3.1    │       │ • Stemmer    │            │
│         │             │ 8B Instruct  │       │ • Fuzzy Match│            │
│         │             └──────┬───────┘       └──────┬───────┘            │
│         │                    │                      │                      │
│         │                    │                      ▼                      │
│         │                    │              ┌──────────────┐              │
│         │                    │              │ semanticEngine│              │
│         │                    │              │  .js         │              │
│         │                    │              │              │              │
│         │                    │              │ Transformers │              │
│         │                    │              │ @xenova      │              │
│         │                    │              │ MiniLM-L6-v2 │              │
│         │                    │              │              │              │
│         │                    │              │ • Embeddings │              │
│         │                    │              │ • Cosine Sim │              │
│         │                    │              └──────┬───────┘              │
│         │                    │                     │                      │
│         ▼                    ▼                     ▼                      │
│  ┌─────────────────────────────────────────────────────────────┐         │
│  │                    Response Generation Flow                  │         │
│  │                                                               │         │
│  │  1. User Message → Controller                                │         │
│  │  2. Check Script (logicEngine)                               │         │
│  │     ├─ Keyword Match (NLP + Fuzzy) → Return Scripted        │         │
│  │     └─ No Match                                              │         │
│  │  3. Try Semantic Match (semanticEngine)                      │         │
│  │     ├─ Vector Similarity > 0.65 → Return Scripted           │         │
│  │     └─ No Match                                              │         │
│  │  4. Call AI Service (aiService)                              │         │
│  │     └─ Hugging Face API → Llama 3.1 Response                │         │
│  │  5. Return AI/Scripted Response to Client                    │         │
│  └───────────────────────────────────────────────────────────────┘         │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATA PERSISTENCE LAYER                             │
│  ┌──────────────────────┐              ┌──────────────────────┐            │
│  │   MongoDB Atlas      │              │   Browser Storage    │            │
│  │   (Cloud Database)   │              │   (Client Side)      │            │
│  │                      │              │                      │            │
│  │  Collections:        │              │  • LocalStorage      │            │
│  │  • conversations     │              │    - Conversations   │            │
│  │  • scripts           │              │    - Active ID       │            │
│  │                      │              │    - Theme           │            │
│  │  Documents:          │              │    - Tour Complete   │            │
│  │  • id (UUID)         │              │                      │            │
│  │  • title             │              │                      │            │
│  │  • messages[]        │              │                      │            │
│  │    - text            │              │                      │            │
│  │    - isUser          │              │                      │            │
│  │    - timestamp       │              │                      │            │
│  │    - attachment      │              │                      │            │
│  │      - name          │              │                      │            │
│  │      - type          │              │                      │            │
│  │      - data (Base64) │              │                      │            │
│  │  • createdAt         │              │                      │            │
│  │  • updatedAt         │              │                      │            │
│  └──────────────────────┘              └──────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Data Flow Sequences

### 1. **User Sends a Message** (Standard Flow)

```
┌──────┐       ┌────────┐       ┌─────────┐       ┌────────────┐       ┌──────────┐
│ User │       │ Client │       │ Server  │       │ Logic      │       │ Database │
│      │       │        │       │         │       │ Engine     │       │          │
└──┬───┘       └───┬────┘       └────┬────┘       └─────┬──────┘       └────┬─────┘
   │               │                 │                   │                    │
   │ 1. Types msg  │                 │                   │                    │
   ├──────────────▶│                 │                   │                    │
   │               │                 │                   │                    │
   │               │ 2. POST /messages                   │                    │
   │               ├────────────────▶│                   │                    │
   │               │                 │                   │                    │
   │               │                 │ 3. Check Scripts  │                    │
   │               │                 ├──────────────────▶│                    │
   │               │                 │                   │                    │
   │               │                 │ 4a. Match Found?  │                    │
   │               │                 │◀──────────────────┤                    │
   │               │                 │   (Scripted Resp) │                    │
   │               │                 │                   │                    │
   │               │                 │ 4b. No Match?     │                    │
   │               │                 │   Call AI Service │                    │
   │               │                 ├───────────▶ Hugging Face              │
   │               │                 │            Llama 3.1                   │
   │               │                 │◀───────────  (AI Response)            │
   │               │                 │                   │                    │
   │               │                 │ 5. Save Messages  │                    │
   │               │                 ├───────────────────┼───────────────────▶│
   │               │                 │                   │                    │
   │               │ 6. Response     │                   │                    │
   │               │◀────────────────┤                   │                    │
   │               │ { userMsg, aiMsg, conversation }    │                    │
   │               │                 │                   │                    │
   │ 7. Display    │                 │                   │                    │
   │◀──────────────┤                 │                   │                    │
   │   (Typewriter)│                 │                   │                    │
```

### 2. **User Uploads File with Message**

```
┌──────┐       ┌────────┐       ┌─────────┐       ┌──────────┐
│ User │       │ Client │       │ Server  │       │ Database │
└──┬───┘       └───┬────┘       └────┬────┘       └────┬─────┘
   │               │                 │                   │
   │ 1. Select File│                 │                   │
   ├──────────────▶│                 │                   │
   │               │                 │                   │
   │ 2. Add text   │                 │                   │
   ├──────────────▶│                 │                   │
   │               │                 │                   │
   │               │ 3. POST (FormData)                  │
   │               │    - text       │                   │
   │               │    - attachment │                   │
   │               ├────────────────▶│                   │
   │               │                 │                   │
   │               │                 │ 4. Multer Parse   │
   │               │                 │    (Memory Store) │
   │               │                 │                   │
   │               │                 │ 5. Buffer→Base64  │
   │               │                 │                   │
   │               │                 │ 6. Create Context │
   │               │                 │    "[User uploaded file.txt]"
   │               │                 │                   │
   │               │                 │ 7. Get AI Response│
   │               │                 │    (with context) │
   │               │                 │                   │
   │               │                 │ 8. Save to DB     │
   │               │                 ├──────────────────▶│
   │               │                 │   {               │
   │               │                 │     text,         │
   │               │                 │     attachment: { │
   │               │                 │       name,       │
   │               │                 │       type,       │
   │               │                 │       data (B64)  │
   │               │                 │     }             │
   │               │                 │   }               │
   │               │                 │                   │
   │               │ 9. Response     │                   │
   │               │◀────────────────┤                   │
   │               │                 │                   │
   │ 10. Display   │                 │                   │
   │◀──────────────┤                 │                   │
```

### 3. **Voice Input Flow**

```
┌──────┐       ┌────────┐       ┌─────────┐       ┌──────────┐
│ User │       │ Client │       │ Server  │       │ Database │
└──┬───┘       └───┬────┘       └────┬────┘       └────┬─────┘
   │               │                 │                   │
   │ 1. Hold Mic   │                 │                   │
   ├──────────────▶│                 │                   │
   │               │ 2. Start Recording                  │
   │               │    - MediaRecorder                  │
   │               │    - SpeechRecognition              │
   │               │                 │                   │
   │ 3. Speak      │                 │                   │
   ├──────────────▶│                 │                   │
   │               │ 4. Transcribe   │                   │
   │               │    (Web Speech) │                   │
   │               │                 │                   │
   │ 5. Release Mic│                 │                   │
   ├──────────────▶│                 │                   │
   │               │ 6. Stop Both    │                   │
   │               │    - Audio Blob │                   │
   │               │    - Text       │                   │
   │               │                 │                   │
   │               │ 7. Blob→Base64  │                   │
   │               │                 │                   │
   │               │ 8. POST Message │                   │
   │               │    {            │                   │
   │               │      text,      │                   │
   │               │      audio (B64)│                   │
   │               │    }            │                   │
   │               ├────────────────▶│                   │
   │               │                 │                   │
   │               │                 │ 9. Process & Save │
   │               │                 ├──────────────────▶│
   │               │                 │                   │
   │               │ 10. Response    │                   │
   │               │◀────────────────┤                   │
   │               │                 │                   │
   │ 11. Display   │                 │                   │
   │◀──────────────┤                 │                   │
   │   + Audio     │                 │                   │
   │   Player      │                 │                   │
```

### 4. **Conversation Sync Flow** (Auto-sync on mount)

```
┌────────┐       ┌─────────┐       ┌──────────┐
│ Client │       │ Server  │       │ Database │
└───┬────┘       └────┬────┘       └────┬─────┘
    │                 │                   │
    │ 1. useEffect    │                   │
    │    (on mount)   │                   │
    │                 │                   │
    │ 2. GET /conversations               │
    ├────────────────▶│                   │
    │                 │                   │
    │                 │ 3. Query DB       │
    │                 ├──────────────────▶│
    │                 │   (lean query)    │
    │                 │   {id, title,     │
    │                 │    updatedAt}     │
    │                 │                   │
    │                 │ 4. Return List    │
    │                 │◀──────────────────┤
    │                 │                   │
    │ 5. Response     │                   │
    │◀────────────────┤                   │
    │    [convos]     │                   │
    │                 │                   │
    │ 6. Update State │                   │
    │    setConversations()               │
    │                 │                   │
    │ 7. Sync Local   │                   │
    │    Storage      │                   │
```

### 5. **Import/Export Data Flow**

```
┌──────┐       ┌────────┐       ┌─────────┐       ┌──────────┐
│ User │       │ Client │       │ Server  │       │ Database │
└──┬───┘       └───┬────┘       └────┬────┘       └────┬─────┘
   │               │                 │                   │
   │ EXPORT:       │                 │                   │
   │ 1. Click btn  │                 │                   │
   ├──────────────▶│                 │                   │
   │               │ 2. Get all convos from localStorage │
   │               │                 │                   │
   │               │ 3. JSON.stringify                   │
   │               │                 │                   │
   │               │ 4. Download File│                   │
   │               │    (Blob)       │                   │
   │               │                 │                   │
   │ IMPORT:       │                 │                   │
   │ 5. Select file│                 │                   │
   ├──────────────▶│                 │                   │
   │               │ 6. Read JSON    │                   │
   │               │                 │                   │
   │               │ 7. Validate     │                   │
   │               │                 │                   │
   │               │ 8. POST /import │                   │
   │               │    (Array)      │                   │
   │               ├────────────────▶│                   │
   │               │                 │                   │
   │               │                 │ 9. Bulk Write     │
   │               │                 │    (upsert)       │
   │               │                 ├──────────────────▶│
   │               │                 │                   │
   │               │                 │ 10. Confirm       │
   │               │                 │◀──────────────────┤
   │               │                 │                   │
   │               │ 11. Success     │                   │
   │               │◀────────────────┤                   │
   │               │                 │                   │
   │               │ 12. Sync State  │                   │
   │               │    (refresh)    │                   │
```

---

## Component Data Dependencies

### **Frontend State Management**

```
ChatContext (Global State)
├── conversations (Array)
├── activeConversationId (String)
├── isLoading (Boolean)
└── Methods:
    ├── createNewConversation()
    ├── addMessageToConversation(id, msg)
    ├── deleteConversation(id)
    ├── clearAllConversations()
    ├── syncConversations()
    ├── loadConversation(id)
    ├── importConversations(data)
    └── startConversationWithPrompt(text)

ThemeContext (Global State)
├── isDark (Boolean)
└── toggleTheme()

LocalStorage Sync
├── chat-conversations
├── active-conversation
├── theme
└── marcus-tour-complete
```

### **Backend Data Models**

```
Conversation Model (MongoDB)
├── id: String (UUID)
├── title: String
├── messages: Array
│   ├── id: String
│   ├── text: String
│   ├── isUser: Boolean
│   ├── timestamp: Date
│   └── attachment: Object
│       ├── name: String
│       ├── type: String
│       ├── size: Number
│       └── data: String (Base64)
├── createdAt: Date
└── updatedAt: Date

Script Model (MongoDB)
├── configId: String ("main_config")
├── persona: String
├── general_responses: Array
│   ├── probability: Number
│   └── response: String
└── rules: Array
    ├── id: String
    ├── keywords: Array<String>
    └── response_pool: Array
        ├── probability: Number
        └── response: String
```

---

## AI Response Decision Tree

```
User Input
    ↓
┌────────────────────────────────┐
│ 1. Keyword Match               │
│    (logicEngine.js)            │
│    • Tokenization              │
│    • Stemming                  │
│    • Fuzzy matching            │
│    • Stop-word filtering       │
└────────┬───────────────────────┘
         │
         ├─ Match Found? → Scripted Response
         │                 (from script.rules)
         │
         └─ No Match
              ↓
┌────────────────────────────────┐
│ 2. Semantic Similarity         │
│    (semanticEngine.js)         │
│    • Generate embedding        │
│    • Compare to cached vectors │
│    • Cosine similarity > 0.65  │
└────────┬───────────────────────┘
         │
         ├─ Match Found? → Scripted Response
         │                 (from matched rule)
         │
         └─ No Match
              ↓
┌────────────────────────────────┐
│ 3. LLM Generation              │
│    (aiService.js)              │
│    • Hugging Face API          │
│    • Model: Llama 3.1 8B       │
│    • System: "You are Marcus"  │
│    • Max tokens: 500           │
│    • Timeout: 40s              │
└────────┬───────────────────────┘
         │
         ├─ Success? → AI Generated Response
         │
         └─ Failure → Fallback Response
                      (general_responses)
```

---

## Security & Performance Features

### **Rate Limiting**
- 3000 requests per 15 minutes per IP
- Applied globally to `/api/*` routes

### **File Upload Protection**
- Max size: 4MB (Multer)
- Memory storage (serverless compatible)
- Supported types: PDF, TXT, DOC, DOCX, JPG, PNG
- Buffer → Base64 conversion for DB storage

### **CORS Policy**
- Allowed origins:
  - http://localhost:3000
  - http://localhost:5173
  - https://marcusaurelius-client.vercel.app
- Credentials: enabled

### **Database Optimization**
- Lean queries for list endpoints (ID, title only)
- Connection pooling (MongoDB Atlas)
- Atomic operations for message append
- Bulk upsert for imports

### **Client-Side Optimization**
- LocalStorage caching
- Optimistic UI updates
- Debounced search (300ms)
- Lazy loading (React Router)
- Auto-scroll with smooth behavior

---

## Testing Coverage

### **AI Integration Test** (`ai_test.js`)
- Tests Llama 3.1 API connection
- Measures response time
- Validates meaningful responses

### **Logic Engine Test** (`advanced_test.js`)
- Probability distribution (100 requests)
- NLP fuzzy matching
- Keyword detection
- Stop-word filtering

### **Stress Test** (`stress_test.sh`)
- Concurrent request handling
- Rate limit enforcement
- Server stability under load

---

## Deployment Architecture

```
┌───────────────────────────────┐
│   Vercel (Frontend)            │
│   • Static site                │
│   • CDN distribution           │
│   • Automatic HTTPS            │
└───────────┬───────────────────┘
            │
            │ HTTP/HTTPS
            ▼
┌───────────────────────────────┐
│   Vercel (Backend)             │
│   • Serverless functions       │
│   • Auto-scaling               │
│   • Cold start optimization    │
└───────────┬───────────────────┘
            │
            │ MongoDB Driver
            ▼
┌───────────────────────────────┐
│   MongoDB Atlas (Database)     │
│   • Cloud-hosted               │
│   • Automatic backups          │
│   • Geographic distribution    │
└───────────────────────────────┘

External APIs:
┌───────────────────────────────┐
│   Hugging Face API             │
│   • Llama 3.1 8B Instruct      │
│   • Token-based auth           │
│   • 40s timeout                │
└───────────────────────────────┘
```

---

## Data Flow Summary

### **Key Data Flows:**
1. **User Input → Client State → API → Server Logic → Database → Response**
2. **File Upload → Multer Parse → Base64 Conversion → DB Storage**
3. **Voice Input → MediaRecorder + Speech API → Transcription → Message Send**
4. **Script Matching → NLP Analysis → Semantic Similarity → LLM Fallback**
5. **State Sync → LocalStorage ↔ React Context ↔ MongoDB Atlas**

### **Technology Stack:**
- **Frontend:** React, React Router, TailwindCSS, Vite
- **Backend:** Express.js, Node.js 20.x
- **Database:** MongoDB Atlas (Mongoose ODM)
- **AI/NLP:** Hugging Face (Llama 3.1), Natural.js, @xenova/transformers
- **Storage:** LocalStorage (client), Base64 (files), MongoDB (persistence)
- **Deployment:** Vercel (serverless), MongoDB Atlas (cloud)

---

**End of Data Flow Diagram**
