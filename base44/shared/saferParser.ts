// SAFER/SMS HTML parsing utilities for FMCSA public web pages.
// Uses regex-based extraction since the FMCSA pages are server-rendered HTML tables.

export function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/td>/gi, " | ")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
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

// Extract label-value pairs from SAFER HTML table rows.
// The SAFER page uses <td>Label:</td><td>Value</td> patterns.
export function extractTableFields(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  // Get all table cells content in order
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const cells: string[] = [];
  let match;
  while ((match = cellRegex.exec(html)) !== null) {
    cells.push(stripHtml(match[1]).trim());
  }
  // Pair up label cells (ending with ":") with the next cell as value
  for (let i = 0; i < cells.length - 1; i++) {
    const label = cells[i];
    const value = cells[i + 1];
    if (label && label.endsWith(":") && value && !value.endsWith(":")) {
      const cleanLabel = label.replace(/:$/, "").trim();
      if (cleanLabel && value !== "" && value !== "|") {
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
  const fields = extractTableFields(html);
  const links = extractLinks(html);
  const text = stripHtml(html);

  // Extract company name from the header (appears as <b>COMPANY NAME</b> near USDOT Number)
  const nameMatch = html.match(/<b>\s*([A-Z][^<]{2,100})\s*<\/b>\s*<br>\s*USDOT/i);
  const legalName = nameMatch ? nameMatch[1].trim() : (fields["Legal Name"] || "");

  // Find SMS and Insurance links
  const smsLink = links.find(l => l.text.toLowerCase().includes("sms"))?.url || "";
  const insuranceLink = links.find(l => l.text.toLowerCase().includes("licensing") || l.text.toLowerCase().includes("insurance"))?.url || "";

  // Parse power units and drivers as numbers
  const powerUnitsStr = fields["Power Units"] || "";
  const driversStr = fields["Drivers"] || "";
  const powerUnits = powerUnitsStr ? parseInt(powerUnitsStr, 10) : null;
  const drivers = driversStr ? parseInt(driversStr, 10) : null;

  // Extract address components from the full address field
  const fullAddress = fields["Physical Address"] || fields["Address"] || "";
  const addressParts = parseAddress(fullAddress);

  return {
    legalName,
    dbaName: fields["DBA Name"] || fields["DBA"] || "",
    usdotNumber: fields["USDOT Number"] || "",
    mcNumber: fields["MC/MX Number"] || "",
    mxNumber: fields["MX Number"] || "",
    operatingStatus: fields["USDOT Status"] || fields["Operating Status"] || "",
    carrierType: fields["Carrier Type"] || "",
    entityType: fields["Entity Type"] || "",
    address: addressParts.street || fullAddress,
    city: addressParts.city || fields["City"] || "",
    state: addressParts.state || fields["State"] || "",
    zip: addressParts.zip || fields["ZIP"] || "",
    country: "US",
    phone: fields["Phone"] || "",
    fax: fields["Fax"] || "",
    powerUnits: !isNaN(powerUnits as number) ? powerUnits : null,
    drivers: !isNaN(drivers as number) ? drivers : null,
    cargoTypes: fields["Cargo Carried"] || fields["Cargo"] || "",
    carrierOperation: fields["Carrier Operation"] || "",
    safetyRating: fields["Safety Rating"] || "",
    reviewDate: fields["Last Review Date"] || "",
    outOfServiceDate: fields["Out of Service Date"] || "",
    operatingAuthorityStatus: fields["Operating Authority Status"] || "",
    smsLink,
    insuranceLink,
    rawFields: fields,
    links,
    sourceUrl,
  };
}

function parseAddress(address: string): { street: string; city: string; state: string; zip: string } {
  // Try to parse "STREET, CITY, ST ZIP" or "STREET\nCITY, ST ZIP"
  const match = address.match(/^(.+?),\s*([A-Za-z .]+),\s*([A-Z]{2})\s*(\d{5}(-\d{4})?)\s*$/);
  if (match) {
    return { street: match[1].trim(), city: match[2].trim(), state: match[3], zip: match[4] };
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
  const fields = extractTableFields(html);

  // Check if the page has actual SMS data or is an error/redirect page
  const hasSmsData = text.toLowerCase().includes("basic") || text.toLowerCase().includes("inspection");

  if (!hasSmsData) {
    return {
      totalInspections: null,
      inspectionsWithViolations: null,
      inspectionsWithoutViolations: null,
      outOfServiceCount: null,
      outOfServicePercent: "",
      totalCrashes: null,
      fatalCrashes: null,
      injuryCrashes: null,
      towawayCrashes: null,
      basics: [],
      carrierSegment: "",
      smsDataDate: "",
      smsDataPeriod: "",
      sourceUrl,
      available: false,
    };
  }

  const numField = (label: string): number | null => {
    const val = fields[label];
    if (!val) return null;
    const n = parseInt(val.replace(/[^0-9]/g, ""), 10);
    return isNaN(n) ? null : n;
  };

  return {
    totalInspections: numField("Total Inspections") || numField("Inspections"),
    inspectionsWithViolations: numField("Inspections with Violations") || numField("With Violations"),
    inspectionsWithoutViolations: numField("Inspections without Violations") || numField("Without Violations"),
    outOfServiceCount: numField("Out of Service") || numField("OOS"),
    outOfServicePercent: fields["Out of Service Percent"] || fields["OOS %"] || "",
    totalCrashes: numField("Total Crashes") || numField("Crashes"),
    fatalCrashes: numField("Fatal Crashes") || numField("Fatal"),
    injuryCrashes: numField("Injury Crashes") || numField("Injury"),
    towawayCrashes: numField("Towaway Crashes") || numField("Tow"),
    basics: [],
    carrierSegment: fields["Carrier Segment"] || "",
    smsDataDate: fields["SMS Data Date"] || fields["Data Date"] || "",
    smsDataPeriod: fields["SMS Data Period"] || fields["Data Period"] || "",
    sourceUrl,
    available: true,
  };
}