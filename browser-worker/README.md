# FleetLink Browser Worker (Playwright)

This is the **browser automation worker** that performs the real SAFER/SMS data
extraction for FleetLink Dispatch Pro.

Base44's serverless environment cannot run a full Chromium browser, so this
worker runs **separately** — on any host that can launch headless Chromium
(Render, Railway, Fly.io, a VPS, etc.). The Base44 backend function
`researchCarrierBrowser` calls this worker's HTTP API.

## What it does

It opens the **public FMCSA SAFER/SMS web pages in a real Chromium browser** and:

1. Opens the SAFER Company Snapshot for a USDOT or MC number
2. Extracts legal name, DBA, address, phone, power units, drivers, cargo, etc.
3. **Discovers carrier-specific links** on the page (SMS Results, Licensing &
   Insurance, Inspections/Crashes, Safety Rating) — it does NOT guess URLs
4. Opens the SMS Overview, then follows links to Complete SMS Profile, Carrier
   History, and Carrier Registration Details
5. Returns to the snapshot and opens Licensing & Insurance, Inspections/Crashes,
   and Safety Rating
6. **Validates the USDOT** on every page (identity check) — stops on mismatch
7. Detects CAPTCHA / access challenges and stops (never fabricates data)
8. Returns structured JSON with per-section status, source URLs, and timestamps

## Local test (KLEI EXPRESS INC, USDOT 1673510)

```bash
cd browser-worker
npm install
npx playwright install chromium
node test.js 1673510
```

This runs a real browser extraction and prints the structured result. You should
see `Identity verified: true` and the carrier fields populated.

## Deploy

### Option A — Render (recommended, free tier works)

1. Create a new Web Service, connect this `browser-worker/` folder (or the whole
   repo and set Root Directory to `browser-worker`).
2. Build command: `npm install && npx playwright install --with-deps chromium`
3. Start command: `node server.js`
4. Add environment variable `API_KEY` = a long random string.
5. Render assigns a URL like `https://fleetlink-worker.onrender.com`.

### Option B — Railway / Fly.io / VPS

Same idea: install deps + Playwright Chromium, set `API_KEY` and `PORT`, run
`node server.js`. On a plain VPS: `npm install`, `npx playwright install-deps`,
`npx playwright install chromium`, then `API_KEY=xxx node server.js`.

## Connect to Base44

After deploying, in your Base44 app go to **Settings → Environment Variables**
and add:

| Secret name       | Value                                      |
|-------------------|--------------------------------------------|
| `WORKER_URL`      | `https://your-worker-host.com` (no trailing slash) |
| `WORKER_API_KEY`  | The same `API_KEY` you set on the worker    |

Then use the **Research Queue** page in the app and click **RESEARCH CARRIER**.
The Base44 function `researchCarrierBrowser` will call your worker, save the
extracted data (Carrier, Evidence, CrashRecord, InspectionRecord,
InsuranceRecord, RegistrationDetail, CarrierHistory, SafetyBasic), run the
safety qualification + lead scoring engines, and refresh the carrier profile.

## API

### `GET /health`
Returns `{ "status": "ok" }`.

### `POST /research`
**Header:** `x-worker-api-key: <API_KEY>` (if `API_KEY` is set)

**Body:**
```json
{ "usdot": "1673510" }
```
or
```json
{ "mc": "679812" }
```

**Response:** structured JSON — see `runResearch()` return value in `scraper.js`.