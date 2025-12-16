### **Software Engineering Assignment**

### **Historical AI Chatbot – Group Project**

-----

## **Project Overview**

Our group project is to design and develop a web-based conversational AI chatbot. The chatbot simulates conversations with **Marcus Aurelius**, the Stoic philosopher-emperor. It utilizes a **hybrid architecture** combining rule-based NLP, semantic vector search, and Generative AI (LLM) to provide an engaging and educational experience.

-----

## **Team Members & Roles**

| Name   | Role             |
|--------|------------------|
| Riley  | **Group Leader** |
| Rohail | Engineer         |
| Daut   | Engineer         |
| Ryan   | Engineer         |

-----

## **Technical Architecture (MVC-S)**

The system is refactored into a **Model-View-Controller-Service (MVC-S)** architecture to ensure scalability and maintainability.

  * **Model:** MongoDB Schemas (Mongoose) for Conversations and Logic Scripts.
  * **View:** React Frontend (Client).
  * **Controller:** Handles API requests, CRUD operations, and message routing.
  * **Service:** External integrations (Hugging Face AI) and complex logic (Semantic Engine).

-----

## **Tech Stack**

### **Frontend**

  * **Framework:** React (Vite)
  * **Hosting:** Vercel
  * **Styling:** CSS Modules / Styled Components
  * **State Management:** React Hooks

### **Backend**

  * **Runtime:** Node.js (Express)
  * **Database:** MongoDB Atlas (Mongoose ODM)
  * **Architecture:** Serverless-compatible (Vercel)

### **AI & Logic Engines**

  * **Primary Logic:** Custom `Logic Engine` with **Lazy Loading** script rules.
  * **NLP Tools:** `natural` (Tokenization, Stemming, Jaro-Winkler distance).
  * **Semantic Search:** `@xenova/transformers` (all-MiniLM-L6-v2) for vector embeddings and cosine similarity.
  * **Generative AI:** **Hugging Face Inference API** (Llama-3.1-8B-Instruct) for fallback responses.
  * **File Handling:** `multer` (RAM storage) for processing image/text attachments.

-----

## **Project Setup**

### **🔹 Client (Frontend)**

#### **Purpose**

  * **Separation:** Decoupled UI that consumes the REST API.
  * **UI/UX:** Responsive chat interface supporting text and file uploads.
  * **Deployment:** Live on [https://marcusaurelius-client.vercel.app/](https://marcusaurelius-client.vercel.app/)

#### **Installation**

```bash
cd Client
npm install
npm run dev
```

-----

### **🔹 Server (Backend)**

#### **Key Packages & Features**

  * **express:** REST API Framework.
  * **mongoose:** Database interaction (CRUD & Schema validation).
  * **cors / helmet:** Security headers and Cross-Origin resource sharing.
  * **express-rate-limit:** Prevents API abuse (Window: 15m, Max: 3000 req).
  * **multer:** Handles file uploads (converted to Base64 for DB storage).
  * **uuid:** Generates unique IDs for sessions and messages.
  * **dotenv:** Environment variable management.

#### **Logic Workflow (The "Brain")**

The backend uses a 3-tier **Hybrid Response System**:

1.  **Keyword Match (Fastest):** Checks input against MongoDB-stored rules using stemming and fuzzy matching.
2.  **Semantic Match (Smart):** Uses Transformer embeddings to find meaning similarity (e.g., "stay calm" ≈ "stoic mindset").
3.  **Generative AI (Fallback):** If no rules match, the context is sent to **Llama-3** via Hugging Face to generate a persona-accurate response.

#### **Installation & Run**

```bash
cd Server
npm install
npm run dev
```

  * **Local Mode:** Connects to MongoDB and loads the script engine.
  * **Serverless Mode:** Optimized for Vercel cold starts.
  * **Deployment:** Live on [https://marcusaurelius-server.vercel.app/](https://marcusaurelius-server.vercel.app/)

-----

### **🔹 Tests & Quality Assurance**

  * **Unit Testing:** Validates the `Logic Engine` probability selection and keyword matching.
  * **Integration Testing:** Ensures `conversationController` correctly routes files, text, and database saves.
  * **Health Checks:** Endpoint `/api/health` monitors Database connection status.