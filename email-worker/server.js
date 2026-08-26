// Dedicated email worker for FleetLink Dispatch Pro.
// Receives outbound email requests from the Base44 backend and forwards them
// to Resend's HTTPS API (port 443 — works on any host, no SMTP egress needed).
//
// Env vars:
//   RESEND_API_KEY  — Resend API key (required for sending)
//   API_KEY         — shared secret for the x-worker-api-key header (set in production)
//   PORT            — listen port (default 3001)

const express = require('express');

const app = express();
app.use(express.json({ limit: '2mb' }));

const API_KEY = process.env.API_KEY || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const PORT = process.env.PORT || 3001;

function authMiddleware(req, res, next) {
  if (!API_KEY) return next(); // auth disabled (local dev only)
  const provided = req.headers['x-worker-api-key'];
  if (provided !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing x-worker-api-key' });
  }
  next();
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'fleetlink-email-worker',
    resend_configured: Boolean(RESEND_API_KEY),
  });
});

app.post('/send-email', authMiddleware, async (req, res) => {
  const { to, subject, body, from_email, from_name } = req.body || {};

  if (!to || !subject) {
    return res.status(400).json({ error: 'to and subject are required' });
  }
  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured on the worker' });
  }

  try {
    const fromAddr = from_email
      ? `${from_name ? `${from_name} ` : ''}<${from_email}>`
      : (from_name || 'Dispatch Team');

    const apiRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddr,
        to: [to],
        subject,
        text: body || '',
      }),
    });

    const data = await apiRes.json().catch(() => ({}));

    if (!apiRes.ok) {
      console.error('Resend API error:', apiRes.status, data);
      return res.status(apiRes.status).json({
        error: data.message || `Resend API returned ${apiRes.status}`,
        details: data,
      });
    }

    console.log(`Email sent to ${to}: ${data.id}`);
    res.json({ success: true, messageId: data.id });
  } catch (err) {
    console.error('Email send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`FleetLink email worker listening on port ${PORT}`);
  console.log(`Auth: ${API_KEY ? 'enabled' : 'DISABLED (set API_KEY in production)'}`);
  console.log(`Resend: ${RESEND_API_KEY ? 'configured' : 'NOT configured (set RESEND_API_KEY)'}`);
});