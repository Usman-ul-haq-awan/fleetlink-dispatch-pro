// Safety Qualification Engine
// Evaluates carrier safety data and produces a documented qualification.

export interface SafetyInput {
  safetyRating: string;
  operatingStatus: string;
  outOfServiceDate: string;
  totalCrashes: number | null;
  fatalCrashes: number | null;
  injuryCrashes: number | null;
  towawayCrashes: number | null;
  totalInspections: number | null;
  outOfServiceCount: number | null;
  outOfServicePercent: string;
  basicsAlertCount: number;
  dataCompleteness: string;
}

export interface SafetyResult {
  qualification: string;
  reasons: string[];
  positiveIndicators: string[];
  riskFlags: string[];
  missingData: string[];
}

export function qualifySafety(input: SafetyInput): SafetyResult {
  const reasons: string[] = [];
  const positiveIndicators: string[] = [];
  const riskFlags: string[] = [];
  const missingData: string[] = [];

  // Check data completeness
  const completenessPct = parseCompleteness(input.dataCompleteness);
  if (completenessPct < 40) {
    missingData.push("Insufficient safety data retrieved to perform full assessment");
  }

  // Safety Rating assessment
  const rating = (input.safetyRating || "").toLowerCase().trim();
  if (rating === "satisfactory") {
    positiveIndicators.push("Safety Rating: Satisfactory (highest FMCSA rating)");
  } else if (rating === "conditional") {
    riskFlags.push("Safety Rating: Conditional (requires review)");
    reasons.push("Conditional safety rating indicates some compliance concerns");
  } else if (rating === "unsatisfactory") {
    riskFlags.push("Safety Rating: Unsatisfactory (disqualifying)");
    reasons.push("Unsatisfactory safety rating is a disqualifying factor");
  } else if (rating === "not rated" || rating === "") {
    missingData.push("No safety rating available (carrier may not have been rated)");
  } else {
    missingData.push(`Safety rating not recognized: "${input.safetyRating}"`);
  }

  // Operating status
  const status = (input.operatingStatus || "").toLowerCase().trim();
  if (status === "inactive") {
    riskFlags.push("USDOT Status: Inactive (biennial update not completed)");
    reasons.push("Carrier USDOT number is inactive");
  } else if (status === "out-of-service" || status === "out of service") {
    riskFlags.push("USDOT Status: Out of Service (not authorized to operate)");
    reasons.push("Carrier is under out-of-service order");
  } else if (status === "active") {
    positiveIndicators.push("USDOT Status: Active");
  }

  // Out of service date
  if (input.outOfServiceDate && input.outOfServiceDate !== "Not Available" && input.outOfServiceDate !== "None") {
    riskFlags.push(`Out of Service Date: ${input.outOfServiceDate}`);
    reasons.push("Carrier has an out-of-service date on record");
  }

  // Crash data
  if (input.fatalCrashes !== null && input.fatalCrashes > 0) {
    riskFlags.push(`Fatal crashes: ${input.fatalCrashes}`);
    reasons.push(`${input.fatalCrashes} fatal crash(es) in reviewed data period`);
  } else if (input.fatalCrashes === 0) {
    positiveIndicators.push("No fatal crashes identified in reviewed data");
  } else if (input.fatalCrashes === null) {
    missingData.push("Fatal crash data not available");
  }

  if (input.injuryCrashes !== null && input.injuryCrashes > 0) {
    riskFlags.push(`Injury crashes: ${input.injuryCrashes}`);
  } else if (input.injuryCrashes === 0) {
    positiveIndicators.push("No injury crashes identified in reviewed data");
  }

  if (input.totalCrashes !== null && input.totalCrashes > 0) {
    reasons.push(`Total crashes in reviewed data: ${input.totalCrashes}`);
  } else if (input.totalCrashes === 0) {
    positiveIndicators.push("No crashes identified in reviewed data period");
  }

  // Inspection data
  if (input.totalInspections !== null && input.totalInspections > 0) {
    positiveIndicators.push(`Has inspection history: ${input.totalInspections} inspections`);
    if (input.outOfServiceCount !== null && input.outOfServiceCount > 0) {
      const oosRate = (input.outOfServiceCount / input.totalInspections) * 100;
      if (oosRate > 10) {
        riskFlags.push(`High OOS rate: ${oosRate.toFixed(1)}% (${input.outOfServiceCount}/${input.totalInspections})`);
        reasons.push(`Out-of-service rate exceeds 10% threshold`);
      } else {
        positiveIndicators.push(`OOS rate within acceptable range: ${oosRate.toFixed(1)}%`);
      }
    }
  } else if (input.totalInspections === 0) {
    missingData.push("No inspection data available (carrier may be too small or new)");
  }

  // BASIC alerts
  if (input.basicsAlertCount > 0) {
    riskFlags.push(`${input.basicsAlertCount} BASIC alert(s) in SMS`);
    reasons.push(`${input.basicsAlertCount} Behavior Analysis and Safety Improvement Categories (BASICs) in alert status`);
  } else if (input.basicsAlertCount === 0) {
    positiveIndicators.push("No BASIC alerts in SMS data");
  }

  // Determine qualification
  let qualification: string;
  if (riskFlags.length === 0 && missingData.length <= 1 && positiveIndicators.length >= 2) {
    qualification = "Qualified";
    reasons.unshift("Carrier meets safety qualification criteria based on available data");
  } else if (riskFlags.some(f => f.includes("Unsatisfactory") || f.includes("Out of Service") || f.includes("fatal"))) {
    qualification = "High Risk";
    reasons.unshift("Carrier has disqualifying safety risk factors");
  } else if (riskFlags.length > 0) {
    qualification = "Review Required";
    reasons.unshift("Carrier has safety indicators that require manual review");
  } else if (missingData.length > 2) {
    qualification = "Insufficient Data";
    reasons.unshift("Not enough safety data available to make qualification determination");
  } else {
    qualification = "Review Required";
    reasons.unshift("Carrier safety profile requires manual review");
  }

  return {
    qualification,
    reasons,
    positiveIndicators,
    riskFlags,
    missingData,
  };
}

function parseCompleteness(completeness: string): number {
  if (!completeness) return 0;
  const match = completeness.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export const SAFETY_DISCLAIMER = "FMCSA/SMS data reflects information available as of the retrieval date and should not be treated as an absolute guarantee of safety. Safety qualification is based on publicly available data and requires ongoing monitoring. 'No crashes identified in reviewed data' does not mean the carrier has never had an accident.";