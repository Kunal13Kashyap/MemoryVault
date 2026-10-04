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

The ask endpoint uses LM Studio's OpenAI-compatible Chat Completions API. Start
the local server from LM Studio's Developer tab (port `1234` by default), then
set `LM_STUDIO_MODEL` to the exact model identifier shown by its `/v1/models`
endpoint. `LM_STUDIO_BASE_URL` defaults to `http://127.0.0.1:1234/v1`.
`LM_STUDIO_API_KEY` is optional unless API authentication is enabled in LM
Studio. The endpoint returns an answer and the memories used as sources.
