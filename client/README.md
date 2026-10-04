# MemoryVault client

The Vite, React, and TypeScript frontend for the MemoryVault API.

## Run locally

1. Start the API from `../server` and configure its MongoDB and JWT environment
   variables as described in `../server/README.md`.
2. From this directory, run `npm install`.
3. The Vite development server proxies `/api` and `/health` to
   `http://localhost:3000` by default. To run the API on a different local
   origin, set `VITE_API_PROXY_TARGET` in `.env`. For a separately deployed API,
   set `VITE_API_URL` to its origin (without a trailing slash).
4. Run `npm run dev` and open the URL printed by Vite.

The API's `CLIENT_ORIGIN` must match the frontend origin (Vite uses
`http://localhost:5173` by default). The development proxy avoids direct
browser-to-API CORS requests. The app supports account registration and
sign-in, family spaces, people, recipes and other text memories, private PDF
document and JPEG/PNG/WebP photo attachments, and asking questions against
saved memories. Attachments are limited to 15 MB and stored on the backend
server's local disk. Memories can be connected to several people; leaving all
people and “Me” unselected connects a memory to the whole family. “Me” can be
selected by itself or alongside family members.

## Checks

- `npm run build` type-checks and builds the production frontend.
- `npm run lint` runs ESLint.
