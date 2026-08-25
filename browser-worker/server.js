// HTTP server exposing the Playwright browser worker.
// The Base44 backend function (researchCarrierBrowser) calls POST /research.
//
// Deploy this on any host that can run Chromium (Render, Railway, Fly.io, a VPS).
// See README.md for deployment instructions.

const express = require('express');
const { runResearch } = require('./scraper');

const app = express();
app.use(express.json({ limit: '2mb' }));

const API_KEY = process.env.API_KEY || '';
const PORT = process.env.PORT || 3000;

function authMiddleware(req, res, next) {
  if (!API_KEY) return next(); // auth disabled (local dev only)
  const provided = req.headers['x-worker-api-key'];
  if (provided !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing x-worker-api-key' });
  }
  next();
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'fleetlink-browser-worker' });
});

app.post('/research', authMiddleware, async (req, res) => {
  const { usdot, mc } = req.body || {};
  if (!usdot && !mc) {
    return res.status(400).json({ error: 'Either "usdot" or "mc" is required in the request body.' });
  }
  const start = Date.now();
  try {
    const result = await runResearch({ usdot: usdot ? String(usdot) : null, mc: mc ? String(mc) : null });
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`Research complete: USDOT=${usdot || 'n/a'} MC=${mc || 'n/a'} (${elapsed}s) steps=${result.steps.length}`);
    res.json(result);
  } catch (err) {
    console.error('Research error:', err.message);
    res.status(500).json({ error: err.message, errors: [{ step: 'Worker', state: 'BROWSER_ERROR', message: err.message }] });
  }
});

app.listen(PORT, () => {
  console.log(`FleetLink browser worker listening on port ${PORT}`);
  console.log(`Auth: ${API_KEY ? 'enabled' : 'DISABLED (set API_KEY in production)'}`);
});