import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Maps a Carrier record (broker-type) into Broker entity fields.
function carrierToBrokerPayload(c) {
  const name = c.legal_name || c.dba_name || "";
  return {
    broker_name: name,
    dba_name: c.dba_name || "",
    mc_number: c.mc_number || "",
    usdot_number: c.usdot_number || "",
    phone: c.phone || "",
    email: c.email || "",
    website: c.website || "",
    address: c.address || "",
    city: c.city || "",
    state: c.state || "",
    zip: c.zip || "",
    contact_person: c.contact_name || c.owner_name || "",
    contact_title: c.contact_title || "",
    authority_type: c.entity_type || c.carrier_type || "Broker",
    authority_status: "Not Verified",
    vetting_status: "Pending",
    vetting_rating: "Not Scored",
    vetting_score: 0,
  };
}

function isBrokerCarrier(c) {
  const et = String(c.entity_type || "").toUpperCase();
  const ct = String(c.carrier_type || "").toUpperCase();
  return et.includes("BROKER") || ct.includes("BROKER");
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    // Fetch all carriers (paginated) and all existing brokers (for dedup)
    const allCarriers = [];
    let skip = 0;
    const limit = 500;
    while (true) {
      const batch = await base44.asServiceRole.entities.Carrier.list("-created_date", limit, skip);
      allCarriers.push(...batch);
      if (batch.length < limit) break;
      skip += limit;
      if (skip > 20000) break;
    }

    const allBrokers = await base44.asServiceRole.entities.Broker.list("-created_date", 500);
    const existingMc = new Set(allBrokers.map(b => (b.mc_number || "").trim()).filter(Boolean));
    const existingName = new Set(allBrokers.map(b => (b.broker_name || "").trim().toLowerCase()).filter(Boolean));

    const brokerCarriers = allCarriers.filter(isBrokerCarrier);
    let created = 0;
    let skipped = 0;
    const toCreate = [];

    for (const c of brokerCarriers) {
      const mc = (c.mc_number || "").trim();
      const name = (c.legal_name || c.dba_name || "").trim().toLowerCase();
      if ((mc && existingMc.has(mc)) || (name && existingName.has(name))) {
        skipped++;
        continue;
      }
      toCreate.push(carrierToBrokerPayload(c));
      if (mc) existingMc.add(mc);
      if (name) existingName.add(name);
    }

    if (toCreate.length > 0) {
      // bulkCreate in batches of 25
      for (let i = 0; i < toCreate.length; i += 25) {
        await base44.asServiceRole.entities.Broker.bulkCreate(toCreate.slice(i, i + 25));
      }
      created = toCreate.length;
    }

    return Response.json({
      total_carriers_scanned: allCarriers.length,
      broker_carriers_found: brokerCarriers.length,
      brokers_created: created,
      brokers_skipped_existing: skipped,
      total_brokers_now: allBrokers.length + created,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}