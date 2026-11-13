# MemoryVault

**Keep the stories, recipes, and small moments that make your family yours — privately.**

MemoryVault is a privacy-focused family memory management application that allows users to preserve stories, recipes, notes, documents, and photos, associate them with family members, and retrieve personal memories through natural-language questions.

Built using **React, TypeScript, Node.js, Express, and MongoDB**, MemoryVault integrates a locally running **Gemma 3 4B model through llama.cpp** to provide AI-powered memory retrieval without requiring an external LLM API.

The project follows a **hybrid deployment architecture**: the frontend and backend are hosted on Render, while the AI inference engine can run locally on the user's machine.

---

## 🚀 Live Demo

| Component | URL |
|---|---|
| **Live Application** | [MemoryVault](https://memoryvault-4193.onrender.com) |
| Backend API | [MemoryVault API](https://memoryvault-m4xy.onrender.com) |
| API Health Check | [Health Endpoint](https://memoryvault-m4xy.onrender.com/health) |
| Source Code | [GitHub Repository](https://github.com/Kunal13Kashyap/MemoryVault) |

---

## ✨ Features

### 👨‍👩‍👧‍👦 Family Memory Management

- Secure user registration and authentication.
- Create and manage private family spaces.
- Add and manage family members.
- Associate memories with one or multiple people.
- Categorize memory associations as:
  - Me
  - A family member
  - Both
  - The entire family
- Organize memories into different categories:
  - Stories
  - Recipes
  - Notes
  - Documents
  - Photos

### 📎 Attachment Management

- Attach PDF documents to document memories.
- Upload JPEG, PNG, and WebP images.
- Maximum attachment size of **15 MB**.
- Download attachments through authenticated API endpoints.

### 🔎 Memory Search & Retrieval

- Search saved memories.
- Filter memories by available criteria.
- Retrieve relevant memories based on natural-language questions.
- View supporting memories used to generate AI responses.

### 🤖 AI-Powered Memory Retrieval

- Ask natural-language questions about saved family memories.
- Run **Gemma 3 4B locally** using llama.cpp.
- Use llama.cpp's OpenAI-compatible Chat Completions API.
- Retrieve relevant memory context before generating responses.
- Display supporting memories alongside generated answers.
- Core application functionality remains available when the local AI service is offline.

---

## 🔐 Privacy-First AI Architecture

Family memories contain personal information. MemoryVault is designed to support local AI inference without requiring memories to be sent to an external LLM provider.

The local AI pipeline works as follows:

1. Memories are stored in MongoDB.
2. The backend retrieves relevant memory information.
3. Retrieved context is sent to the locally running llama.cpp server.
4. Gemma 3 4B processes the context and generates a response.
5. The backend returns the answer and its supporting memories.

**No external OpenAI, Anthropic, or Gemini API is required for the local inference workflow.**

> **Privacy note:** Local inference does not automatically guarantee complete application security. Database access, authentication, secrets, network communication, and attachment storage must also be configured securely.

---

## 🏗️ Architecture

MemoryVault consists of three primary components:

- **Frontend:** React + TypeScript application hosted on Render.
- **Backend:** Express + TypeScript REST API hosted on Render.
- **AI Runtime:** Gemma 3 4B running locally through llama.cpp.

### Hosted Application Architecture

\`\`\`text
             User's Browser
                   |
                   v
       +------------------------+
       |    React Frontend      |
       |    TypeScript + Vite   |
       |    Hosted on Render    |
       +-----------+------------+
                   |
                   | HTTPS API Requests
                   v
       +------------------------+
       |    Express Backend     |
       |    TypeScript          |
       |    Hosted on Render    |
       +-----------+------------+
                   |
                   v
       +------------------------+
       |        MongoDB         |
       |                        |
       | Users                  |
       | Families               |
       | Members                |
       | Memories               |
       +------------------------+
\`\`\`

### Local AI Architecture

For local AI inference, run the backend and llama.cpp on the same machine.

\`\`\`text
                Local Machine
+-------------------------------------------+
|                                           |
|  +-------------------+                    |
|  | React Frontend    |                    |
|  | localhost:5173    |                    |
|  +---------+---------+                    |
|            |                              |
|            v                              |
|  +-------------------+       +----------+ |
|  | Express Backend   |------>| MongoDB  | |
|  | localhost:3000    |       +----------+ |
|  +---------+---------+                    |
|            |                              |
|            | Local HTTP Request           |
|            v                              |
|  +-------------------+                    |
|  | llama-server      |                    |
|  | 127.0.0.1:8080    |                    |
|  +---------+---------+                    |
|            |                              |
|            v                              |
|  +-------------------+                    |
|  | Gemma 3 4B        |                    |
|  | GGUF Model        |                    |
|  +-------------------+                    |
|                                           |
+-------------------------------------------+
\`\`\`

**Important:** The publicly hosted Render backend cannot directly access a llama.cpp server running on your personal computer through `127.0.0.1`. The local AI configuration below is intended for running the backend locally alongside the model.

---

## 🧠 How "Ask Your Vault" Works

MemoryVault uses a retrieval-first approach to answer questions about saved memories.

\`\`\`text
User asks a question
        |
        v
POST /api/families/:familyId/ask
        |
        v
Search saved memory titles and text
        |
        v
Retrieve relevant memories
        |
        v
Build contextual information
        |
        v
Send context + question
to local llama.cpp server
        |
        v
Gemma 3 4B generates response
        |
        v
Return answer + supporting memories
\`\`\`

The current implementation retrieves relevant information from memory titles and text stored in MongoDB.

Uploaded PDF and image contents are **not currently parsed or indexed for AI retrieval**.

---

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB, Mongoose |
| Authentication | Signed Bearer Tokens, Password Hashing |
| AI Model | Gemma 3 4B |
| Model Format | GGUF |
| AI Runtime | llama.cpp |
| Inference Server | llama-server |
| AI Communication | OpenAI-compatible Chat Completions API |
| Deployment | Render |

---

## 📋 Prerequisites

### For local application development

- Node.js 22 LTS (recommended)
- npm
- Git
- MongoDB (local installation or MongoDB connection URL)

### Additional requirements for local AI

- llama.cpp
- Gemma 3 4B instruction-tuned GGUF model
- Sufficient RAM and processing resources for the selected model quantization

**Note:** llama.cpp and Gemma 3 4B are only necessary if you want to enable the local AI functionality.

---

## 🚀 Getting Started

### 1. Clone the Repository

\`\`\`powershell
git clone https://github.com/Kunal13Kashyap/MemoryVault.git

cd MemoryVault
\`\`\`

### 2. Configure MongoDB

Make sure your MongoDB instance is running.

For a local MongoDB installation, use:

\`\`\`env
MONGODB_URL=mongodb://127.0.0.1:27017/memoryvault
\`\`\`

You can alternatively use a remote MongoDB connection string.

### 3. Configure the Backend

Navigate to the server directory:

\`\`\`powershell
cd server

Copy-Item .env.example .env

npm install
\`\`\`

Configure `server/.env`:

\`\`\`env
PORT=3000

MONGODB_URL=mongodb://127.0.0.1:27017/memoryvault

JWT_SECRET=your-random-secret-at-least-32-characters

CLIENT_ORIGIN=http://localhost:5173
\`\`\`

Generate a strong, unique JWT secret.

**Never commit your actual `.env` file or expose application secrets.**

### 4. Start the Backend

\`\`\`powershell
npm run dev
\`\`\`

The backend should now be available at:

`http://localhost:3000`

Health check:

`http://localhost:3000/health`

### 5. Configure the Frontend

Open another terminal from the repository root:

\`\`\`powershell
cd client

npm install

npm run dev
\`\`\`

The frontend should be available at:

`http://localhost:5173`

During local development, Vite proxies API requests to the backend.

If your backend uses a different origin, configure:

\`\`\`env
VITE_API_PROXY_TARGET=http://localhost:3000
\`\`\`

For a separately deployed backend, configure:

\`\`\`env
VITE_API_URL=https://your-api-origin
\`\`\`

The backend's `CLIENT_ORIGIN` must match the frontend origin.

---

## 🦙 Setting Up Local AI with llama.cpp and Gemma 3 4B

MemoryVault uses llama.cpp as its local inference runtime and Gemma 3 4B as its language model.

Follow these steps to enable **Ask Your Vault**.

### Step 1: Install llama.cpp

Visit the official repository:

[llama.cpp — GitHub](https://github.com/ggml-org/llama.cpp)

Follow the installation or build instructions for your operating system.

Make sure you have access to the `llama-server` executable.

For Windows, the executable may be named:

`llama-server.exe`

### Step 2: Download Gemma 3 4B GGUF

Download a compatible Gemma 3 4B instruction-tuned GGUF model from a trusted model repository.

Choose a quantization suitable for your hardware.

For example:

`gemma-3-4b-it-Q4_K_M.gguf`

The exact filename depends on the model distribution you select.

Make sure the model includes an appropriate chat template.

### Step 3: Start llama-server

Open PowerShell and execute:

\`\`\`powershell
llama-server.exe \`
  -m "C:\\path\\to\\gemma-3-4b-it-Q4_K_M.gguf" \`
  --host 127.0.0.1 \`
  --port 8080 \`
  --alias gemma-3-4b-it
\`\`\`

Replace the model path with the actual location of your downloaded GGUF file.

The server will expose its OpenAI-compatible API at:

`http://127.0.0.1:8080/v1`

Keep the terminal running while using the AI functionality.

### Step 4: Configure the Backend

Add the following environment variables to `server/.env`:

\`\`\`env
LLAMA_CPP_BASE_URL=http://127.0.0.1:8080/v1

LLAMA_CPP_MODEL=gemma-3-4b-it
\`\`\`

If your llama.cpp server requires an API key:

\`\`\`env
LLAMA_CPP_API_KEY=your-local-api-key
\`\`\`

The configured model name must match the alias supplied when starting llama-server.

Restart the backend after updating the environment variables.

### Step 5: Verify the Model Server

Check whether llama-server is responding:

`http://127.0.0.1:8080/v1/models`

If the endpoint responds successfully, the local model server is available.

Now open MemoryVault and try **Ask Your Vault**.

### Local AI Request Flow

\`\`\`text
MemoryVault Backend
        |
        | HTTP Request
        v
http://127.0.0.1:8080/v1
        |
        v
    llama-server
        |
        v
   Gemma 3 4B
        |
        v
 Generated Response
\`\`\`

**Security recommendation:** Keep llama-server bound to `127.0.0.1`. Do not expose the inference server directly to the public internet.

---

## ☁️ Render Deployment Configuration

MemoryVault's frontend and backend are deployed as separate services on Render.

### Frontend Environment

Configure the frontend service with:

\`\`\`env
VITE_API_URL=https://memoryvault-m4xy.onrender.com
\`\`\`

### Backend Environment

Configure the backend service with:

\`\`\`env
MONGODB_URL=your-production-mongodb-connection-string

JWT_SECRET=your-production-secret

CLIENT_ORIGIN=https://memoryvault-4193.onrender.com
\`\`\`

Configure the backend port according to the Render service configuration.

Keep all production credentials in Render's environment variable settings.

### Important Deployment Considerations

- Backend CORS must allow the deployed frontend origin.
- Use a persistent MongoDB database.
- Uploaded attachments currently use backend filesystem storage.
- Render's ephemeral filesystem should not be treated as permanent attachment storage.
- Use a persistent disk or object storage for durable production attachments.
- The Render backend and local llama.cpp server are separate runtime environments.

---

## 🔐 Authentication

Authenticated API routes use:

\`\`\`http
Authorization: Bearer <token>
\`\`\`

- Registration and login endpoints are public.
- Protected endpoints require a valid signed bearer token.
- Authentication is managed by the Express backend.

---

## 🗄️ Database & Storage

MongoDB is the primary application database.

It stores:

- User accounts
- Family spaces
- Family members
- Memories
- Memory metadata
- Memory relationships

Attachments are stored separately on the backend filesystem:

\`\`\`text
server/uploads
\`\`\`

For production environments, persistent filesystem storage or dedicated object storage is recommended.

> **Privacy and access control:** Family spaces and memories belong to the signed-in account. "Me" is a memory association label, not a separate access-control mechanism.

---

## 🔌 API Reference

Authenticated routes require a valid bearer token.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | API health check |
| POST | `/api/auth/register` | Register a new account |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve current account |
| GET, POST | `/api/families` | List or create family spaces |
| GET, PATCH | `/api/families/:familyId` | Retrieve or rename a family |
| GET, POST | `/api/families/:familyId/members` | List or add family members |
| PATCH, DELETE | `/api/families/:familyId/members/:memberId` | Update or remove a member |
| GET, POST | `/api/families/:familyId/memories` | List or create memories |
| POST | `/api/families/:familyId/ask` | Ask questions about saved memories |
| GET, PATCH, DELETE | `/api/memories/:memoryId` | Retrieve, update, or delete a memory |
| GET | `/api/memories/:memoryId/attachment` | Download a memory attachment |

---

## 📁 Project Structure

\`\`\`text
MemoryVault/
│
├── client/
│   └── React + TypeScript frontend
│
├── server/
│   ├── Express REST API
│   ├── MongoDB / Mongoose models
│   ├── Authentication
│   ├── Family and member management
│   ├── Memory management
│   ├── Memory retrieval
│   ├── llama.cpp integration
│   └── uploads/
│
└── README.md
\`\`\`

---

## ⚡ Useful Commands

Run commands from the relevant `client` or `server` directory.

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build |
| `npm run lint` | Run frontend lint checks |
| `npm start` | Start compiled backend |

---

## ⚠️ Current Limitations

- Attachments are stored on the backend filesystem rather than dedicated object storage.
- Each document or photo memory supports one attachment.
- Document attachments must be PDFs.
- Photo attachments must be JPEG, PNG, or WebP.
- Maximum attachment size is 15 MB.
- AI retrieval currently works with saved memory titles and text.
- PDF and image contents are not currently parsed or indexed for AI retrieval.
- Ask Your Vault requires an accessible llama.cpp server.
- MongoDB must be available for backend functionality.
- AI response quality depends on the model, quantization, available context, and hardware.
- Attachments may not persist across Render restarts or redeployments without persistent storage.
- The public Render backend cannot access a model server running on the developer's local machine through localhost.

---

## 🔮 Future Improvements

- Semantic and vector-based memory retrieval.
- Improved memory ranking.
- PDF parsing and indexing.
- Image understanding for photo memories.
- Streaming AI responses.
- Improved source attribution.
- Persistent attachment storage.
- Support for additional open-weight models.
- Expanded automated test coverage.
- Improved production deployment configuration.

---

## 🏆 Project Highlights

MemoryVault demonstrates the integration of full-stack development and locally hosted AI inference in a practical application.

Key engineering concepts explored:

- Full-stack application architecture.
- REST API development.
- Authentication and protected routes.
- MongoDB data modeling and relationships.
- File upload and download handling.
- Retrieval-first AI architecture.
- Local LLM inference using llama.cpp.
- OpenAI-compatible model communication.
- Hybrid deployment using Render and local infrastructure.

The project's central idea is simple: **preserve personal memories and make them searchable through AI, without making a hosted proprietary LLM API a requirement.**

---

## 📜 License

This project is licensed under the terms specified in the repository's license file.

---

**Built with ❤️ to preserve the memories that matter.**