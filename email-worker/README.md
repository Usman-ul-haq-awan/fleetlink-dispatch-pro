# FleetLink Email Worker

A tiny dedicated worker that receives outbound email requests from the Base44
backend and forwards them to **Resend's HTTPS API** (port 443). Because it uses
HTTPS — not SMTP — it runs on **any** host (Render, Railway, Fly.io, a VPS)
without blocked-port issues.

## 1. Set up Resend

1. Create a free account at https://resend.com (3,000 emails/month, 100/day free).
2. Verify your sending domain (e.g. `tycoonlogistics.online`) in Resend → Domains,
   OR use Resend's sandbox `onboarding@resend.dev` for quick testing.
3. Generate an API key at Resend → API Keys → "Create API Key" (Sending access).
4. Note the API key — it goes on the worker as `RESEND_API_KEY`.

## 2. Deploy the worker

### Render (recommended — free tier works)
1. New → Web Service → connect this repo (or point at the `email-worker/` directory).
2. **Build Command:** `npm install`
3. **Start Command:** `npm start`
4. **Environment Variables:**
   - `RESEND_API_KEY` — from step 1
   - `API_KEY` — a random secret you make up (e.g. `openssl rand -hex 32`)
   - `PORT` — leave unset (Render injects it)
5. Deploy. Copy the service URL (e.g. `https://fleetlink-email.onrender.com`).

### Railway / Fly.io / VPS
Same env vars. On a VPS: `npm install && npm start` with the three env vars set.

## 3. Verify

```bash
curl https://<worker-url>/health
# {"status":"ok","service":"fleetlink-email-worker","resend_configured":true}

curl -X POST https://<worker-url>/send-email \
  -H "Content-Type: application/json" \
  -H "x-worker-api-key: <your API_KEY>" \
  -d '{"to":"you@example.com","subject":"Test","body":"Hello from FleetLink","from_email":"admin@tycoonlogistics.online","from_name":"Dispatch Team"}'
```

## 4. Connect the Base44 app

In the Base44 builder, add two app secrets:
- `EMAIL_WORKER_URL` — the worker URL from step 2
- `EMAIL_WORKER_API_KEY` — the `API_KEY` value from step 2

Then in **Settings → SMTP Email Server**, set:
- `smtp_from_email` — a Resend-verified address (e.g. `admin@tycoonlogistics.online`)
- `smtp_from_name` — your sender display name

That's it. Test emails and campaigns now send through this worker → Resend.