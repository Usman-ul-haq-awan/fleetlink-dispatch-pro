// Auto-selects the best email sequence for a carrier based on its database data.
// Selection priority:
//   1. Fleet size (power_units) → owner-op vs small fleet vs mid/large fleet
//   2. Safety risk → broker vetting angle for high-risk carriers
//   3. Default → self-dispatch time reclaim (broadest appeal)

import { SEQUENCES } from "./emailTemplates.ts";

export interface FunnelAssignment {
  sequenceId: string;
  sequenceName: string;
  reason: string;
}

export function selectFunnel(carrier: any): FunnelAssignment {
  const units = carrier.power_units || 0;
  const safety = carrier.safety_qualification || "Not Assessed";
  const equipment = (carrier.equipment_types || "").toLowerCase();

  // Mid/large fleet → Strategic Partnership (seq_10)
  if (units >= 11) {
    return {
      sequenceId: "seq_10",
      sequenceName: SEQUENCES.find((s) => s.id === "seq_10")?.name || "Strategic Partnership",
      reason: `Fleet of ${units} trucks → strategic partnership funnel`,
    };
  }

  // Small fleet (2-10 trucks) → Fleet Scaling (seq_2)
  if (units >= 2 && units <= 10) {
    return {
      sequenceId: "seq_2",
      sequenceName: SEQUENCES.find((s) => s.id === "seq_2")?.name || "Fleet Scaling",
      reason: `Small fleet (${units} trucks) → fleet scaling funnel`,
    };
  }

  // High-risk safety → Broker Quality & Risk Mitigation (seq_4)
  if (safety === "High Risk") {
    return {
      sequenceId: "seq_4",
      sequenceName: SEQUENCES.find((s) => s.id === "seq_4")?.name || "Broker Quality & Risk",
      reason: "High-risk safety profile → broker vetting & risk mitigation funnel",
    };
  }

  // Owner-operator (1 truck or unknown) → Self-Dispatch Time Reclaim (seq_1)
  return {
    sequenceId: "seq_1",
    sequenceName: SEQUENCES.find((s) => s.id === "seq_1")?.name || "Self-Dispatch Time Reclaim",
    reason: units === 1
      ? "Single-truck owner-operator → self-dispatch time reclaim funnel"
      : "Unknown fleet size → self-dispatch time reclaim (default) funnel",
  };
}