# MemoryVault server

Express and MongoDB API for private family memories. Each account can access
only the families it owns.

## Run locally

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URL` and replace `JWT_SECRET` with a random value of at least
   32 characters.
3. Run `npm install`, then `npm run dev`.

The API listens on port `3000` by default. `GET /health` checks the HTTP server.
Requests under `/api` require a bearer authorization header, except registration
and login.

## API

- `POST /api/auth/register` and `POST /api/auth/login` return a bearer token.
- `GET /api/auth/me` returns the signed-in account.
- `GET|POST /api/families` lists or creates a family.
- `GET|PATCH /api/families/:familyId` reads or renames a family.
- `GET|POST /api/families/:familyId/members` lists or adds family members.
- `PATCH|DELETE /api/families/:familyId/members/:memberId` updates or removes a member.
- `GET|POST /api/families/:familyId/memories` lists or adds memories. Document
  and photo memories use a multipart attachment.
- `POST /api/families/:familyId/ask` retrieves relevant memories and asks local Gemma.
- `GET|PATCH|DELETE /api/memories/:memoryId` reads, updates, or deletes a memory.
- `GET /api/memories/:memoryId/attachment` downloads an attachment after checking
  that the signed-in account owns the memory.

Memory types are `recipe`, `story`, `note`, `document`, and `photo`. Recipes,
stories, and notes are text memories. Documents accept one PDF and photos accept
one JPEG, PNG, or WebP image per memory; files are limited to 15 MB and stored
under `server/uploads`. The upload folder is excluded from version control.
Attachments are private and are served only through the authenticated download
route. Memories can be associated with the account owner (“Me”) as well as
multiple family members; leaving both unselected associates a memory with the
whole family. Existing single-person associations are retained.

The ask endpoint uses llama.cpp's OpenAI-compatible Chat Completions API. Start
`llama-server` with a Gemma 3 4B GGUF model and an alias, for example:

```powershell
llama-server -m "C:\path\to\gemma-3-4b-it-Q4_K_M.gguf" --host 127.0.0.1 --port 8080 --alias gemma-3-4b-it
```

Set `LLAMA_CPP_MODEL` to the same alias (`gemma-3-4b-it`) and
`LLAMA_CPP_BASE_URL` to the server's OpenAI-compatible API root. The base URL
defaults to `http://127.0.0.1:8080/v1`. `LLAMA_CPP_API_KEY` is optional and
should be set only if the server was started with `--api-key`. The endpoint
returns an answer and the memories used as sources.
