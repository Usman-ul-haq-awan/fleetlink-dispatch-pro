// SAFER/SMS HTML parsing utilities for FMCSA public web pages.
// Uses targeted regex extraction based on the actual SAFER page HTML structure.

export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<div class="hidden">[\s\S]*?<\/div>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/td>/gi, " | ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<img[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cleanHtml(html: string): string {
  return html
    .replace(/<div class="hidden">[\s\S]*?<\/div>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<img[^>]*>/gi, " ");
}

export function extractLinks(html: string): Array<{ text: string; url: string }> {
  const links: Array<{ text: string; url: string }> = [];
  const linkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1].trim();
    const text = stripHtml(match[2]).trim();
    if (url && text) {
      links.push({ text, url });
    }
  }
  return links;
}

// Extract a field value by its label using the SAFER page's specific HTML structure.
// Pattern: <A class="querylabel" href="...">Label:</A></TH> <TD class="queryfield">Value</TD>
function extractField(html: string, label: string): string {
  const clean = cleanHtml(html);
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Primary pattern: label in <A class="querylabel"> followed by <TD class="queryfield">
  const primaryRegex = new RegExp(
    escapedLabel + "\\s*:</A>\\s*</TH>\\s*<TD[^>]*class=[\"']?queryfield[\"']?[^>]*>([\\s\\S]*?)</TD>",
    "i"
  );
  const primaryMatch = clean.match(primaryRegex);
  if (primaryMatch && primaryMatch[1]) {
    const value = stripHtml(primaryMatch[1]).trim();
    if (value && !isLayoutText(value)) return value;
  }

  // Fallback 1: label in any tag followed by next cell
  const fallbackRegex = new RegExp(
    escapedLabel + "\\s*:</[^>]*>\\s*</t[dh]>\\s*<t[dh][^>]*>([\\s\\S]*?)</t[dh]>",
    "i"
  );
  const fallbackMatch = clean.match(fallbackRegex);
  if (fallbackMatch && fallbackMatch[1]) {
    const value = stripHtml(fallbackMatch[1]).trim();
    if (value && !isLayoutText(value)) return value;
  }

  // Fallback 2: label and value in same text (Label: Value)
  const text = stripHtml(clean);
  const textRegex = new RegExp(escapedLabel + "\\s*:\\s*([^|\\n]+)", "i");
  const textMatch = text.match(textRegex);
  if (textMatch && textMatch[1]) {
    const value = textMatch[1].trim();
    if (value && !isLayoutText(value) && value.length < 200) return value;
  }

  return "";
}

function isLayoutText(value: string): boolean {
  const layoutMarkers = ["SAFER Layout", "SAFER Table", "querylabel", "For formatting"];
  return layoutMarkers.some(m => value.includes(m));
}

// Extract checked items from a checkbox section (Cargo Carried, Carrier Operation).
// Pattern: <TD class="queryfield">X</TD> <TD>...Item Name...</TD>
function extractCheckedItems(html: string, sectionLabel: string, stopLabel?: string): string {
  const clean = cleanHtml(html);
  const sectionStart = clean.indexOf(sectionLabel);
  if (sectionStart < 0) return "";

  // Find the end of the section (next section label or default limit)
  let sectionEnd = sectionStart + 8000;
  if (stopLabel) {
    const nextStart = clean.indexOf(stopLabel, sectionStart + sectionLabel.length);
    if (nextStart > 0) sectionEnd = nextStart;
  }

  const section = clean.substring(sectionStart, sectionEnd);

  // Find all checked items: <TD class="queryfield">X</TD> followed by item name
  const checkedRegex = /<TD[^>]*class=["']?queryfield["']?[^>]*>\s*X\s*<\/TD>\s*<TD[^>]*>([\s\S]*?)<\/TD>/gi;
  const items: string[] = [];
  let match;
  while ((match = checkedRegex.exec(section)) !== null) {
    const itemName = stripHtml(match[1]).trim();
    if (itemName && itemName.length > 1 && !isLayoutText(itemName)) {
      items.push(itemName);
    }
  }

  return items.join(", ");
}

// Fallback: extract all label-value pairs from table cells
export function extractTableFields(html: string): Record<string, string> {
  const clean = cleanHtml(html);
  const fields: Record<string, string> = {};
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const cells: string[] = [];
  let match;
  while ((match = cellRegex.exec(clean)) !== null) {
    const text = stripHtml(match[1]).trim();
    if (text && !isLayoutText(text) && text !== "|") {
      cells.push(text);
    }
  }
  for (let i = 0; i < cells.length - 1; i++) {
    const label = cells[i];
    const value = cells[i + 1];
    if (label && label.endsWith(":") && value && !value.endsWith(":")) {
      const cleanLabel = label.replace(/:$/, "").trim();
      if (cleanLabel && value !== "" && !isLayoutText(value)) {
        fields[cleanLabel] = value.replace(/\|/g, "").trim();
      }
    }
  }
  return fields;
}

export interface SaferData {
  legalName: string;
  dbaName: string;
  usdotNumber: string;
  mcNumber: string;
  mxNumber: string;
  operatingStatus: string;
  carrierType: string;
  entityType: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  fax: string;
  powerUnits: number | null;
  drivers: number | null;
  cargoTypes: string;
  carrierOperation: string;
  safetyRating: string;
  reviewDate: string;
  outOfServiceDate: string;
  operatingAuthorityStatus: string;
  smsLink: string;
  insuranceLink: string;
  rawFields: Record<string, string>;
  links: Array<{ text: string; url: string }>;
  sourceUrl: string;
}

export function parseSaferSnapshot(html: string, sourceUrl: string): SaferData {
  const links = extractLinks(html);

  // Extract company name from the header
  const nameMatch = html.match(/<b>\s*([A-Z][^<]{2,100})\s*<\/b>\s*<br>\s*USDOT/i);
  const legalName = nameMatch ? nameMatch[1].trim() : extractField(html, "Legal Name");

  // Extract USDOT from the header
  const usdotMatch = html.match(/USDOT Number:\s*(\d+)/i);
  const usdotNumber = usdotMatch ? usdotMatch[1] : extractField(html, "USDOT Number");

  // Find SMS and Insurance links
  const smsLink = links.find(l => l.text.toLowerCase().includes("sms"))?.url || "";
  const insuranceLink = links.find(l =>
    l.text.toLowerCase().includes("licensing") || l.text.toLowerCase().includes("insurance")
  )?.url || "";

  // Extract fields using targeted regex
  const mcRaw = extractField(html, "MC/MX Number");
  let mcNumber = mcRaw.replace(/^MC-?/i, "").trim();
  // Fallback: look for MC number in link text (e.g., "MC-679812")
  if (!mcNumber) {
    const mcLink = links.find(l => l.text.includes("MC-") || l.text.match(/MC\d{3,}/i));
    if (mcLink) {
      const mcMatch = mcLink.text.match(/MC-?(\d+)/i);
      if (mcMatch) mcNumber = mcMatch[1];
    }
  }
  const dbaName = extractField(html, "DBA Name");
  const operatingStatus = extractField(html, "USDOT Status") || extractField(html, "Operating Status");
  const phone = extractField(html, "Phone");
  const fax = extractField(html, "Fax");
  // Safety rating is in the Review Information table as "Rating:" field in a <TH> (not in an <A> tag)
  const cleanForRating = cleanHtml(html);
  const ratingMatch = cleanForRating.match(/<TH[^>]*>\s*Rating:\s*<\/TH>\s*<TD[^>]*class=["']?queryfield["']?[^>]*>([\s\S]*?)<\/TD>/i);
  const safetyRating = ratingMatch ? stripHtml(ratingMatch[1]).trim() : "";
  const outOfServiceDate = extractField(html, "Out of Service Date");
  const operatingAuthorityStatus = extractField(html, "Operating Authority Status");
  const reviewDate = extractField(html, "Rating Date") || extractField(html, "Last Review Date") || extractField(html, "Review Date");

  // Power units and drivers
  const powerUnitsStr = extractField(html, "Power Units");
  const driversStr = extractField(html, "Drivers");
  const powerUnits = powerUnitsStr ? parseInt(powerUnitsStr.replace(/[^0-9]/g, ""), 10) : null;
  const drivers = driversStr ? parseInt(driversStr.replace(/[^0-9]/g, ""), 10) : null;

  // Address
  const fullAddress = extractField(html, "Physical Address") || extractField(html, "Mailing Address");
  const addressParts = parseAddress(fullAddress);

  // Cargo types and carrier operation (checkbox sections)
  const carrierOperation = extractCheckedItems(html, "Carrier Operation", "Cargo Carried");
  const cargoTypes = extractCheckedItems(html, "Cargo Carried");

  // Entity type and carrier type
  const entityType = extractField(html, "Entity Type");
  const carrierType = extractField(html, "Carrier Type");

  const rawFields = extractTableFields(html);

  return {
    legalName,
    dbaName,
    usdotNumber,
    mcNumber,
    mxNumber: extractField(html, "MX Number"),
    operatingStatus,
    carrierType,
    entityType,
    address: addressParts.street || fullAddress,
    city: addressParts.city,
    state: addressParts.state,
    zip: addressParts.zip,
    country: "US",
    phone,
    fax,
    powerUnits: !isNaN(powerUnits as number) ? powerUnits : null,
    drivers: !isNaN(drivers as number) ? drivers : null,
    cargoTypes,
    carrierOperation,
    safetyRating,
    reviewDate,
    outOfServiceDate,
    operatingAuthorityStatus,
    smsLink,
    insuranceLink,
    rawFields,
    links,
    sourceUrl,
  };
}

function parseAddress(address: string): { street: string; city: string; state: string; zip: string } {
  if (!address) return { street: "", city: "", state: "", zip: "" };
  // Format: "STREET\nCITY, ST  ZIP" (from <br> in HTML)
  const match1 = address.match(/^(.+?)\n\s*([A-Za-z .]+),\s*([A-Z]{2})\s*(\d{5}(-\d{4})?)\s*$/);
  if (match1) {
    return { street: match1[1].trim(), city: match1[2].trim(), state: match1[3], zip: match1[4] };
  }
  // Format: "STREET, CITY, ST ZIP"
  const match2 = address.match(/^(.+?),\s*([A-Za-z .]+),\s*([A-Z]{2})\s*(\d{5}(-\d{4})?)\s*$/);
  if (match2) {
    return { street: match2[1].trim(), city: match2[2].trim(), state: match2[3], zip: match2[4] };
  }
  return { street: address, city: "", state: "", zip: "" };
}

export interface SmsData {
  totalInspections: number | null;
  inspectionsWithViolations: number | null;
  inspectionsWithoutViolations: number | null;
  outOfServiceCount: number | null;
  outOfServicePercent: string;
  totalCrashes: number | null;
  fatalCrashes: number | null;
  injuryCrashes: number | null;
  towawayCrashes: number | null;
  basics: Array<{
    category: string;
    measureValue: string;
    percentile: string;
    deficiencyIndicator: string;
    violationCount: number | null;
  }>;
  carrierSegment: string;
  smsDataDate: string;
  smsDataPeriod: string;
  sourceUrl: string;
  available: boolean;
}

export function parseSmsPage(html: string, sourceUrl: string): SmsData {
  const text = stripHtml(html);
  const hasSmsData = text.toLowerCase().includes("basic") || text.toLowerCase().includes("inspection") || text.toLowerCase().includes("crash");

  if (!hasSmsData) {
    return {
      totalInspections: null, inspectionsWithViolations: null, inspectionsWithoutViolations: null,
      outOfServiceCount: null, outOfServicePercent: "",
      totalCrashes: null, fatalCrashes: null, injuryCrashes: null, towawayCrashes: null,
      basics: [], carrierSegment: "", smsDataDate: "", smsDataPeriod: "",
      sourceUrl, available: false,
    };
  }

  const numField = (label: string): number | null => {
    const val = extractField(html, label);
    if (!val) return null;
    const n = parseInt(val.replace(/[^0-9]/g, ""), 10);
    return isNaN(n) ? null : n;
  };

  const numFromText = (label: string): number | null => {
    const regex = new RegExp(label + "\\s*:?\\s*(\\d+)", "i");
    const match = text.match(regex);
    if (match) return parseInt(match[1], 10);
    return null;
  };

  return {
    totalInspections: numField("Total Inspections") || numFromText("Total Inspections") || numFromText("Inspections"),
    inspectionsWithViolations: numField("Inspections with Violations") || numFromText("With Violations"),
    inspectionsWithoutViolations: numField("Inspections without Violations") || numFromText("Without Violations"),
    outOfServiceCount: numField("Out of Service") || numFromText("Out of Service") || numFromText("OOS"),
    outOfServicePercent: extractField(html, "Out of Service Percent") || "",
    totalCrashes: numField("Total Crashes") || numFromText("Total Crashes") || numFromText("Crashes"),
    fatalCrashes: numField("Fatal Crashes") || numFromText("Fatal Crashes") || numFromText("Fatal"),
    injuryCrashes: numField("Injury Crashes") || numFromText("Injury Crashes") || numFromText("Injury"),
    towawayCrashes: numField("Towaway Crashes") || numFromText("Towaway") || numFromText("Tow"),
    basics: [],
    carrierSegment: extractField(html, "Carrier Segment") || "",
    smsDataDate: extractField(html, "SMS Data Date") || extractField(html, "Data Date") || "",
    smsDataPeriod: extractField(html, "SMS Data Period") || extractField(html, "Data Period") || "",
    sourceUrl,
    available: true,
  };
}