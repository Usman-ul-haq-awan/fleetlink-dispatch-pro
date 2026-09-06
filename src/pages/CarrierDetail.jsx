import React, { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  ArrowLeft, RefreshCw, ExternalLink, Mail, Phone, ShieldCheck, Truck,
  FileText, ClipboardList, Activity, AlertCircle, CheckCircle, Clock, UserCircle
} from "lucide-react";
import StaffLeadBar from "@/components/StaffLeadBar";

const TABS = [
  "Overview", "SAFER", "SMS / CSA", "Registration", "Inspections",
  "Crashes", "Insurance", "Equipment", "Contacts", "Sales",
  "Calls", "Emails", "Onboarding", "Evidence", "Activity",
];

const SAFETY_COLORS = {
  "Qualified": "bg-green-100 text-green-700 border-green-300",
  "Review Required": "bg-amber-100 text-amber-700 border-amber-300",
  "High Risk": "bg-red-100 text-red-700 border-red-300",
  "Insufficient Data": "bg-slate-100 text-slate-700 border-slate-300",
  "Not Assessed": "bg-slate-100 text-slate-500 border-slate-300",
};

export default function CarrierDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const from = searchParams.get("from");
  const backLink = from === "followup"
    ? { to: "/?tab=followup", label: "Back to Follow-up" }
    : from === "leads"
    ? { to: "/?tab=leads", label: "Back to Leads" }
    : { to: "/carriers", label: "Back to Carrier Database" };
  const [carrier, setCarrier] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [researching, setResearching] = useState(false);
  const [relatedData, setRelatedData] = useState({
    evidence: [], crashes: [], inspections: [], insurance: [],
    equipment: [], emails: [], calls: [], onboarding: null,
    activity: [], handoffs: [], registration: [], history: [], basics: [],
  });
  const [assignedAgent, setAssignedAgent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [markingApproached, setMarkingApproached] = useState(false);

  const handleMarkApproached = async () => {
    if (!window.confirm("Mark this carrier as Approached? Use this after you have manually sent an outreach email.")) return;
    setMarkingApproached(true);
    try {
      await base44.entities.EmailLog.create({
        carrier_id: id,
        to_email: carrier?.email || "manual-outreach",
        subject: "Manual outreach email",
        body: "Carrier marked as approached after a manual email was sent outside the platform.",
        status: "Sent",
        sent_at: new Date().toISOString(),
      });
      await loadAll();
    } catch (err) {
      alert("Failed to mark as approached: " + (err.response?.data?.error || err.message));
    } finally {
      setMarkingApproached(false);
    }
  };

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    loadAll();
  }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      let me = currentUser;
      if (!me) {
        me = await base44.auth.me().catch(() => null);
        if (me) setCurrentUser(me);
      }
      const c = await base44.entities.Carrier.get(id);
      setCarrier(c);

      const [evidence, crashes, inspections, insurance, equipment, emails, calls, onboarding, activity, handoffs, registration, history, basics] = await Promise.all([
        base44.entities.Evidence.filter({ carrier_id: id }, "-retrieval_date", 100),
        base44.entities.CrashRecord.filter({ carrier_id: id }, "-retrieval_date", 20),
        base44.entities.InspectionRecord.filter({ carrier_id: id }, "-retrieval_date", 20),
        base44.entities.InsuranceRecord.filter({ carrier_id: id }, "-retrieval_date", 20),
        base44.entities.Equipment.filter({ carrier_id: id }, "-date_verified", 20),
        base44.entities.EmailLog.filter({ carrier_id: id }, "-sent_at", 50),
        base44.entities.CallLog.filter({ carrier_id: id }, "-call_date", 50),
        base44.entities.Onboarding.filter({ carrier_id: id }, "-updated_at", 1),
        base44.entities.ActivityLog.filter({ carrier_id: id }, "-timestamp", 50),
        base44.entities.Handoff.filter({ carrier_id: id }, "-created_at", 10),
        base44.entities.RegistrationDetail.filter({ carrier_id: id }, "-retrieval_date", 50),
        base44.entities.CarrierHistory.filter({ carrier_id: id }, "-retrieval_date", 20),
        base44.entities.SafetyBasic.filter({ carrier_id: id }, "-retrieval_date", 20),
      ]);

      setRelatedData({ evidence, crashes, inspections, insurance, equipment, emails, calls, onboarding: onboarding[0] || null, activity, handoffs, registration, history, basics });

      // Resolve the assigned sales agent's name
      if (c.assigned_to_user_id) {
        try {
          if (me && c.assigned_to_user_id === me.id) {
            setAssignedAgent({ name: me.full_name || me.email || "You", is_self: true });
          } else {
            const users = await base44.entities.User.list("-created_date", 500);
            const u = users.find(x => x.id === c.assigned_to_user_id);
            setAssignedAgent({ name: u?.full_name || u?.email || "Unknown Agent", is_self: false });
          }
        } catch {
          setAssignedAgent({ name: null, is_self: false });
        }
      } else {
        setAssignedAgent(null);
      }
    } catch (err) {
      console.error("Load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResearch = async () => {
    setResearching(true);
    try {
      await base44.functions.invoke("researchCarrier", { carrier_id: id });
      loadAll();
    } catch (err) {
      alert("Research failed: " + (err.response?.data?.error || err.message));
    } finally {
      setResearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!carrier) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-500">Carrier not found.</p>
        <Link to={backLink.to} className="text-blue-600 text-sm hover:underline mt-2 inline-block">← {backLink.label}</Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back link */}
      <Link to={backLink.to} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> {backLink.label}
      </Link>

      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            {assignedAgent && (
              <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200">
                <UserCircle className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-medium text-violet-700">
                  Sales Agent: <strong>{assignedAgent.name}</strong>
                  {assignedAgent.is_self && <span className="text-violet-500"> (you)</span>}
                </span>
                {carrier.assigned_date && (
                  <span className="text-xs text-violet-400">
                    • Allocated {new Date(carrier.assigned_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
            )}
            <h1 className="text-xl font-bold text-slate-900">{carrier.legal_name || "Unknown Carrier"}</h1>
            {carrier.dba_name && <p className="text-sm text-slate-500">DBA: {carrier.dba_name}</p>}
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <span>USDOT: <strong>{carrier.usdot_number || "—"}</strong></span>
              <span>MC: <strong>{carrier.mc_number || "—"}</strong></span>
              <span>Status: <strong>{carrier.operating_status || "—"}</strong></span>
              <span>State: <strong>{carrier.state || "—"}</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResearch}
              disabled={researching}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${researching ? "animate-spin" : ""}`} />
              {researching ? "Researching..." : "Re-Research"}
            </button>
          </div>
        </div>

        {/* Key badges */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${SAFETY_COLORS[carrier.safety_qualification] || SAFETY_COLORS["Not Assessed"]}`}>
            Safety: {carrier.safety_qualification || "Not Assessed"}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
            Lead Score: {carrier.lead_score || 0}
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Status: {carrier.lead_status || "Imported"}
          </span>
          {carrier.equipment_types && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-700 border border-teal-200">
              Equipment: {carrier.equipment_types}
            </span>
          )}
          {carrier.do_not_contact && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
              DO NOT CONTACT
            </span>
          )}
          {relatedData.emails.filter(e => e.status === "Sent").length > 0 ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              Email: Approached ({relatedData.emails.filter(e => e.status === "Sent").length} sent)
            </span>
          ) : (
            <button
              onClick={handleMarkApproached}
              disabled={markingApproached}
              title="Click after you have manually sent an outreach email to mark this carrier as Approached"
              className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200 flex items-center gap-1 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Mail className="w-3 h-3" />
              {markingApproached ? "Marking..." : "Email: Not Approached — Mark as Approached"}
            </button>
          )}
        </div>
      </div>

      {/* Staff Lead Status Bar */}
      <StaffLeadBar carrier={carrier} existingOnboarding={relatedData.onboarding} onUpdated={loadAll} />

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="flex flex-wrap border-b border-slate-200 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600 bg-blue-50"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5">
          <TabContent tab={activeTab} carrier={carrier} relatedData={relatedData} onUpdate={loadAll} />
        </div>
      </div>
    </div>
  );
}

function TabContent({ tab, carrier, relatedData, onUpdate }) {
  switch (tab) {
    case "Overview": return <OverviewTab carrier={carrier} relatedData={relatedData} />;
    case "SAFER": return <SaferTab carrier={carrier} />;
    case "SMS / CSA": return <SmsTab carrier={carrier} relatedData={relatedData} />;
    case "Registration": return <RegistrationTab relatedData={relatedData} />;
    case "Inspections": return <InspectionsTab relatedData={relatedData} />;
    case "Crashes": return <CrashesTab relatedData={relatedData} />;
    case "Insurance": return <InsuranceTab relatedData={relatedData} />;
    case "Equipment": return <EquipmentTab carrier={carrier} relatedData={relatedData} onUpdate={onUpdate} />;
    case "Contacts": return <ContactsTab carrier={carrier} relatedData={relatedData} onUpdate={onUpdate} />;
    case "Sales": return <SalesTab carrier={carrier} />;
    case "Calls": return <CallsTab carrier={carrier} relatedData={relatedData} />;
    case "Emails": return <EmailsTab carrier={carrier} relatedData={relatedData} />;
    case "Onboarding": return <OnboardingTab carrier={carrier} relatedData={relatedData} onUpdate={onUpdate} />;
    case "Evidence": return <EvidenceTab relatedData={relatedData} />;
    case "Activity": return <ActivityTab relatedData={relatedData} />;
    default: return null;
  }
}

function FieldRow({ label, value }) {
  return (
    <div className="flex py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500 w-40 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-900 font-medium">{value || "—"}</span>
    </div>
  );
}

function SectionCard({ title, children, action }) {
  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function OverviewTab({ carrier, relatedData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <SectionCard title="Company Information">
        <FieldRow label="Legal Name" value={carrier.legal_name} />
        <FieldRow label="DBA Name" value={carrier.dba_name} />
        <FieldRow label="USDOT" value={carrier.usdot_number} />
        <FieldRow label="MC Number" value={carrier.mc_number} />
        <FieldRow label="MX Number" value={carrier.mx_number} />
        <FieldRow label="Operating Status" value={carrier.operating_status} />
        <FieldRow label="Carrier Type" value={carrier.carrier_type} />
        <FieldRow label="Entity Type" value={carrier.entity_type} />
      </SectionCard>

      <SectionCard title="Location & Contact">
        <FieldRow label="Address" value={carrier.address} />
        <FieldRow label="City" value={carrier.city} />
        <FieldRow label="State" value={carrier.state} />
        <FieldRow label="ZIP" value={carrier.zip} />
        <FieldRow label="Phone" value={carrier.phone} />
        <FieldRow label="Fax" value={carrier.fax} />
        <FieldRow label="Email" value={carrier.email} />
        <FieldRow label="Website" value={carrier.website} />
      </SectionCard>

      <SectionCard title="Fleet Information">
        <FieldRow label="Power Units" value={carrier.power_units} />
        <FieldRow label="Drivers" value={carrier.drivers} />
        <FieldRow label="Cargo Types" value={carrier.cargo_types} />
        <FieldRow label="Carrier Segment" value={carrier.carrier_segment} />
        <FieldRow label="Equipment Types" value={carrier.equipment_types} />
        <FieldRow label="Equipment Quantity" value={carrier.equipment_quantity} />
      </SectionCard>

      <SectionCard title="Safety & Qualification">
        <FieldRow label="Safety Rating" value={carrier.safety_rating} />
        <FieldRow label="Safety Qualification" value={carrier.safety_qualification} />
        <FieldRow label="Data Completeness" value={carrier.data_completeness} />
        <FieldRow label="Lead Score" value={carrier.lead_score} />
        <FieldRow label="Lead Status" value={carrier.lead_status} />
        <FieldRow label="Last Researched" value={carrier.last_researched_at ? new Date(carrier.last_researched_at).toLocaleString() : "—"} />
      </SectionCard>

      {carrier.safety_reasons && (
        <SectionCard title="Safety Assessment">
          <div className="space-y-2">
            {carrier.safety_reasons.split(";").filter(Boolean).map((r, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{r.trim()}</span>
              </div>
            ))}
          </div>
          {carrier.safety_positive_indicators && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-green-600">Positive Indicators:</p>
              {carrier.safety_positive_indicators.split(";").filter(Boolean).map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{r.trim()}</span>
                </div>
              ))}
            </div>
          )}
          {carrier.safety_risk_flags && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-red-600">Risk Flags:</p>
              {carrier.safety_risk_flags.split(";").filter(Boolean).map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">{r.trim()}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400 mt-4 italic">
            FMCSA/SMS data reflects information available as of the retrieval date and should not be treated as an absolute guarantee of safety.
          </p>
        </SectionCard>
      )}

      {carrier.lead_score_reasons && (
        <SectionCard title="Lead Score Breakdown">
          {carrier.lead_score_reasons.split(";").filter(Boolean).map((r, i) => (
            <div key={i} className="text-sm text-slate-700 py-1">{r.trim()}</div>
          ))}
        </SectionCard>
      )}
    </div>
  );
}

function SaferTab({ carrier }) {
  return (
    <div>
      {carrier.safer_url ? (
        <>
          <div className="mb-4">
            <a href={carrier.safer_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 text-sm hover:underline">
              <ExternalLink className="w-4 h-4" /> View SAFER Company Snapshot
            </a>
          </div>
          <SectionCard title="SAFER Company Snapshot Data">
            <FieldRow label="Legal Name" value={carrier.legal_name} />
            <FieldRow label="DBA Name" value={carrier.dba_name} />
            <FieldRow label="USDOT Number" value={carrier.usdot_number} />
            <FieldRow label="MC/MX Number" value={carrier.mc_number} />
            <FieldRow label="Operating Status" value={carrier.operating_status} />
            <FieldRow label="Carrier Operation" value={carrier.carrier_segment} />
            <FieldRow label="Address" value={`${carrier.address || ""}, ${carrier.city || ""}, ${carrier.state || ""} ${carrier.zip || ""}`} />
            <FieldRow label="Phone" value={carrier.phone} />
            <FieldRow label="Power Units" value={carrier.power_units} />
            <FieldRow label="Drivers" value={carrier.drivers} />
            <FieldRow label="Cargo Carried" value={carrier.cargo_types} />
            <FieldRow label="Safety Rating" value={carrier.safety_rating} />
          </SectionCard>
        </>
      ) : (
        <p className="text-sm text-slate-400">SAFER data not yet retrieved. Click "Re-Research" to fetch SAFER data.</p>
      )}
    </div>
  );
}

function SmsTab({ carrier, relatedData }) {
  const { crashes, inspections, basics } = relatedData;
  return (
    <div className="space-y-4">
      {carrier.sms_url && (
        <a href={carrier.sms_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 text-sm hover:underline">
          <ExternalLink className="w-4 h-4" /> View SMS Results Page
        </a>
      )}
      {inspections.length > 0 && (
        <SectionCard title="Inspection Summary">
          <FieldRow label="Total Inspections" value={inspections[0].total_inspections} />
          <FieldRow label="With Violations" value={inspections[0].inspections_with_violations} />
          <FieldRow label="Without Violations" value={inspections[0].inspections_without_violations} />
          <FieldRow label="Out of Service Count" value={inspections[0].out_of_service_count} />
          <FieldRow label="OOS Percent" value={inspections[0].out_of_service_percent} />
        </SectionCard>
      )}
      {crashes.length > 0 && (
        <SectionCard title="Crash Summary">
          <FieldRow label="Total Crashes" value={crashes[0].total_crashes} />
          <FieldRow label="Fatal Crashes" value={crashes[0].fatal_crashes} />
          <FieldRow label="Injury Crashes" value={crashes[0].injury_crashes} />
          <FieldRow label="Towaway Crashes" value={crashes[0].towaway_crashes} />
          <FieldRow label="Data Period" value={crashes[0].data_period} />
          <p className="text-xs text-slate-400 mt-2 italic">
            "No crashes identified in reviewed data" does not mean the carrier has never had an accident.
          </p>
        </SectionCard>
      )}
      {basics.length > 0 && (
        <SectionCard title="BASIC Categories">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-200">
              <th className="text-left py-2">Category</th>
              <th className="text-left py-2">Measure</th>
              <th className="text-left py-2">Percentile</th>
              <th className="text-left py-2">Indicator</th>
            </tr></thead>
            <tbody>
              {basics.map(b => (
                <tr key={b.id} className="border-b border-slate-100">
                  <td className="py-2">{b.basic_category}</td>
                  <td className="py-2">{b.measure_value || "—"}</td>
                  <td className="py-2">{b.on_road_percentile || "—"}</td>
                  <td className="py-2">{b.deficiency_indicator || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionCard>
      )}
      {inspections.length === 0 && crashes.length === 0 && (
        <p className="text-sm text-slate-400">SMS/CSA data not yet retrieved or not available. The SMS page may require browser rendering.</p>
      )}
    </div>
  );
}

function RegistrationTab({ relatedData }) {
  const { registration } = relatedData;
  if (registration.length === 0) return <p className="text-sm text-slate-400">No registration details retrieved.</p>;
  return (
    <div className="space-y-2">
      {registration.map(r => (
        <div key={r.id} className="flex py-2 border-b border-slate-100">
          <span className="text-sm text-slate-500 w-48 flex-shrink-0">{r.field_label}</span>
          <span className="text-sm text-slate-900 font-medium">{r.field_value}</span>
        </div>
      ))}
    </div>
  );
}

function InspectionsTab({ relatedData }) {
  const { inspections } = relatedData;
  if (inspections.length === 0) return <p className="text-sm text-slate-400">No inspection data retrieved.</p>;
  return (
    <div className="space-y-4">
      {inspections.map(ins => (
        <SectionCard key={ins.id} title="Inspection Record">
          <FieldRow label="Total Inspections" value={ins.total_inspections} />
          <FieldRow label="With Violations" value={ins.inspections_with_violations} />
          <FieldRow label="Without Violations" value={ins.inspections_without_violations} />
          <FieldRow label="Out of Service" value={ins.out_of_service_count} />
          <FieldRow label="OOS Percent" value={ins.out_of_service_percent} />
          {ins.source_url && <a href={ins.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Source</a>}
        </SectionCard>
      ))}
    </div>
  );
}

function CrashesTab({ relatedData }) {
  const { crashes } = relatedData;
  if (crashes.length === 0) return <p className="text-sm text-slate-400">No crash data retrieved.</p>;
  return (
    <div className="space-y-4">
      {crashes.map(cr => (
        <SectionCard key={cr.id} title="Crash Record">
          <FieldRow label="Total Crashes" value={cr.total_crashes} />
          <FieldRow label="Fatal Crashes" value={cr.fatal_crashes} />
          <FieldRow label="Injury Crashes" value={cr.injury_crashes} />
          <FieldRow label="Towaway Crashes" value={cr.towaway_crashes} />
          <FieldRow label="Data Period" value={cr.data_period} />
          {cr.source_url && <a href={cr.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Source</a>}
        </SectionCard>
      ))}
      <p className="text-xs text-slate-400 italic">
        "No crashes identified in reviewed data" does not mean the carrier has never had an accident.
      </p>
    </div>
  );
}

function InsuranceTab({ relatedData }) {
  const { insurance } = relatedData;
  if (insurance.length === 0) return <p className="text-sm text-slate-400">No insurance data retrieved.</p>;
  return (
    <div className="space-y-4">
      {insurance.map(ins => (
        <SectionCard key={ins.id} title="Insurance Record">
          <FieldRow label="Insurance Type" value={ins.insurance_type} />
          <FieldRow label="Insurance Company" value={ins.insurance_company} />
          <FieldRow label="Policy Number" value={ins.policy_number} />
          <FieldRow label="Coverage Amount" value={ins.coverage_amount} />
          <FieldRow label="Effective Date" value={ins.effective_date} />
          <FieldRow label="Cancellation Date" value={ins.cancellation_date} />
          <FieldRow label="Authority Status" value={ins.authority_status} />
          {ins.source_url && <a href={ins.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">Source</a>}
        </SectionCard>
      ))}
    </div>
  );
}

function EquipmentTab({ carrier, relatedData, onUpdate }) {
  const { equipment } = relatedData;
  const [showAdd, setShowAdd] = useState(false);
  const [newEquip, setNewEquip] = useState({ equipment_type: "Dry Van", quantity: 1, evidence: "", evidence_url: "", confidence: "Medium" });

  const addEquipment = async () => {
    await base44.entities.Equipment.create({
      carrier_id: carrier.id,
      ...newEquip,
      quantity: parseInt(newEquip.quantity, 10) || 1,
      date_verified: new Date().toISOString(),
    });
    setShowAdd(false);
    setNewEquip({ equipment_type: "Dry Van", quantity: 1, evidence: "", evidence_url: "", confidence: "Medium" });
    onUpdate();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">{equipment.length} equipment record(s)</p>
        <button onClick={() => setShowAdd(!showAdd)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Add Equipment</button>
      </div>

      {showAdd && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <select value={newEquip.equipment_type} onChange={e => setNewEquip({...newEquip, equipment_type: e.target.value})}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
              {["Dry Van","Reefer","Flatbed","Step Deck","Conestoga","Power Only","Hotshot","Box Truck","Straight Truck","Tanker","Car Hauler","Dump","Specialized","Other","Unknown"].map(t => <option key={t}>{t}</option>)}
            </select>
            <input type="number" placeholder="Quantity" value={newEquip.quantity} onChange={e => setNewEquip({...newEquip, quantity: parseInt(e.target.value) || 1})}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
          </div>
          <input type="text" placeholder="Evidence (e.g., 'Company website fleet page')" value={newEquip.evidence} onChange={e => setNewEquip({...newEquip, evidence: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
          <input type="text" placeholder="Evidence URL" value={newEquip.evidence_url} onChange={e => setNewEquip({...newEquip, evidence_url: e.target.value})}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
          <select value={newEquip.confidence} onChange={e => setNewEquip({...newEquip, confidence: e.target.value})}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
            <option>High</option><option>Medium</option><option>Low</option><option>Unknown</option>
          </select>
          <button onClick={addEquipment} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Save Equipment</button>
        </div>
      )}

      {equipment.length === 0 ? (
        <p className="text-sm text-slate-400">No equipment records. Add equipment with evidence.</p>
      ) : (
        <div className="space-y-2">
          {equipment.map(eq => (
            <div key={eq.id} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{eq.equipment_type}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  eq.confidence === "High" ? "bg-green-100 text-green-700" :
                  eq.confidence === "Medium" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                }`}>{eq.confidence}</span>
              </div>
              {eq.quantity > 0 && <p className="text-sm text-slate-500 mt-1">Quantity: {eq.quantity}</p>}
              {eq.evidence && <p className="text-sm text-slate-600 mt-1">Evidence: {eq.evidence}</p>}
              {eq.evidence_url && <a href={eq.evidence_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View Source</a>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactsTab({ carrier, relatedData, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    setForm({
      owner_name: carrier.owner_name || "",
      contact_name: carrier.contact_name || "",
      contact_title: carrier.contact_title || "",
      phone: carrier.phone || "",
      fax: carrier.fax || "",
      email: carrier.email || "",
      website: carrier.website || "",
    });
  }, [carrier]);

  const save = async () => {
    await base44.entities.Carrier.update(carrier.id, form);
    setEditing(false);
    onUpdate();
  };

  const contactFields = [
    { key: "owner_name", label: "Owner Name" },
    { key: "contact_name", label: "Contact Person" },
    { key: "contact_title", label: "Contact Title" },
    { key: "phone", label: "Phone" },
    { key: "fax", label: "Fax" },
    { key: "email", label: "Email" },
    { key: "website", label: "Website" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setEditing(!editing)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">
          {editing ? "Cancel" : "Edit Contacts"}
        </button>
      </div>
      {editing ? (
        <div className="space-y-3">
          {contactFields.map(f => (
            <div key={f.key}>
              <label className="text-sm text-slate-500">{f.label}</label>
              <input type="text" value={form[f.key] || ""} onChange={e => setForm({...form, [f.key]: e.target.value})}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg mt-1" />
            </div>
          ))}
          <button onClick={save} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Save</button>
        </div>
      ) : (
        <SectionCard title="Contact Information">
          {contactFields.map(f => <FieldRow key={f.key} label={f.label} value={carrier[f.key]} />)}
        </SectionCard>
      )}
      <div className="text-xs text-slate-400">
        <p>Contact data extracted from SAFER/SMS is recorded with source "SAFER/SMS" in the Evidence tab.</p>
      </div>
    </div>
  );
}

function SalesTab({ carrier }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Lead Score">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl font-bold text-blue-600">{carrier.lead_score || 0}</div>
          <div className="text-sm text-slate-500">out of 100</div>
        </div>
        {carrier.lead_score_reasons && (
          <div className="space-y-1">
            {carrier.lead_score_reasons.split(";").filter(Boolean).map((r, i) => (
              <div key={i} className="text-sm text-slate-700 py-1">{r.trim()}</div>
            ))}
          </div>
        )}
      </SectionCard>
      <SectionCard title="Sales Status">
        <FieldRow label="Lead Status" value={carrier.lead_status} />
        <FieldRow label="Safety Qualification" value={carrier.safety_qualification} />
        <FieldRow label="Do Not Contact" value={carrier.do_not_contact ? "Yes" : "No"} />
        {carrier.dnc_reason && <FieldRow label="DNC Reason" value={carrier.dnc_reason} />}
      </SectionCard>
    </div>
  );
}

function CallsTab({ carrier, relatedData }) {
  const { calls } = relatedData;
  return (
    <div>
      {calls.length === 0 ? (
        <p className="text-sm text-slate-400">No call records. Calls will appear here after the AI calling system is activated.</p>
      ) : (
        <div className="space-y-2">
          {calls.map(call => (
            <div key={call.id} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900">{call.outcome || "Pending"}</span>
                <span className="text-xs text-slate-400">{call.call_date ? new Date(call.call_date).toLocaleString() : ""}</span>
              </div>
              {call.notes && <p className="text-sm text-slate-600 mt-1">{call.notes}</p>}
              {call.next_action && <p className="text-xs text-blue-600 mt-1">Next: {call.next_action}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmailsTab({ carrier, relatedData }) {
  const { emails } = relatedData;
  return (
    <div>
      {emails.length === 0 ? (
        <p className="text-sm text-slate-400">No email records.</p>
      ) : (
        <div className="space-y-2">
          {emails.map(email => (
            <div key={email.id} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-900 text-sm">{email.subject || "(no subject)"}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  email.status === "Sent" ? "bg-green-100 text-green-700" :
                  email.status === "Failed" || email.status === "Bounced" ? "bg-red-100 text-red-700" :
                  email.status === "Replied" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                }`}>{email.status}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">To: {email.to_email} • {email.sent_at ? new Date(email.sent_at).toLocaleString() : ""}</p>
              {email.is_follow_up && <p className="text-xs text-amber-600 mt-1">Follow-up #{email.follow_up_number}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OnboardingTab({ carrier, relatedData, onUpdate }) {
  const { onboarding } = relatedData;
  const [ob, setOb] = useState(onboarding);

  useEffect(() => { setOb(onboarding); }, [onboarding]);

  const ensureOnboarding = async () => {
    if (ob) return ob;
    const created = await base44.entities.Onboarding.create({
      carrier_id: carrier.id,
      onboarding_status: "New",
    });
    setOb(created);
    return created;
  };

  const toggleField = async (field) => {
    const current = ob || await ensureOnboarding();
    const updated = await base44.entities.Onboarding.update(current.id, { [field]: !current[field] });
    setOb(updated);
  };

  const updateStatus = async (status) => {
    const current = ob || await ensureOnboarding();
    const updated = await base44.entities.Onboarding.update(current.id, { onboarding_status: status });
    setOb(updated);
    await base44.entities.Carrier.update(carrier.id, { lead_status: status === "Active Client" ? "Active Client" : "Onboarding" });
    onUpdate();
  };

  const checklistItems = [
    { key: "dispatch_agreement", label: "Dispatch Agreement Signed" },
    { key: "carrier_documents", label: "Carrier Documents Received" },
    { key: "w9_received", label: "W-9 Received" },
    { key: "insurance_verified", label: "Insurance Verified" },
    { key: "operating_authority_verified", label: "Operating Authority Verified" },
    { key: "equipment_confirmed", label: "Equipment Confirmed" },
  ];

  const onboardingStatuses = ["New", "Contacted", "Documents Requested", "Documents Received", "Under Review", "Ready for Dispatch", "Active Client", "Lost"];

  return (
    <div className="space-y-4">
      <SectionCard title="Onboarding Status">
        <div className="flex flex-wrap gap-2">
          {onboardingStatuses.map(s => (
            <button key={s} onClick={() => updateStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                ob?.onboarding_status === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Checklist">
        <div className="space-y-2">
          {checklistItems.map(item => (
            <label key={item.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
              <input type="checkbox" checked={ob?.[item.key] || false} onChange={() => toggleField(item.key)}
                className="w-4 h-4 rounded" />
              <span className="text-sm text-slate-700">{item.label}</span>
            </label>
          ))}
        </div>
      </SectionCard>

      {ob && (
        <SectionCard title="Additional Information">
          <FieldRow label="Preferred Lanes" value={ob.preferred_lanes} />
          <FieldRow label="Home Time" value={ob.home_time} />
          <FieldRow label="Rate Preferences" value={ob.rate_preferences} />
          <FieldRow label="Factoring Info" value={ob.factoring_info} />
          <FieldRow label="Broker Requirements" value={ob.broker_requirements} />
          <FieldRow label="Dispatch Start Date" value={ob.dispatch_start_date} />
        </SectionCard>
      )}
    </div>
  );
}

function EvidenceTab({ relatedData }) {
  const { evidence } = relatedData;
  if (evidence.length === 0) return <p className="text-sm text-slate-400">No evidence records.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            <th className="text-left px-3 py-2 font-medium text-slate-600">Field</th>
            <th className="text-left px-3 py-2 font-medium text-slate-600">Value</th>
            <th className="text-left px-3 py-2 font-medium text-slate-600">Source</th>
            <th className="text-left px-3 py-2 font-medium text-slate-600">Confidence</th>
            <th className="text-left px-3 py-2 font-medium text-slate-600">Retrieved</th>
            <th className="text-left px-3 py-2 font-medium text-slate-600">URL</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {evidence.map(ev => (
            <tr key={ev.id} className="hover:bg-slate-50">
              <td className="px-3 py-2 text-slate-700">{ev.field_name}</td>
              <td className="px-3 py-2 text-slate-900 font-medium max-w-xs truncate">{ev.field_value}</td>
              <td className="px-3 py-2 text-slate-600">{ev.source_name}</td>
              <td className="px-3 py-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  ev.confidence === "High" ? "bg-green-100 text-green-700" :
                  ev.confidence === "Medium" ? "bg-amber-100 text-amber-700" :
                  ev.confidence === "Low" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"
                }`}>{ev.confidence}</span>
              </td>
              <td className="px-3 py-2 text-xs text-slate-400">{ev.retrieval_date ? new Date(ev.retrieval_date).toLocaleDateString() : ""}</td>
              <td className="px-3 py-2">
                {ev.source_url && <a href={ev.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">Link</a>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTab({ relatedData }) {
  const { activity } = relatedData;
  if (activity.length === 0) return <p className="text-sm text-slate-400">No activity records.</p>;
  return (
    <div className="space-y-2">
      {activity.map(a => (
        <div key={a.id} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
            a.status === "Error" ? "bg-red-500" : a.status === "Warning" ? "bg-amber-500" :
            a.status === "Success" ? "bg-green-500" : "bg-blue-500"
          }`} />
          <div className="flex-1">
            <p className="text-sm text-slate-900">{a.action}</p>
            {a.details && <p className="text-xs text-slate-500">{a.details}</p>}
            <p className="text-xs text-slate-400">{a.timestamp ? new Date(a.timestamp).toLocaleString() : ""}</p>
          </div>
        </div>
      ))}
    </div>
  );
}