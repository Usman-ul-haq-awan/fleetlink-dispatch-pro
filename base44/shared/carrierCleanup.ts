// Deletes a carrier and all its related child records.
// Used by the operation_status gate in researchCarrierBrowser and by the
// auditAuthorizedStatus function to remove unauthorized carriers from the DB.
// Small delays between delete calls respect Base44 API rate limits.

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function deleteCarrierAndRelated(base44: any, carrierId: string): Promise<void> {
  const entities = [
    "Evidence", "SafetyBasic", "CarrierHistory", "RegistrationDetail",
    "InsuranceRecord", "InspectionRecord", "CrashRecord", "Equipment",
    "EmailLog", "CallLog", "Handoff", "Onboarding", "ResearchError", "ActivityLog",
  ];
  for (const entity of entities) {
    try {
      await base44.entities[entity].deleteMany({ carrier_id: carrierId });
    } catch {
      // Continue even if one entity fails — partial cleanup is acceptable
    }
    await delay(80);
  }
  await base44.entities.Carrier.delete(carrierId);
}

// Checks whether an operating status string indicates authorized authority.
export function isAuthorizedStatus(operatingStatus: string): boolean {
  if (!operatingStatus) return false;
  return operatingStatus.toUpperCase().includes("AUTHORIZED FOR");
}