# ScalerOne API

Hono server: **MongoDB Atlas** (Lost & Found JSON + CLIP vectors), **Cloudflare R2** (photos), **Firebase Auth** (ID token verify). Deploy with Vercel Root Directory `server/`.

## Secrets (never `EXPO_PUBLIC_`)

| Variable | Where |
| --- | --- |
| `MONGODB_URL` | Atlas connection string |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 S3 API token |
| `R2_BUCKET` | `scalerone-images` |
| `R2_PUBLIC_BASE_URL` | Public r2.dev (or custom) origin, no trailing slash |
| `HF_TOKEN` | Hugging Face token for CLIP embeddings |
| `FIREBASE_SERVICE_ACCOUNT` | Admin JSON for real Firebase users |
| `ALLOW_MOCK_AUTH` | Local only (`true`) |

Enable R2 in the Cloudflare dashboard first (`r2_bucket_create` fails until then). Create Atlas index `item_vector_index` in the UI if `createSearchIndex` is blocked on M0.

```bash
cp .env.example .env
npm install
npm run dev
npm run seed
npm run embed
```

Health: `GET http://localhost:3001/v1/health`
