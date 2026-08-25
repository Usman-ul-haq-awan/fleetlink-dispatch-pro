// Lead Scoring Engine
// Calculates a sales lead score (0-100) based on carrier characteristics.
// This is separate from the Safety Qualification.

export interface LeadScoreInput {
  operatingStatus: string;
  equipmentMatch: boolean;
  hasEmail: boolean;
  hasFax: boolean;
  hasPhone: boolean;
  powerUnits: number | null;
  drivers: number | null;
  safetyQualification: string;
  dataCompletenessPct: number;
  hasWebsite: boolean;
  previousContactOutcome: string;
}

export interface LeadScoreResult {
  score: number;
  reasons: string[];
}

export function scoreLead(input: LeadScoreInput): LeadScoreResult {
  let score = 0;
  const reasons: string[] = [];

  // Operating status (max 20)
  const status = (input.operatingStatus || "").toLowerCase().trim();
  if (status === "active") {
    score += 20;
    reasons.push("Active operating status (+20)");
  } else if (status === "inactive") {
    score += 0;
    reasons.push("Inactive operating status (+0)");
  } else if (status === "out-of-service" || status === "out of service") {
    score += 0;
    reasons.push("Out-of-service status (+0)");
  } else if (status) {
    score += 10;
    reasons.push(`Operating status: ${input.operatingStatus} (+10)`);
  }

  // Equipment match (max 15)
  if (input.equipmentMatch) {
    score += 15;
    reasons.push("Equipment type matches dispatch needs (+15)");
  } else {
    reasons.push("Equipment type not confirmed (+0)");
  }

  // Contact availability (max 30 combined)
  if (input.hasEmail) {
    score += 15;
    reasons.push("Email available (+15)");
  } else {
    reasons.push("No email found (+0)");
  }

  if (input.hasFax) {
    score += 5;
    reasons.push("Fax available (+5)");
  }

  if (input.hasPhone) {
    score += 10;
    reasons.push("Phone available (+10)");
  } else {
    reasons.push("No phone found (+0)");
  }

  // Fleet size (max 20)
  if (input.powerUnits !== null && input.powerUnits >= 1) {
    if (input.powerUnits >= 5) {
      score += 15;
      reasons.push(`Fleet size: ${input.powerUnits} power units (+15)`);
    } else {
      score += 10;
      reasons.push(`Fleet size: ${input.powerUnits} power unit(s) (+10)`);
    }
  }

  if (input.drivers !== null && input.drivers >= 1) {
    score += 5;
    reasons.push(`Driver count: ${input.drivers} (+5)`);
  }

  // Safety qualification (max 10)
  if (input.safetyQualification === "Qualified") {
    score += 10;
    reasons.push("Safety qualification: Qualified (+10)");
  } else if (input.safetyQualification === "Review Required") {
    score += 5;
    reasons.push("Safety qualification: Review Required (+5)");
  } else if (input.safetyQualification === "High Risk") {
    score += 0;
    reasons.push("Safety qualification: High Risk (+0)");
  }

  // Data completeness (max 5)
  if (input.dataCompletenessPct >= 70) {
    score += 5;
    reasons.push("Data completeness >= 70% (+5)");
  } else if (input.dataCompletenessPct >= 40) {
    score += 3;
    reasons.push("Data completeness 40-70% (+3)");
  }

  // Previous contact outcome
  if (input.previousContactOutcome === "Interested" || input.previousContactOutcome === "Very Interested") {
    score += 5;
    reasons.push("Previously expressed interest (+5)");
  } else if (input.previousContactOutcome === "Not Interested" || input.previousContactOutcome === "Do Not Contact") {
    score = Math.min(score, 10);
    reasons.push("Previously declined interest (score capped at 10)");
  }

  // Cap at 100
  score = Math.min(score, 100);

  return { score, reasons };
}