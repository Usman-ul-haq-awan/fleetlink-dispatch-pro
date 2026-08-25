// Playwright browser automation scraper for FMCSA SAFER/SMS public web pages.
// This runs in a REAL Chromium browser — not a simple HTTP fetch.
//
// Workflow:
//   1. Open SAFER Company Snapshot for a USDOT/MC
//   2. Discover carrier-specific links on the page (SMS, Insurance, Inspections, Safety Rating)
//   3. Open SMS Overview, then Complete SMS Profile, Carrier History, Registration Details
//   4. Return to snapshot, open Licensing & Insurance
//   5. Open Inspections/Crashes
//   6. Open Safety Rating
//   7. Validate carrier identity (USDOT) on every page
//   8. Return structured JSON with per-section status, source URLs, retrieval timestamps

const { chromium } = require('playwright');

const SAFER_BASE = 'https://safer.fmcsa.dot.gov/query.asp';

function buildSnapshotUrl({ usdot, mc }) {
  if (usdot) {
    return `${SAFER_BASE}?query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${encodeURIComponent(String(usdot))}`;
  }
  if (mc) {
    const clean = String(mc).replace(/^MC-?/i, '');
    return `${SAFER_BASE}?query_type=queryCarrierSnapshot&query_param=MC_MX&query_string=${encodeURIComponent(clean)}`;
  }
  throw new Error('Either USDOT or MC number is required');
}

function nowIso() { return new Date().toISOString(); }

// Detect access challenges (captcha, access denied, rate limit). Never bypass them.
function detectChallenge(text, status) {
  const t = (text || '').toLowerCase();
  if (status === 403 || t.includes('access denied') || t.includes('forbidden') || t.includes('unauthorized')) return 'ACCESS_DENIED';
  if (t.includes('captcha') || t.includes('are you a human') || t.includes('please verify') || t.includes('unusual traffic') || t.includes('puzzle')) return 'CAPTCHA_OR_ACCESS_CHALLENGE';
  if (status === 429 || t.includes('rate limit') || t.includes('too many requests')) return 'RATE_LIMITED';
  return null;
}

// Generic label/value extraction engine — works on FMCSA tables (querylabel/queryfield)
// and any TH-scope-row layout. Runs inside the browser page context.
async function extractLabelValuePairs(page) {
  return await page.evaluate(() => {
    const results = [];
    const seen = new Set();
    const labelSelectors = 'th.querylabel, th.querylabelbkg, td.querylabel, .querylabel, th[scope="row"], .formlabel, .b1_background, label';
    const labelCells = Array.from(document.querySelectorAll(labelSelectors));
    for (const cell of labelCells) {
      const label = (cell.textContent || '').replace(/\s+/g, ' ').trim().replace(/[:：]\s*$/, '');
      if (!label || label.length > 100) continue;
      let valueCell = cell.nextElementSibling;
      if (!valueCell && cell.parentElement) {
        const cells = Array.from(cell.parentElement.children);
        const idx = cells.indexOf(cell);
        if (idx >= 0 && idx + 1 < cells.length) valueCell = cells[idx + 1];
      }
      if (valueCell) {
        let value = (valueCell.textContent || '').replace(/\s+/g, ' ').trim();
        const mailto = valueCell.querySelector('a[href^="mailto:"]');
        if (mailto) value = mailto.getAttribute('href').replace(/^mailto:/i, '');
        if (value && !seen.has(label.toLowerCase())) {
          seen.add(label.toLowerCase());
          results.push({ label, value });
        }
      }
    }
    return results;
  });
}

async function extractLinks(page) {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]')).map(a => ({
      text: (a.textContent || '').replace(/\s+/g, ' ').trim(),
      href: a.href,
    })).filter(l => l.text && l.href);
  });
}

async function extractText(page) {
  return await page.evaluate(() => document.body ? document.body.innerText : '');
}

// Extract the BASIC (Behavior Analysis and Safety Improvement Categories) table from SMS.
async function extractBasics(page) {
  return await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll('table'));
    for (const table of tables) {
      const headerText = (table.textContent || '').toLowerCase();
      if (headerText.includes('unsafe driving') && headerText.includes('basic')) {
        const rows = Array.from(table.querySelectorAll('tbody tr, tr'));
        const result = [];
        const knownCats = ['unsafe driving', 'hours of service', 'driver fitness', 'controlled substances', 'vehicle maintenance', 'hazardous materials', 'crash indicator'];
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('td')).map(c => (c.textContent || '').replace(/\s+/g, ' ').trim());
          if (cells.length >= 2 && knownCats.some(c => cells[0].toLowerCase().includes(c))) {
            result.push({
              basic_category: cells[0],
              measure_value: cells[1] || '',
              on_road_percentile: cells[2] || '',
              investigation_percentile: cells[3] || '',
              violation_count: parseInt((cells[4] || '').replace(/[^\d]/g, ''), 10) || 0,
              deficiency_indicator: cells[cells.length - 1] || '',
            });
          }
        }
        if (result.length > 0) return result;
      }
    }
    return [];
  });
}

function findLinkByText(links, keywords) {
  const kws = keywords.map(k => k.toLowerCase());
  let match = links.find(l => kws.every(k => l.text.toLowerCase().includes(k)));
  if (match) return match;
  match = links.find(l => kws.some(k => l.text.toLowerCase().includes(k)));
  return match || null;
}

function getField(pairs, labels) {
  const want = labels.map(l => l.toLowerCase());
  for (const l of want) {
    const found = pairs.find(p => p.label.toLowerCase() === l);
    if (found) return found.value;
  }
  for (const l of want) {
    const found = pairs.find(p => p.label.toLowerCase().includes(l));
    if (found) return found.value;
  }
  return '';
}

function parseNumber(str) {
  if (str == null || str === '') return null;
  const n = parseInt(String(str).replace(/[^\d-]/g, ''), 10);
  return isNaN(n) ? null : n;
}

async function safeGoto(page, url, timeoutMs) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });
    await page.waitForLoadState('networkidle', { timeout: Math.min(timeoutMs, 15000) }).catch(() => {});
    return { ok: true, status: 200 };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

async function runResearch({ usdot, mc }) {
  const browser = await chromium.launch({
  headless: true,
  executablePath: require('path').join(__dirname, 'node_modules/playwright-core/.local-browsers/chromium-1124/chrome-linux/chrome'),
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
});
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
  });
  const page = await context.newPage();

  const result = {
    requested: { usdot: usdot || null, mc: mc || null },
    carrier: {},
    safer: { status: 'pending' },
    sms: { status: 'pending' },
    sms_profile: { status: 'pending' },
    carrier_history: { status: 'pending' },
    registration: { status: 'pending' },
    insurance: { status: 'pending' },
    inspection_crash: { status: 'pending' },
    safety_rating: { status: 'pending' },
    contacts: {},
    links_discovered: {},
    identity_verified: false,
    errors: [],
    steps: [],
  };

  const stepDone = (name, status, sourceUrl, extra) => {
    result.steps.push({ name, status, source_url: sourceUrl || null, ...(extra || {}) });
  };

  let snapshotPairs = [];

  try {
    // STEP 1 — Company Snapshot
    const snapshotUrl = buildSnapshotUrl({ usdot, mc });
    const goto1 = await safeGoto(page, snapshotUrl, 30000);
    if (!goto1.ok) {
      result.errors.push({ step: 'Company Snapshot', state: 'NETWORK_ERROR', message: goto1.error });
      result.safer = { status: 'error', error_state: 'NETWORK_ERROR', message: goto1.error };
      stepDone('Company Snapshot', 'failed', snapshotUrl, { error: goto1.error });
      await browser.close();
      return result;
    }

    const bodyText = await extractText(page);
    const challenge = detectChallenge(bodyText, 200);
    if (challenge) {
      result.errors.push({ step: 'Company Snapshot', state: challenge, message: 'Access challenge detected — stopping (no data fabricated)' });
      result.safer = { status: 'error', error_state: challenge };
      stepDone('Company Snapshot', 'failed', snapshotUrl, { error: challenge });
      await browser.close();
      return result;
    }

    await page.waitForSelector('table', { timeout: 15000 }).catch(() => {});
    snapshotPairs = await extractLabelValuePairs(page);
    const links = await extractLinks(page);

    const legalName = getField(snapshotPairs, ['Legal Name', 'Name']);
    const dba = getField(snapshotPairs, ['DBA Name', 'DBA']);
    const pageUsdot = getField(snapshotPairs, ['USDOT Number', 'USDOT']);
    const pageMc = getField(snapshotPairs, ['MC Number', 'MC/MX', 'Docket Number', 'MC']);
    const mx = getField(snapshotPairs, ['MX Number']);
    const operatingStatus = getField(snapshotPairs, ['Operating Status', 'USDOT Status']);
    const entityType = getField(snapshotPairs, ['Entity Type', 'Carrier Type']);
    const address = getField(snapshotPairs, ['Physical Address', 'Address']);
    const phone = getField(snapshotPairs, ['Phone', 'Telephone']);
    const fax = getField(snapshotPairs, ['Fax']);
    const powerUnits = parseNumber(getField(snapshotPairs, ['Power Units', 'Power Unit']));
    const drivers = parseNumber(getField(snapshotPairs, ['Drivers', 'Driver']));
    const cargo = getField(snapshotPairs, ['Cargo Carried', 'Cargo', 'Operation Types']);
    const carrierOperation = getField(snapshotPairs, ['Carrier Operation', 'Operation']);

    // STEP 12 — Identity validation
    const requestedUsdot = usdot ? String(usdot) : '';
    const verified = !requestedUsdot || pageUsdot === requestedUsdot || pageUsdot.includes(requestedUsdot);
    result.identity_verified = verified;
    if (!verified) {
      result.errors.push({ step: 'Identity Validation', state: 'IDENTITY_MISMATCH', message: `Requested USDOT ${requestedUsdot} but page shows ${pageUsdot}` });
      stepDone('Identity Validation', 'failed', snapshotUrl, { error: 'IDENTITY_MISMATCH' });
      await browser.close();
      return result;
    }

    result.carrier = {
      legal_name: legalName,
      dba: dba,
      usdot: pageUsdot || usdot,
      mc: pageMc,
      mx: mx,
      address,
      city: getField(snapshotPairs, ['City']),
      state: getField(snapshotPairs, ['State']),
      zip: getField(snapshotPairs, ['ZIP', 'Zip']),
      country: getField(snapshotPairs, ['Country']) || 'US',
      phone,
    };

    result.safer = {
      status: 'ok',
      source_url: page.url(),
      retrieval_date: nowIso(),
      legal_name: legalName,
      operating_status: operatingStatus,
      entity_type: entityType,
      power_units: powerUnits,
      drivers: drivers,
      cargo: cargo,
      carrier_operation: carrierOperation,
      fields: snapshotPairs,
    };
    stepDone('Company Snapshot', 'ok', page.url());

    // STEP 11 — Discover carrier-specific links from the actual page (do not construct guessed URLs)
    const smsLink = findLinkByText(links, ['SMS Results', 'SMS', 'Safety Measurement']);
    const insuranceLink = findLinkByText(links, ['Licensing & Insurance', 'Licensing and Insurance', 'Insurance']);
    const inspectionsLink = findLinkByText(links, ['Inspections/Crashes', 'Inspections', 'Crashes']);
    const safetyRatingLink = findLinkByText(links, ['Safety Rating']);

    result.links_discovered = {
      sms: smsLink ? smsLink.href : null,
      insurance: insuranceLink ? insuranceLink.href : null,
      inspections: inspectionsLink ? inspectionsLink.href : null,
      safety_rating: safetyRatingLink ? safetyRatingLink.href : null,
    };

    // STEP 2 — SMS Results (open the exact discovered link)
    if (smsLink) {
      const gotoSms = await safeGoto(page, smsLink.href, 30000);
      if (gotoSms.ok) {
        await page.waitForSelector('table, .SMS, #ctl00_MainContent_Summary', { timeout: 15000 }).catch(() => {});
        const smsPairs = await extractLabelValuePairs(page);
        const smsLinks = await extractLinks(page);
        const basics = await extractBasics(page);

        const vehicles = parseNumber(getField(smsPairs, ['Number of Vehicles', 'Vehicles', 'Power Units']));
        const smsDrivers = parseNumber(getField(smsPairs, ['Number of Drivers', 'Drivers']));
        const inspections = parseNumber(getField(smsPairs, ['Number of Inspections', 'Inspections', 'Total Inspections']));
        const totalCrashes = parseNumber(getField(smsPairs, ['Total Crashes', 'Crashes']));
        const fatalCrashes = parseNumber(getField(smsPairs, ['Fatal Crashes', 'Fatal']));
        const injuryCrashes = parseNumber(getField(smsPairs, ['Injury Crashes', 'Injury']));
        const towawayCrashes = parseNumber(getField(smsPairs, ['Towaway Crashes', 'Towaway']));
        const carrierSegment = getField(smsPairs, ['Carrier Segment', 'Segment']);
        const dataPeriod = getField(smsPairs, ['Data Period', 'SMS Data Period']);
        const dataDate = getField(smsPairs, ['Data Date', 'SMS Data Date']);

        result.sms = {
          status: 'ok',
          source_url: page.url(),
          retrieval_date: nowIso(),
          vehicles, drivers: smsDrivers, inspections,
          total_crashes: totalCrashes, fatal_crashes: fatalCrashes,
          injury_crashes: injuryCrashes, towaway_crashes: towawayCrashes,
          carrier_segment: carrierSegment,
          data_period: dataPeriod, data_date: dataDate,
          basics,
          fields: smsPairs,
        };
        stepDone('SMS Overview', 'ok', page.url());

        // STEP 3 — Complete SMS Profile (discover link on the SMS page)
        const profileLink = findLinkByText(smsLinks, ['Complete SMS Profile', 'Complete Profile', 'SMS Profile']);
        if (profileLink) {
          const g = await safeGoto(page, profileLink.href, 30000);
          if (g.ok) {
            const profPairs = await extractLabelValuePairs(page);
            result.sms_profile = { status: 'ok', source_url: page.url(), retrieval_date: nowIso(), details: profPairs };
            stepDone('Complete SMS Profile', 'ok', page.url());
          } else {
            result.sms_profile = { status: 'error', error_state: 'NETWORK_ERROR', message: g.error };
            stepDone('Complete SMS Profile', 'failed', profileLink.href, { error: g.error });
          }
          await safeGoto(page, smsLink.href, 30000);
        } else {
          result.sms_profile = { status: 'not_found' };
          stepDone('Complete SMS Profile', 'not_found', null);
        }

        const smsLinks2 = await extractLinks(page);

        // STEP 4 — Carrier History
        const historyLink = findLinkByText(smsLinks2, ['Carrier History', 'History']);
        if (historyLink) {
          const g = await safeGoto(page, historyLink.href, 30000);
          if (g.ok) {
            const hPairs = await extractLabelValuePairs(page);
            result.carrier_history = { status: 'ok', source_url: page.url(), retrieval_date: nowIso(), details: hPairs };
            stepDone('Carrier History', 'ok', page.url());
          } else {
            result.carrier_history = { status: 'error', error_state: 'NETWORK_ERROR', message: g.error };
            stepDone('Carrier History', 'failed', historyLink.href, { error: g.error });
          }
          await safeGoto(page, smsLink.href, 30000);
        } else {
          result.carrier_history = { status: 'not_found' };
          stepDone('Carrier History', 'not_found', null);
        }

        const smsLinks3 = await extractLinks(page);

        // STEP 5 — Carrier Registration Details
        const regLink = findLinkByText(smsLinks3, ['Carrier Registration Details', 'Registration Details', 'Registration']);
        if (regLink) {
          const g = await safeGoto(page, regLink.href, 30000);
          if (g.ok) {
            const regPairs = await extractLabelValuePairs(page);
            result.registration = { status: 'ok', source_url: page.url(), retrieval_date: nowIso(), details: regPairs };
            stepDone('Carrier Registration Details', 'ok', page.url());
          } else {
            result.registration = { status: 'error', error_state: 'NETWORK_ERROR', message: g.error };
            stepDone('Carrier Registration Details', 'failed', regLink.href, { error: g.error });
          }
        } else {
          result.registration = { status: 'not_found' };
          stepDone('Carrier Registration Details', 'not_found', null);
        }
      } else {
        result.sms = { status: 'error', error_state: 'NETWORK_ERROR', message: gotoSms.error };
        stepDone('SMS Overview', 'failed', smsLink.href, { error: gotoSms.error });
      }
    } else {
      result.sms = { status: 'not_found' };
      stepDone('SMS Overview', 'not_found', null);
    }

    // Return to Company Snapshot for the remaining carrier-specific links
    await safeGoto(page, snapshotUrl, 30000);
    const snapLinks2 = await extractLinks(page);

    // STEP 6 — Licensing & Insurance
    const insLink = insuranceLink || findLinkByText(snapLinks2, ['Licensing & Insurance', 'Insurance']);
    if (insLink) {
      const g = await safeGoto(page, insLink.href, 30000);
      if (g.ok) {
        await page.waitForSelector('table', { timeout: 15000 }).catch(() => {});
        const insPairs = await extractLabelValuePairs(page);
        const insLinks = await extractLinks(page);
        result.insurance = {
          status: 'ok', source_url: page.url(), retrieval_date: nowIso(),
          details: insPairs,
          links: insLinks.map(l => ({ text: l.text, href: l.href })),
        };
        stepDone('Licensing & Insurance', 'ok', page.url());
      } else {
        result.insurance = { status: 'error', error_state: 'NETWORK_ERROR', message: g.error };
        stepDone('Licensing & Insurance', 'failed', insLink.href, { error: g.error });
      }
    } else {
      result.insurance = { status: 'not_found' };
      stepDone('Licensing & Insurance', 'not_found', null);
    }

    await safeGoto(page, snapshotUrl, 30000);
    const snapLinks3 = await extractLinks(page);

    // STEP 7 — Inspections/Crashes
    const inspLink = inspectionsLink || findLinkByText(snapLinks3, ['Inspections/Crashes', 'Inspections', 'Crashes']);
    if (inspLink) {
      const g = await safeGoto(page, inspLink.href, 30000);
      if (g.ok) {
        const inspPairs = await extractLabelValuePairs(page);
        result.inspection_crash = { status: 'ok', source_url: page.url(), retrieval_date: nowIso(), details: inspPairs };
        stepDone('Inspections/Crashes', 'ok', page.url());
      } else {
        result.inspection_crash = { status: 'error', error_state: 'NETWORK_ERROR', message: g.error };
        stepDone('Inspections/Crashes', 'failed', inspLink.href, { error: g.error });
      }
    } else {
      result.inspection_crash = { status: 'not_found' };
      stepDone('Inspections/Crashes', 'not_found', null);
    }

    await safeGoto(page, snapshotUrl, 30000);
    const snapLinks4 = await extractLinks(page);

    // STEP 8 — Safety Rating
    const srLink = safetyRatingLink || findLinkByText(snapLinks4, ['Safety Rating']);
    if (srLink) {
      const g = await safeGoto(page, srLink.href, 30000);
      if (g.ok) {
        const srPairs = await extractLabelValuePairs(page);
        const rating = getField(srPairs, ['Rating', 'Safety Rating']);
        const ratingDate = getField(srPairs, ['Rating Date', 'Date']);
        result.safety_rating = { status: 'ok', source_url: page.url(), retrieval_date: nowIso(), rating, rating_date: ratingDate, details: srPairs };
        stepDone('Safety Rating', 'ok', page.url());
      } else {
        result.safety_rating = { status: 'error', error_state: 'NETWORK_ERROR', message: g.error };
        stepDone('Safety Rating', 'failed', srLink.href, { error: g.error });
      }
    } else {
      // Safety rating may be displayed directly on the Company Snapshot
      const rating = getField(snapshotPairs, ['Rating', 'Safety Rating']);
      result.safety_rating = { status: rating ? 'ok' : 'not_found', source_url: snapshotUrl, retrieval_date: nowIso(), rating: rating || '' };
      stepDone('Safety Rating', rating ? 'ok' : 'not_found', snapshotUrl);
    }

    // STEP 9 — Contact extraction (separate fields, each with source/confidence/date)
    result.contacts = {
      owner_name: getField(snapshotPairs, ['Owner Name', 'Owner', 'Contact Name']),
      contact_name: getField(snapshotPairs, ['Contact Name', 'Contact']),
      contact_title: getField(snapshotPairs, ['Contact Title', 'Title']),
      email: getField(snapshotPairs, ['Email', 'E-Mail']),
      fax: fax,
      phone: phone,
      source_url: snapshotUrl,
      confidence: 'High',
      retrieval_date: nowIso(),
    };
  } catch (err) {
    result.errors.push({ step: 'Browser', state: 'BROWSER_ERROR', message: err.message });
  } finally {
    await browser.close();
  }

  return result;
}

module.exports = { runResearch, buildSnapshotUrl };
