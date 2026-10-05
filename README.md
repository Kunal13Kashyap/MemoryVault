# MemoryVault

**Keep the stories, recipes, and small moments that make your family yours — privately.**

MemoryVault is a privacy-focused family memory application for collecting stories, recipes, notes, documents, and photos, connecting them to the people they are about, and asking questions about what you have saved.

It combines a **React + TypeScript frontend**, an **Express + MongoDB backend**, and a **locally running Gemma 3 4B model through llama.cpp**.

The AI functionality is designed to work locally rather than requiring an external LLM API. Memories are stored in MongoDB, relevant memory context is retrieved by the backend, and that context is provided to the locally running Gemma model to generate an answer.

---

## ✨ Features

### 👨‍👩‍👧‍👦 Family Memory Management

- Create an account and sign in.
- Create and manage private family spaces.
- Add family members.
- Connect memories to one or more people.
- Mark a memory as connected to:
  - **Me**
  - A family member
  - Both
  - The whole family
- Save memories as:
  - Stories
  - Recipes
  - Notes
  - Documents
  - Photos

### 📎 Attachments

- Attach one PDF to a document memory.
- Attach one JPEG, PNG, or WebP image to a photo memory.
- Maximum upload size: **15 MB**.
- Download attachments through authenticated API routes.

### 🔎 Search & Retrieval

- Search saved memories.
- Filter memories.
- Retrieve relevant memories when asking questions.
- See which memories informed an AI response.

### 🤖 Local AI

- Ask natural-language questions about your saved memories.
- Run **Gemma 3 4B locally**.
- Use [`llama.cpp`](https://github.com/ggml-org/llama.cpp) as the local inference server.
- Use llama.cpp's OpenAI-compatible Chat Completions API.
- No external LLM API is required.
- Continue using the core application even when the local AI server is unavailable.

---

# 🔐 Privacy First

Family memories are personal.

MemoryVault is designed so that the AI functionality does not require sending your memories to a hosted LLM provider.

Instead, the application can use a local AI pipeline:

```text
┌───────────────┐
│    MongoDB    │
│               │
│ Family data   │
│ Memories      │
└───────┬───────┘
        │
        │ Relevant memories
        ▼
┌───────────────────────┐
│   MemoryVault Backend │
│        Express        │
└───────────┬───────────┘
            │
            │ Local request
            ▼
┌───────────────────────┐
│       llama.cpp       │
│     llama-server      │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│      Gemma 3 4B       │
│    Local inference    │
└───────────────────────┘
```

The application does **not require OpenAI, Anthropic, Gemini, or another hosted LLM API** for its AI functionality.

> **Note:** Running an LLM locally does not automatically make an application completely secure. Authentication, database security, filesystem permissions, secrets management, and deployment configuration are still important.

---

# 🏗️ Architecture

MemoryVault consists of three primary application layers:

```text
                    ┌──────────────────────┐
                    │    React Frontend    │
                    │ TypeScript + Vite    │
                    │ Tailwind + Motion    │
                    └──────────┬───────────┘
                               │
                               │ HTTP API
                               ▼
                    ┌──────────────────────┐
                    │    Express Backend   │
                    │      TypeScript      │
                    │                      │
                    │ Authentication       │
                    │ Families / Members   │
                    │ Memories             │
                    │ Attachments          │
                    │ Memory Retrieval     │
                    │ AI / Ask Endpoint    │
                    └───────┬───────┬──────┘
                            │       │
                            │       │ Local AI request
                            ▼       ▼
                   ┌────────────┐  ┌──────────────────┐
                   │  MongoDB   │  │    llama.cpp     │
                   │            │  │                  │
                   │ Users      │  │ llama-server     │
                   │ Families   │  │ Gemma 3 4B       │
                   │ Members    │  │ GGUF              │
                   │ Memories   │  └──────────────────┘
                   └────────────┘
```

---

# 🧠 How "Ask Your Vault" Works

When a user asks a question about their memories, MemoryVault follows a retrieval-first flow.

```text
User asks a question
        │
        ▼
POST /api/families/:familyId/ask
        │
        ▼
Search saved memory titles + text
        │
        ▼
Find relevant memories
        │
        ▼
Build AI context
        │
        ▼
Send context + question
to local llama.cpp server
        │
        ▼
Gemma 3 4B generates response
        │
        ▼
Return answer + supporting memories
```

The current implementation retrieves relevant information from the **memory data stored in MongoDB**.

The retrieved memory context is then passed to the locally running Gemma 3 4B model.

Uploaded PDF and image contents are **not currently parsed or indexed as AI context**.

---

# 🤖 Local AI Stack

MemoryVault uses:

| Component | Purpose |
|---|---|
| **Gemma 3 4B** | Local language model |
| **GGUF** | Model format |
| **llama.cpp** | Local model inference runtime |
| **llama-server** | HTTP server for model inference |
| **OpenAI-compatible API** | Backend-to-model communication |
| **MongoDB** | Memory and application data storage |

The local AI architecture looks like:

```text
MemoryVault Backend
        │
        │ HTTP
        ▼
http://127.0.0.1:8080/v1
        │
        ▼
    llama-server
        │
        ▼
  Gemma 3 4B GGUF
```

No external LLM API is required.

---

# 🛠️ Tech Stack

| Area | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Authentication | Signed Bearer Tokens, Password Hashing |
| Local AI Runtime | llama.cpp |
| AI Model | Gemma 3 4B |
| Model Format | GGUF |
| AI API | OpenAI-compatible Chat Completions API |

---

# 📋 Requirements

Before running MemoryVault locally, make sure you have:

- **Node.js**
- **npm**
- **MongoDB**
- **llama.cpp**
- A compatible **Gemma 3 4B GGUF** model

Node.js 22 LTS is recommended.

MongoDB can run locally or through a remote MongoDB connection URL.

> `llama.cpp` and Gemma 3 4B are only required if you want to use **Ask Your Vault**.

---

# 🚀 Run Locally

Open separate terminals from the repository root.

## 1. Start MongoDB

Make sure your MongoDB instance is running.

For a local MongoDB installation, the default connection is:

```text
mongodb://127.0.0.1:27017/memoryvault
```

---

## 2. Configure and Start the Backend

From the repository root:

```powershell
cd server
Copy-Item .env.example .env
npm install
npm run dev
```

Edit `server/.env`:

```env
PORT=3000
MONGODB_URL=mongodb://127.0.0.1:27017/memoryvault
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
CLIENT_ORIGIN=http://localhost:5173
```

Generate a unique random `JWT_SECRET` of at least 32 characters.

**Never commit your `.env` file.**

The backend exposes a health check at:

```text
http://localhost:3000/health
```

---

# 💻 Start the Frontend

Open another terminal from the repository root:

```powershell
cd client
npm install
npm run dev
```

Vite will print the local frontend URL.

By default:

```text
http://localhost:5173
```

During local development, the Vite development server proxies API requests to the backend.

If the backend runs at another local origin, configure:

```env
VITE_API_PROXY_TARGET=http://your-backend-origin
```

For a separately deployed backend:

```env
VITE_API_URL=https://your-api-origin
```

The backend's `CLIENT_ORIGIN` should match the frontend origin.

---

# 🦙 Enable Local AI

## 1. Obtain a Gemma 3 4B GGUF Model

Download a compatible **Gemma 3 4B GGUF** model.

Make sure the model build contains an appropriate chat template.

---

## 2. Start llama.cpp

Start `llama-server` with your Gemma model:

```powershell
llama-server.exe `
  -m "C:\path\to\gemma-3-4b-it-Q4_K_M.gguf" `
  --host 127.0.0.1 `
  --port 8080 `
  --alias gemma-3-4b-it
```

The exact model filename depends on the GGUF model you downloaded.

The important part is that the alias matches the model configured in MemoryVault.

---

## 3. Configure MemoryVault

Add the following to `server/.env`:

```env
LLAMA_CPP_BASE_URL=http://127.0.0.1:8080/v1
LLAMA_CPP_MODEL=gemma-3-4b-it
```

If your local llama.cpp server requires an API key:

```env
LLAMA_CPP_API_KEY=your-local-api-key
```

Restart the backend after changing environment variables.

---

# 🔄 Complete Local AI Flow

Once everything is running:

```text
                    Your Computer
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌───────────────┐       ┌────────────────────────┐  │
│  │ MemoryVault   │       │       MongoDB          │  │
│  │ Frontend      │──────►│                        │  │
│  └───────┬───────┘       │ Users / Families      │  │
│          │                │ Memories              │  │
│          ▼                └────────────────────────┘  │
│  ┌────────────────┐                                  │
│  │ Express        │                                  │
│  │ Backend        │                                  │
│  └───────┬────────┘                                  │
│          │                                           │
│          │ Relevant memory context                   │
│          ▼                                           │
│  ┌────────────────┐                                  │
│  │ llama-server   │                                  │
│  │ 127.0.0.1:8080 │                                  │
│  └───────┬────────┘                                  │
│          │                                           │
│          ▼                                           │
│  ┌────────────────┐                                  │
│  │   Gemma 3 4B   │                                  │
│  │      GGUF      │                                  │
│  └────────────────┘                                  │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

# 🔐 Authentication

Authenticated API routes use:

```http
Authorization: Bearer <token>
```

Registration and login are public.

Authentication is handled by the Express backend and protected routes require a valid signed bearer token.

---

# 🗄️ Storage

MemoryVault uses **MongoDB as its primary application data store**.

MongoDB stores application data including:

- User accounts
- Family spaces
- Family members
- Memories
- Memory metadata
- Memory relationships

Attachments are currently stored separately on the backend filesystem:

```text
server/uploads
```

For production deployments, use a persistent filesystem or dedicated object storage for attachments.

> **Privacy and storage:** Families and memories belong to the signed-in account. "Me" is an association label, not a separate access-control setting.

---

# 🔌 API Overview

Authenticated API routes use:

```http
Authorization: Bearer <token>
```

Registration and login are public.

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | Check that the API is running |
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/auth/me` | Get the current account |
| `GET`, `POST` | `/api/families` | List or create family spaces |
| `GET`, `PATCH` | `/api/families/:familyId` | Get or rename a family |
| `GET`, `POST` | `/api/families/:familyId/members` | List or add people |
| `PATCH`, `DELETE` | `/api/families/:familyId/members/:memberId` | Update or remove a person |
| `GET`, `POST` | `/api/families/:familyId/memories` | List or add memories |
| `POST` | `/api/families/:familyId/ask` | Ask about saved memories |
| `GET`, `PATCH`, `DELETE` | `/api/memories/:memoryId` | Read, update, or delete a memory |
| `GET` | `/api/memories/:memoryId/attachment` | Download an attachment |

---

# 📁 Project Structure

```text
MemoryVault/
│
├── client/
│   └── React + TypeScript frontend
│
├── server/
│   ├── Express API
│   ├── MongoDB / Mongoose models
│   ├── Authentication
│   ├── Memory routes
│   ├── Memory retrieval
│   ├── llama.cpp integration
│   └── uploads/
│
└── README.md
```

---

# ⚡ Useful Commands

Run these commands from the corresponding `client` or `server` directory.

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Type-check and build the application |
| `npm run lint` | Run frontend ESLint checks |
| `npm start` | Start the compiled backend |

---

# ⚠️ Current Limitations

- Attachments are stored on local disk rather than MongoDB GridFS or cloud object storage.
- Each document or photo memory supports one attachment.
- Documents must be PDFs.
- Photos must be JPEG, PNG, or WebP.
- Upload size is limited to 15 MB.
- AI retrieval currently works with saved memory titles and text.
- PDF and image contents are not currently parsed or indexed for AI retrieval.
- The local Gemma model must be running for **Ask Your Vault** to work.
- MongoDB must be available for the backend.
- AI response quality depends on the selected Gemma model, quantization, context, and local hardware.
- The application currently uses local filesystem storage for uploaded attachments.

---

# 🔮 Future Improvements

Potential future improvements include:

- Semantic/vector-based memory retrieval.
- Better memory ranking and retrieval.
- Parsing and indexing PDF attachments.
- Image understanding for photo memories.
- Streaming AI responses.
- Improved source attribution.
- Persistent attachment storage.
- Additional open-weight local models.
- More automated tests.
- Production deployment configuration.
- Improved local model configuration and performance.

---

# 🏆 Hacktoberfest 2026

MemoryVault explores how **open-source AI and open-weight models** can be used to build useful applications while keeping sensitive personal data under the user's control.

The AI stack consists of:

- **Gemma 3 4B** — local open-weight language model.
- **llama.cpp** — local inference runtime.
- **MongoDB** — persistent application data storage.
- **Memory retrieval** — retrieves relevant saved memories before generating an answer.

The project intentionally avoids making a hosted proprietary LLM API a requirement for its AI functionality.

The goal is to demonstrate how a practical AI-powered application can be built around a locally running open-weight model while maintaining a privacy-focused architecture.

---

# 📜 License

This project is licensed under the terms specified in the repository's license file.
