import { secrets } from "base44:runtime";

const FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services";

export function getApiKey(): string {
  const key = secrets.get("FMCSA_API_KEY");
  if (!key) {
    throw new Error(
      "FMCSA_API_KEY secret is not set. Request a free API webkey at https://mobile.fmcsa.dot.gov/QCDevsite/ (Login.gov account required), then add it in Settings → Environment Variables as FMCSA_API_KEY."
    );
  }
  return key;
}

export function hasApiKey(): boolean {
  try {
    return !!secrets.get("FMCSA_API_KEY");
  } catch {
    return false;
  }
}

export async function fmcsaGet(path: string): Promise<any> {
  const key = getApiKey();
  const separator = path.includes("?") ? "&" : "?";
  const url = `${FMCSA_BASE}${path}${separator}webKey=${encodeURIComponent(key)}`;
  const resp = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`FMCSA API ${resp.status} for ${path}: ${body.slice(0, 200)}`);
  }
  return await resp.json();
}

export async function getCarrierByDot(dotNumber: string): Promise<any> {
  return fmcsaGet(`/carriers/${dotNumber}`);
}

export async function getCarrierByName(name: string): Promise<any> {
  return fmcsaGet(`/carriers/name/${encodeURIComponent(name)}?start=0&size=10`);
}

export async function getCarrierByDocket(docketNumber: string): Promise<any> {
  return fmcsaGet(`/carriers/docket-number/${docketNumber}/`);
}

export async function getBasics(dotNumber: string): Promise<any> {
  return fmcsaGet(`/carriers/${dotNumber}/basics`);
}

export async function getCargoCarried(dotNumber: string): Promise<any> {
  return fmcsaGet(`/carriers/${dotNumber}/cargo-carried`);
}

export async function getOperationClassification(dotNumber: string): Promise<any> {
  return fmcsaGet(`/carriers/${dotNumber}/operation-classification`);
}

export async function getOos(dotNumber: string): Promise<any> {
  return fmcsaGet(`/carriers/${dotNumber}/oos`);
}

export async function getDocketNumbers(dotNumber: string): Promise<any> {
  return fmcsaGet(`/carriers/${dotNumber}/docket-numbers`);
}

export async function getAuthority(dotNumber: string): Promise<any> {
  return fmcsaGet(`/carriers/${dotNumber}/authority`);
}

// Extract the carrier object from various possible response wrappers
export function extractCarrier(resp: any): any {
  if (!resp) return null;
  if (resp.content) {
    if (Array.isArray(resp.content)) return resp.content[0];
    if (resp.content.carrier) return resp.content.carrier;
    if (resp.content.carriers) return resp.content.carriers;
    return resp.content;
  }
  if (resp.carrier) return resp.carrier;
  if (resp.carriers) return resp.carriers;
  return resp;
}

export function extractList(resp: any): any[] {
  if (!resp) return [];
  if (Array.isArray(resp.content)) return resp.content;
  if (resp.content?.carriers && Array.isArray(resp.content.carriers)) return resp.content.carriers;
  if (resp.content?.basics && Array.isArray(resp.content.basics)) return resp.content.basics;
  if (Array.isArray(resp)) return resp;
  return [];
}

export const SAFER_URL = (dot: string) => `https://safer.fmcsa.dot.gov/query.asp?qstring=dotnumber|${dot}`;
export const SMS_URL = (dot: string) => `https://ai.fmcsa.dot.gov/SMS/Carrier/${dot}`;