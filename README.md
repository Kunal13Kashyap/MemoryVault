# MemoryVault

**Keep the stories, recipes, and small moments that make your family yours.**

MemoryVault is a private family-memory app for collecting text memories and
attachments, connecting them to the people they’re about, and asking questions
about what you’ve saved. It has a React frontend and an Express/MongoDB API.
The optional AI answers questions using a locally running model through
[LM Studio](https://lmstudio.ai/).

## Features

- Create an account, sign in, and manage private family spaces.
- Add family members and connect a memory to one or more people.
- Mark a memory as connected to **Me**, family members, both, or the whole
  family.
- Save memories as **stories**, **recipes**, **notes**, **documents**, or
  **photos**.
- Attach one PDF to a document memory, or one JPEG, PNG, or WebP image to a
  photo memory. Uploads are limited to 15 MB.
- Search and filter your family’s memories.
- Ask questions about saved memories and see which memories informed the
  answer.
- Download attachments through an authenticated API route.

> **Privacy and storage:** Families and memories belong to the signed-in
> account. “Me” is an association label, not a separate access-control setting.
> Attachments are stored on the backend’s local disk in `server/uploads`; use a
> persistent disk or volume when deploying, or uploads can be lost when the
> server’s filesystem is cleared.

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB with Mongoose |
| Authentication | Signed bearer tokens and password hashing |
| Optional local AI | LM Studio OpenAI-compatible Chat Completions API |

## Requirements

- Node.js and npm (Node.js 22 LTS is recommended).
- MongoDB, running locally or available through a connection URL.
- LM Studio and a loaded chat model **only if you want to use “Ask your vault.”**

## Run locally

Open two terminals from the repository root.

### 1. Configure and start the backend

```powershell
cd server
Copy-Item .env.example .env
npm install
npm run dev
```

Edit `server/.env` and set:

```dotenv
PORT=3000
MONGODB_URL=mongodb://127.0.0.1:27017/memoryvault
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
CLIENT_ORIGIN=http://localhost:5173
```

Generate a unique, random `JWT_SECRET` of at least 32 characters. Keep it
private—never put backend secrets in the frontend or commit your `.env` file.
The API serves a health check at `http://localhost:3000/health`.

### 2. Configure and start the frontend

In a second terminal, from the repository root:

```powershell
cd client
npm install
npm run dev
```

Open the local URL Vite prints (by default,
`http://localhost:5173`). For local development, the Vite server proxies API
requests to `http://localhost:3000`, so no frontend `.env` file is required.
If the API runs at another local origin, set
`VITE_API_PROXY_TARGET` in `client/.env`. For a separately deployed API, set
`VITE_API_URL` to its origin and configure the backend `CLIENT_ORIGIN` to match
the frontend’s origin.

### 3. (Optional) Enable “Ask your vault”

Start the local server in LM Studio and load a chat model. Find the exact model
identifier from LM Studio’s `/v1/models` endpoint, then set these in
`server/.env`:

```dotenv
LM_STUDIO_BASE_URL=http://127.0.0.1:1234/v1
LM_STUDIO_MODEL=your-loaded-model-id
# Set only if LM Studio API authentication is enabled:
# LM_STUDIO_API_KEY=your-local-api-key
```

Restart the backend after changing its environment. The ask feature searches
saved memory titles and text for relevant matches, then sends that context and
the question to the local model. It does not use uploaded document or photo
contents as AI context. If LM Studio is not configured, the rest of the app
continues to work; asking a question returns an availability/configuration
error.

## Useful commands

Run these from the corresponding `client` or `server` directory:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the frontend dev server or backend watch server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run frontend ESLint checks (client only) |
| `npm start` | Start the compiled backend (server only; build first) |

## API overview

Authenticated API routes use an `Authorization: Bearer <token>` header.
Registration and login are public.

| Method | Route | Description |
| --- | --- | --- |
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
| `GET` | `/api/memories/:memoryId/attachment` | Download its attachment |

## Project layout

```text
MemoryVault/
├── client/       # React + TypeScript frontend
└── server/       # Express API, MongoDB models, and upload storage
```

## Current limitations

- Files are stored on local disk, not cloud storage or MongoDB GridFS.
- Each document or photo memory has one attachment. Documents must be PDFs;
  photos must be JPEG, PNG, or WebP, up to 15 MB.
- AI answers are based on matching saved text only; attachment contents are not
  parsed or indexed.
- The backend must be reachable by the frontend, and MongoDB must be available
  for the application to start.