import React, { useState } from "react";
import { scoreBroker } from "@/lib/brokerScoring";

const sectionCls = "border border-slate-200 rounded-lg p-4";
const sectionTitleCls = "text-sm font-semibold text-slate-800 mb-3";
const fieldCls = "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

function Field({ label, children }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export default function BrokerForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || {});
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const preview = scoreBroker(form);

  const submit = (e) => {
    e.preventDefault();
    onSave({ ...form, vetting_score: preview.score, vetting_rating: preview.rating });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Identity */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>1. Broker Identity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Legal Company Name *"><input required className={fieldCls} value={form.broker_name || ""} onChange={(e) => set("broker_name", e.target.value)} /></Field>
          <Field label="DBA Name"><input className={fieldCls} value={form.dba_name || ""} onChange={(e) => set("dba_name", e.target.value)} /></Field>
          <Field label="MC Number"><input className={fieldCls} value={form.mc_number || ""} onChange={(e) => set("mc_number", e.target.value)} /></Field>
          <Field label="USDOT Number"><input className={fieldCls} value={form.usdot_number || ""} onChange={(e) => set("usdot_number", e.target.value)} /></Field>
          <Field label="Phone"><input className={fieldCls} value={form.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email"><input className={fieldCls} value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Website"><input className={fieldCls} value={form.website || ""} onChange={(e) => set("website", e.target.value)} /></Field>
          <Field label="Contact Person"><input className={fieldCls} value={form.contact_person || ""} onChange={(e) => set("contact_person", e.target.value)} /></Field>
          <Field label="Contact Title"><input className={fieldCls} value={form.contact_title || ""} onChange={(e) => set("contact_title", e.target.value)} /></Field>
          <Field label="Address"><input className={fieldCls} value={form.address || ""} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="City"><input className={fieldCls} value={form.city || ""} onChange={(e) => set("city", e.target.value)} /></Field>
          <Field label="State"><input className={fieldCls} value={form.state || ""} onChange={(e) => set("state", e.target.value)} /></Field>
          <Field label="ZIP"><input className={fieldCls} value={form.zip || ""} onChange={(e) => set("zip", e.target.value)} /></Field>
        </div>
      </div>

      {/* Authority */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>2. Active Broker Authority</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Authority Status">
            <select className={fieldCls} value={form.authority_status || "Not Verified"} onChange={(e) => set("authority_status", e.target.value)}>
              <option>Active</option><option>Inactive</option><option>Suspended</option><option>Revoked</option><option>Not Verified</option>
            </select>
          </Field>
          <Field label="Authority Type"><input className={fieldCls} placeholder="Broker" value={form.authority_type || ""} onChange={(e) => set("authority_type", e.target.value)} /></Field>
          <Field label="Authority Verified (FMCSA L&I)">
            <select className={fieldCls} value={form.authority_verified ? "true" : "false"} onChange={(e) => set("authority_verified", e.target.value === "true")}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          </Field>
          <Field label="Name Matches Authority">
            <select className={fieldCls} value={form.name_matches_authority ? "true" : "false"} onChange={(e) => set("name_matches_authority", e.target.value === "true")}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Bond */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>3. $75,000 Bond / Trust</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="Bond Type">
            <select className={fieldCls} value={form.bond_type || ""} onChange={(e) => set("bond_type", e.target.value)}>
              <option value="">—</option><option>BMC-84</option><option>BMC-85</option><option>None</option><option>Not Verified</option>
            </select>
          </Field>
          <Field label="Bond Amount ($)"><input type="number" className={fieldCls} value={form.bond_amount ?? ""} onChange={(e) => set("bond_amount", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Bond Verified">
            <select className={fieldCls} value={form.bond_verified ? "true" : "false"} onChange={(e) => set("bond_verified", e.target.value === "true")}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          </Field>
          <Field label="Filing Active">
            <select className={fieldCls} value={form.bond_active ? "true" : "false"} onChange={(e) => set("bond_active", e.target.value === "true")}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          </Field>
        </div>
      </div>

      {/* Payment reputation */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>4. Payment Reputation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Avg Days to Pay"><input type="number" className={fieldCls} value={form.payment_days_avg ?? ""} onChange={(e) => set("payment_days_avg", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Years Active"><input type="number" className={fieldCls} value={form.years_active ?? ""} onChange={(e) => set("years_active", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Non-Payment Reports"><input type="number" className={fieldCls} value={form.non_payment_reports ?? 0} onChange={(e) => set("non_payment_reports", parseInt(e.target.value) || 0)} /></Field>
          <Field label="Slow-Payment Complaints"><input type="number" className={fieldCls} value={form.slow_payment_complaints ?? 0} onChange={(e) => set("slow_payment_complaints", parseInt(e.target.value) || 0)} /></Field>
          <Field label="Double-Brokering Complaints"><input type="number" className={fieldCls} value={form.double_brokering_complaints ?? 0} onChange={(e) => set("double_brokering_complaints", parseInt(e.target.value) || 0)} /></Field>
          <Field label="Fraud Complaints"><input type="number" className={fieldCls} value={form.fraud_complaints ?? 0} onChange={(e) => set("fraud_complaints", parseInt(e.target.value) || 0)} /></Field>
          <Field label="Cargo/Payment Disputes"><input type="number" className={fieldCls} value={form.cargo_disputes ?? 0} onChange={(e) => set("cargo_disputes", parseInt(e.target.value) || 0)} /></Field>
          <Field label="Currently Working w/ Carriers">
            <select className={fieldCls} value={form.currently_working_with_carriers ? "true" : "false"} onChange={(e) => set("currently_working_with_carriers", e.target.value === "true")}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          </Field>
          <div className="md:col-span-3">
            <Field label="Carrier Reviews / Reputation Sources"><textarea rows={2} className={fieldCls} value={form.carrier_reviews || ""} onChange={(e) => set("carrier_reviews", e.target.value)} /></Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Payment Reputation Notes"><textarea rows={2} className={fieldCls} value={form.payment_reputation_notes || ""} onChange={(e) => set("payment_reputation_notes", e.target.value)} /></Field>
          </div>
        </div>
      </div>

      {/* Load */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>5. Load Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Pickup Location"><input className={fieldCls} value={form.load_pickup || ""} onChange={(e) => set("load_pickup", e.target.value)} /></Field>
          <Field label="Delivery Location"><input className={fieldCls} value={form.load_delivery || ""} onChange={(e) => set("load_delivery", e.target.value)} /></Field>
          <Field label="Commodity"><input className={fieldCls} value={form.load_commodity || ""} onChange={(e) => set("load_commodity", e.target.value)} /></Field>
          <Field label="Weight"><input className={fieldCls} value={form.load_weight || ""} onChange={(e) => set("load_weight", e.target.value)} /></Field>
          <Field label="Rate ($)"><input type="number" className={fieldCls} value={form.load_rate ?? ""} onChange={(e) => set("load_rate", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Mileage"><input type="number" className={fieldCls} value={form.load_mileage ?? ""} onChange={(e) => set("load_mileage", parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Rate Confirmation Received">
            <select className={fieldCls} value={form.rate_confirmation_received ? "true" : "false"} onChange={(e) => set("rate_confirmation_received", e.target.value === "true")}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          </Field>
          <Field label="Rate Above Market (Warning)">
            <select className={fieldCls} value={form.load_rate_warning ? "true" : "false"} onChange={(e) => set("load_rate_warning", e.target.value === "true")}>
              <option value="false">No</option><option value="true">Yes</option>
            </select>
          </Field>
          <Field label="Who Pays Carrier"><input className={fieldCls} value={form.who_pays_carrier || ""} onChange={(e) => set("who_pays_carrier", e.target.value)} /></Field>
          <Field label="Detention Policy"><input className={fieldCls} value={form.detention_policy || ""} onChange={(e) => set("detention_policy", e.target.value)} /></Field>
          <Field label="TONU Policy"><input className={fieldCls} value={form.tonu_policy || ""} onChange={(e) => set("tonu_policy", e.target.value)} /></Field>
          <Field label="Layover Policy"><input className={fieldCls} value={form.layover_policy || ""} onChange={(e) => set("layover_policy", e.target.value)} /></Field>
          <Field label="Lumper"><input className={fieldCls} value={form.lumper || ""} onChange={(e) => set("lumper", e.target.value)} /></Field>
        </div>
      </div>

      {/* Notes */}
      <div className={sectionCls}>
        <h3 className={sectionTitleCls}>6. Notes</h3>
        <Field label="Vetting Notes"><textarea rows={2} className={fieldCls} value={form.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>
      </div>

      {/* Live score preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-blue-900">Live Vetting Score</span>
          <span className="text-2xl font-bold text-blue-900">{preview.score}<span className="text-sm font-normal">/100</span></span>
        </div>
        <div className="flex flex-wrap gap-2">
          {preview.breakdown.map((c) => (
            <span key={c.category} className="text-xs text-blue-700 bg-white px-2 py-1 rounded border border-blue-100">
              {c.category}: {c.points}/{c.max}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">{saving ? "Saving..." : "Save Broker"}</button>
      </div>
    </form>
  );
}