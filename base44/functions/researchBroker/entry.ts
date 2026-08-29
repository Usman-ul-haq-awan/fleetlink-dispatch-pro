// Researches a broker's FMCSA authority & bond data and updates the Broker record.
// Fetches the SAFER Company Snapshot (authority status, entity type, name match)
// and the FMCSA Licensing & Insurance page (bond type, amount, active status),
// then re-calculates the vetting score.

import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { parseSaferSnapshot, stripHtml, extractLinks } from "../../shared/saferParser.ts";
import { scoreBroker } from "../../shared/brokerScoring.ts";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

async function fetchPage(url: string): Promise<{ html: string; ok: boolean; status: number; finalUrl: string }> {
  try {
    const response = await fetch(url, { headers: BROWSER_HEADERS, redirect: "follow" });
    const html = await response.text();
    return { html, ok: response.ok, status: response.status, finalUrl: response.url || url };
  } catch {
    return { html: "", ok: false, status: 0, finalUrl: url };
  }
}

function buildSaferUrl(usdot?: string, mc?: string): string {
  const param = usdot ? "USDOT" : "MC_MX";
  const value = usdot || (mc || "").replace(/^MC-?/i, "");
  return `https://safer.fmcsa.dot.gov/query.asp?query_type=queryCarrierSnapshot&query_param=${param}&query_string=${encodeURIComponent(value)}`;
}

// Parse the FMCSA Licensing & Insurance page for broker bond (process agent / trust) info.
function parseBondInfo(html: string): {
  bondType: string;
  bondAmount: number | null;
  bondActive: boolean;
} {
  const text = stripHtml(html);
  const lower = text.toLowerCase();

  // Detect bond / trust filing type
  let bondType = "Not Verified";
  if (/BMC-?84/i.test(text)) bondType = "BMC-84";
  else if (/BMC-?85/i.test(text)) bondType = "BMC-85";

  // Detect whether the bond/authority is active (cancellation date blank or in future)
  let bondActive = false;
  const cancelMatch = text.match(/cancellation\s+date\s*:?\s*([^\n|]{0,40})/i);
  if (cancelMatch) {
    const cancelVal = cancelMatch[1].trim();
    // "None" or blank means active
    bondActive = !cancelVal || /none|^[-]*$|^n\/a$/i.test(cancelVal);
  } else {
    // No cancellation field found — if "effective date" present and no cancellation, treat as active
    bondActive = /effective\s+date/i.test(lower) && !/cancelled/i.test(lower);
  }

  // Try to extract a dollar amount near "bond" or "trust" or the BMC filing
  let bondAmount: number | null = null;
  const amountMatch = text.match(/(?:bond|trust|coverage|amount)[^$\d]{0,30}\$?\s*([\d,]{5,})/i);
  if (amountMatch) {
    const n = parseInt(amountMatch[1].replace(/[^0-9]/g, ""), 10);
    if (!isNaN(n)) bondAmount = n;
  }
  // Fallback: any $75,000-style amount on the page (standard broker bond)
  if (bondAmount === null) {
    const stdMatch = text.match(/\$\s*75,?000/);
    if (stdMatch) bondAmount = 75000;
  }

  return { bondType, bondAmount, bondActive };
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin access required" }, { status: 403 });

    const body = await req.json();
    const { broker_id, mc, usdot } = body;

    if (!broker_id && !mc && !usdot) {
      return Response.json({ error: "broker_id, mc, or usdot is required" }, { status: 400 });
    }

    const svc = base44.asServiceRole;

    // Find the broker record
    let broker: any;
    if (broker_id) {
      broker = await svc.entities.Broker.get(broker_id);
    } else {
      const cleanMc = mc ? String(mc).replace(/^MC-?/i, "") : "";
      const found = cleanMc
        ? await svc.entities.Broker.filter({ mc_number: cleanMc })
        : await svc.entities.Broker.filter({ usdot_number: String(usdot) });
      if (found.length === 0) return Response.json({ error: "Broker not found" }, { status: 404 });
      broker = found[0];
    }

    const brokerId = broker.id;
    const now = new Date().toISOString();
    const errors: string[] = [];
    const stepsCompleted: string[] = [];

    const saferUrl = buildSaferUrl(usdot || broker.usdot_number, mc || broker.mc_number);
    const saferResult = await fetchPage(saferUrl);

    if (!saferResult.ok || saferResult.html.length < 500) {
      errors.push(`SAFER page fetch failed (status ${saferResult.status})`);
      await svc.entities.Broker.update(brokerId, {
        authority_verified: false,
        vetting_date: now,
      });
      return Response.json({ success: false, broker_id: brokerId, errors });
    }

    const saferData = parseSaferSnapshot(saferResult.html, saferResult.finalUrl);

    if (!saferData.legalName && !saferData.usdotNumber) {
      errors.push("SAFER page did not contain carrier data (broker may not exist)");
      return Response.json({ success: false, broker_id: brokerId, errors });
    }

    stepsCompleted.push("safer");

    // Determine authority status from SAFER
    const opStatus = (saferData.operatingStatus || "").toUpperCase();
    const authStatusRaw = (saferData.operatingAuthorityStatus || opStatus || "").toUpperCase();
    let authorityStatus: string;
    if (authStatusRaw.includes("AUTHORIZED") || authStatusRaw === "ACTIVE") authorityStatus = "Active";
    else if (authStatusRaw.includes("SUSPEND")) authorityStatus = "Suspended";
    else if (authStatusRaw.includes("REVOK")) authorityStatus = "Revoked";
    else if (authStatusRaw.includes("INACTIVE") || authStatusRaw.includes("NOT")) authorityStatus = "Inactive";
    else authorityStatus = broker.authority_status || "Not Verified";

    const authorityVerified = authorityStatus === "Active";

    // Determine authority type — broker vs carrier-broker
    const entityType = (saferData.entityType || "").toUpperCase();
    const carrierType = (saferData.carrierType || "").toUpperCase();
    let authorityType = broker.authority_type || "";
    if (entityType.includes("BROKER") || carrierType.includes("BROKER")) {
      authorityType = entityType.includes("CARRIER") ? "Carrier-Broker" : "Broker";
    }

    // Name match check
    const saferName = (saferData.legalName || "").toUpperCase().trim();
    const brokerName = (broker.broker_name || "").toUpperCase().trim();
    const nameMatches = saferName.length > 0 && brokerName.length > 0 &&
      (saferName === brokerName || saferName.includes(brokerName) || brokerName.includes(saferName));

    const update: any = {
      authority_status: authorityStatus,
      authority_verified: authorityVerified,
      authority_type: authorityType,
      name_matches_authority: nameMatches,
      usdot_number: saferData.usdotNumber || broker.usdot_number,
      mc_number: saferData.mcNumber || broker.mc_number,
      phone: saferData.phone || broker.phone,
      address: saferData.address || broker.address,
      city: saferData.city || broker.city,
      state: saferData.state || broker.state,
      zip: saferData.zip || broker.zip,
      vetting_date: now,
    };

    // STEP 2: Fetch Licensing & Insurance page for bond info
    if (saferData.insuranceLink) {
      const insUrl = saferData.insuranceLink.startsWith("http")
        ? saferData.insuranceLink
        : `https://safer.fmcsa.dot.gov/${saferData.insuranceLink}`;
      const insResult = await fetchPage(insUrl);

      if (insResult.ok && insResult.html.length > 500) {
        const bond = parseBondInfo(insResult.html);
        update.bond_type = bond.bondType;
        update.bond_verified = bond.bondType !== "Not Verified";
        update.bond_active = bond.bondActive;
        if (bond.bondAmount !== null) update.bond_amount = bond.bondAmount;
        stepsCompleted.push("insurance");
      } else {
        errors.push(`Insurance page fetch failed (status ${insResult.status})`);
      }
    }

    // Re-score the broker with the newly researched data
    const merged = { ...broker, ...update };
    const { score, rating } = scoreBroker(merged);
    update.vetting_score = score;
    update.vetting_rating = rating;

    await svc.entities.Broker.update(brokerId, update);

    await svc.entities.ActivityLog.create({
      action: "Broker researched via FMCSA",
      workflow: "researchBroker",
      details: `Authority: ${authorityStatus}. Bond: ${update.bond_type || "Not Verified"}. Score: ${score} (${rating}).`,
      status: errors.length > 0 ? "Warning" : "Success",
      timestamp: now,
    });

    return Response.json({
      success: true,
      broker_id: brokerId,
      steps_completed: stepsCompleted,
      errors,
      authority_status: authorityStatus,
      authority_verified: authorityVerified,
      bond_type: update.bond_type,
      bond_active: update.bond_active,
      vetting_score: score,
      vetting_rating: rating,
    });
  } catch (error: any) {
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}