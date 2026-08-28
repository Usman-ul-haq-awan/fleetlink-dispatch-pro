// Paginates through all carrier records using the SDK's skip parameter.
// The SDK returns max 5000 per request, so we batch with skip for larger DBs.
import { base44 } from "@/api/base44Client";

export async function listAllCarriers(sort = "-updated_date", max = 500000) {
  const limit = 5000;
  let skip = 0;
  let all = [];
  while (all.length < max) {
    const batch = await base44.entities.Carrier.list(sort, limit, skip);
    if (!batch || batch.length === 0) break;
    all = all.concat(batch);
    if (batch.length < limit) break;
    skip += limit;
  }
  return all;
}

// Paginates through carriers assigned to a specific user (server-side filter).
export async function listCarriersForUser(userId, sort = "-updated_date", max = 500000) {
  const limit = 5000;
  let skip = 0;
  let all = [];
  while (all.length < max) {
    const batch = await base44.entities.Carrier.filter({ assigned_to_user_id: userId }, sort, limit, skip);
    if (!batch || batch.length === 0) break;
    all = all.concat(batch);
    if (batch.length < limit) break;
    skip += limit;
  }
  return all;
}

// Counts all carriers by paginating with skip. Returns the true total.
export async function countAllCarriers() {
  const limit = 5000;
  let skip = 0;
  let count = 0;
  while (true) {
    const batch = await base44.entities.Carrier.list("-created_date", limit, skip);
    if (!batch || batch.length === 0) break;
    count += batch.length;
    if (batch.length < limit) break;
    skip += limit;
  }
  return count;
}