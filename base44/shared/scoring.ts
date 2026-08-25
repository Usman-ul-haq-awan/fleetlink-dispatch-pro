// Lead scoring and safety qualification engine
// These are separate systems: Safety Qualification != Sales Lead Score

export interface SafetyResult {
  status: "Qualified" | "Review Required" | "High Risk" | "Insufficient Data";
  reasons: string[];
  positiveIndicators: string[];
  riskFlags: string[];
  missingData: string[];
}

export function qualifySafety(
  carrier: any,
  basics: any[],
  oosData: any,
  authorityData: any,
  crashData: any,
  inspectionData: any
): SafetyResult {
  const reasons: string[] = [];
  const positiveIndicators: string[] = [];
  const riskFlags: string[] = [];
  const missingData: string[] = [];

  // Check OOS status
  const oos = oosData?.outOfService === "Y" || carrier?.operating_status === "Not Authorized";
  if (oos) {
    riskFlags.push("Carrier has Out-of-Service order");
    reasons.push("OOS order active");
  }

  // Check safety rating
  const rating = carrier?.safety_rating || carrier?.safetyRating;
  if (rating === "Satisfactory") {
    positiveIndicators.push("Satisfactory safety rating");
    reasons.push("Satisfactory safety rating");
  } else if (rating === "Conditional") {
    riskFlags.push("Conditional safety rating");
    reasons.push("Conditional safety rating");
  } else if (rating === "Unsatisfactory") {
    riskFlags.push("Unsatisfactory safety rating");
    reasons.push("Unsatisfactory safety rating");
  } else if (!rating) {
    missingData.push("Safety rating not available");
  }

  // Check BASIC alerts
  let alertCount = 0;
  for (const basic of basics) {
    if (basic.rdDeficient === "Y" || basic.rdsvDeficient === "Y") {
      alertCount++;
      riskFlags.push(`BASIC alert: ${basic.basicShortDesc || basic.basicDesc || "Unknown category"}`);
    }
  }
  if (alertCount > 0) {
    reasons.push(`${alertCount} BASIC alert(s)`);
  } else if (basics.length > 0) {
    positiveIndicators.push("No BASIC alerts");
    reasons.push("No BASIC alerts in current data");
  }

  // Check crash data
  if (crashData) {
    if (crashData.fatal_crashes > 0) {
      riskFlags.push(`${crashData.fatal_crashes} fatal crash(es) in data period`);
      reasons.push("Fatal crashes reported");
    }
    if (crashData.total_crashes > 0) {
      reasons.push(`${crashData.total_crashes} total crash(es) in reviewed data`);
    } else {
      positiveIndicators.push("No crashes identified in reviewed data");
      reasons.push("No crashes identified in reviewed data");
    }
  } else {
    missingData.push("Crash data not retrieved");
  }

  // Check inspection data
  if (inspectionData) {
    if (inspectionData.out_of_service_percent) {
      const oosPct = parseFloat(inspectionData.out_of_service_percent);
      if (!isNaN(oosPct) && oosPct > 10) {
        riskFlags.push(`High OOS inspection rate: ${oosPct}%`);
        reasons.push(`OOS rate ${oosPct}%`);
      }
    }
  } else {
    missingData.push("Inspection data not retrieved");
  }

  // Check authority
  if (authorityData) {
    const authStatus = authorityData.authorityStatus || authorityData.status;
    if (authStatus === "Authorized") {
      positiveIndicators.push("Operating authority authorized");
    } else if (authStatus === "Not Authorized") {
      riskFlags.push("Operating authority not authorized");
    }
  }

  // Data completeness check
  if (missingData.length >= 3) {
    return {
      status: "Insufficient Data",
      reasons: ["Insufficient data to assess safety", ...missingData.map((m) => `Missing: ${m}`)],
      positiveIndicators,
      riskFlags,
      missingData,
    };
  }

  // Determine status
  if (oos || rating === "Unsatisfactory" || alertCount >= 2 || (crashData?.fatal_crashes > 0)) {
    return { status: "High Risk", reasons, positiveIndicators, riskFlags, missingData };
  }

  if (rating === "Conditional" || alertCount === 1 || missingData.length > 0) {
    return { status: "Review Required", reasons, positiveIndicators, riskFlags, missingData };
  }

  return { status: "Qualified", reasons, positiveIndicators, riskFlags, missingData };
}

export interface LeadScoreResult {
  score: number;
  reasons: string[];
}

export function calculateLeadScore(
  carrier: any,
  settings: any
): LeadScoreResult {
  let score = 0;
  const reasons: string[] = [];

  const weights = {
    operatingStatus: 15,
    equipmentMatch: 20,
    contactAvailability: 15,
    emailAvailability: 15,
    faxAvailability: 5,
    powerUnits: 15,
    driverCount: 10,
    safetyData: 10,
    crashIndicator: 10,
    dispatchSuitability: 10,
  };

  // Operating status
  if (carrier.operating_status === "Authorized" || carrier.operating_status === "Active") {
    score += weights.operatingStatus;
    reasons.push(`Authorized operating status (+${weights.operatingStatus})`);
  }

  // Contact availability
  if (carrier.phone) {
    score += 5;
    reasons.push("Phone available (+5)");
  }
  if (carrier.contact_name || carrier.owner_name) {
    score += 5;
    reasons.push("Contact/owner name available (+5)");
  }
  if (carrier.email) {
    score += weights.emailAvailability;
    reasons.push(`Email available (+${weights.emailAvailability})`);
  }
  if (carrier.fax) {
    score += weights.faxAvailability;
    reasons.push(`Fax available (+${weights.faxAvailability})`);
  }

  // Power units
  if (carrier.power_units && carrier.power_units > 0) {
    if (carrier.power_units >= 3) {
      score += weights.powerUnits;
      reasons.push(`${carrier.power_units} power units (+${weights.powerUnits})`);
    } else {
      score += 5;
      reasons.push(`${carrier.power_units} power unit(s) (+5)`);
    }
  }

  // Driver count
  if (carrier.drivers && carrier.drivers > 0) {
    score += weights.driverCount;
    reasons.push(`${carrier.drivers} drivers (+${weights.driverCount})`);
  }

  // Safety qualification
  if (carrier.safety_qualification === "Qualified") {
    score += weights.safetyData;
    reasons.push(`Safety qualified (+${weights.safetyData})`);
  } else if (carrier.safety_qualification === "Review Required") {
    score += 5;
    reasons.push("Safety review required (+5)");
  } else if (carrier.safety_qualification === "High Risk") {
    score -= 10;
    reasons.push("High risk safety (-10)");
  }

  // Equipment match (if equipment types are known)
  if (carrier.equipment_types && carrier.equipment_types !== "Unknown") {
    score += weights.equipmentMatch;
    reasons.push(`Equipment identified: ${carrier.equipment_types} (+${weights.equipmentMatch})`);
  }

  // Cap at 0-100
  score = Math.max(0, Math.min(100, score));

  return { score, reasons };
}

export function calculateDataCompleteness(carrier: any): string {
  const fields = [
    "legal_name", "usdot_number", "mc_number", "address", "phone",
    "email", "owner_name", "power_units", "drivers", "cargo_types",
    "equipment_types", "safety_qualification",
  ];
  let filled = 0;
  for (const f of fields) {
    const val = (carrier as any)[f];
    if (val !== undefined && val !== null && val !== "" && val !== "Unknown" && val !== "Not Found") {
      filled++;
    }
  }
  const pct = Math.round((filled / fields.length) * 100);
  return `${pct}% (${filled}/${fields.length} fields)`;
}