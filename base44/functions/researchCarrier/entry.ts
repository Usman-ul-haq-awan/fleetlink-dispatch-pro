import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import {
  getCarrierByDot,
  getCarrierByName,
  getCarrierByDocket,
  getBasics,
  getCargoCarried,
  getOos,
  getDocketNumbers,
  getAuthority,
  getOperationClassification,
  extractCarrier,
  extractList,
  hasApiKey,
  SAFER_URL,
  SMS_URL,
} from '../../shared/fmcsa.ts';
import { qualifySafety, calculateLeadScore, calculateDataCompleteness } from '../../shared/scoring.ts';

export default async function(req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { carrier_id, usdot, mc, name } = body;

    if (!carrier_id && !usdot && !mc && !name) {
      return Response.json({ error: 'Provide carrier_id, usdot, mc, or name' }, { status: 400 });
    }

    if (!hasApiKey()) {
      return Response.json({
        error: 'FMCSA_API_KEY not configured',
        message: 'Request a free FMCSA API webkey at https://mobile.fmcsa.dot.gov/QCDevsite/ and add it in Settings → Environment Variables as FMCSA_API_KEY.',
      }, { status: 503 });
    }

    const db = base44.asServiceRole;
    const now = new Date().toISOString();

    let carrier: any = null;
    if (carrier_id) {
      const existing = await db.entities.Carrier.filter({ carrier_id });
      carrier = existing[0];
    } else if (usdot) {
      const existing = await db.entities.Carrier.filter({ usdot_number: usdot });
      carrier = existing[0];
    }

    if (!carrier && !carrier_id) {
      const newId = 'CAR-' + Date.now();
      carrier = await db.entities.Carrier.create({
        carrier_id: newId,
        legal_name: name || '',
        usdot_number: usdot || '',
        mc_number: mc || '',
        lead_status: 'Queued',
        research_status: 'Starting',
        safety_qualification: 'Not Assessed',
        lead_score: 0,
        do_not_contact: false,
      });
    }

    if (!carrier) {
      return Response.json({ error: 'Carrier not found' }, { status: 404 });
    }

    const cid = carrier.carrier_id;
    const dotNum = carrier.usdot_number || usdot;
    const mcNum = carrier.mc_number || mc;
    const nameLookup = carrier.legal_name || name;

    const results: any = { steps: [], carrier_id: cid };
    let dotToUse = dotNum;

    // Step 0: If no USDOT, try MC docket lookup
    if (!dotToUse && mcNum) {
      try {
        await db.entities.ActivityLog.create({
          carrier_id: cid, action: 'Docket/MC lookup started', workflow: 'researchCarrier',
          status: 'Info', timestamp: now,
        });
        const docketResp = await getCarrierByDocket(mcNum);
        const found = extractCarrier(docketResp);
        if (found && found.dotNumber) {
          dotToUse = found.dotNumber;
          await db.entities.Carrier.update(carrier.id, { usdot_number: dotToUse });
          results.steps.push({ step: 'docket_lookup', status: 'success', usdot: dotToUse });
        }
      } catch (e: any) {
        await db.entities.ResearchError.create({
          carrier_id: cid, step: 'docket_lookup', error_type: 'API Error',
          error_message: e.message, retry_count: 0, recommended_action: 'Verify MC number',
          status: 'New', timestamp: now,
        });
        results.steps.push({ step: 'docket_lookup', status: 'failed', error: e.message });
      }
    }

    // Step 0b: If still no USDOT, try name lookup
    if (!dotToUse && nameLookup) {
      try {
        await db.entities.ActivityLog.create({
          carrier_id: cid, action: 'Name lookup started', workflow: 'researchCarrier',
          status: 'Info', timestamp: now,
        });
        const nameResp = await getCarrierByName(nameLookup);
        const found = extractCarrier(nameResp);
        if (found && found.dotNumber) {
          dotToUse = found.dotNumber;
          await db.entities.Carrier.update(carrier.id, { usdot_number: dotToUse });
          results.steps.push({ step: 'name_lookup', status: 'success', usdot: dotToUse });
        }
      } catch (e: any) {
        await db.entities.ResearchError.create({
          carrier_id: cid, step: 'name_lookup', error_type: 'API Error',
          error_message: e.message, retry_count: 0, recommended_action: 'Verify carrier name or provide USDOT',
          status: 'New', timestamp: now,
        });
        results.steps.push({ step: 'name_lookup', status: 'failed', error: e.message });
      }
    }

    if (!dotToUse) {
      await db.entities.Carrier.update(carrier.id, {
        research_status: 'Failed - No USDOT found',
        lead_status: 'Failed',
      });
      return Response.json({ error: 'Could not determine USDOT number for this carrier', results }, { status: 400 });
    }

    // Step 1: SAFER Company Snapshot
    await db.entities.Carrier.update(carrier.id, { research_status: 'SAFER lookup', lead_status: 'Researching' });
    await db.entities.ActivityLog.create({
      carrier_id: cid, action: 'SAFER lookup started', workflow: 'researchCarrier',
      status: 'Info', timestamp: now,
    });

    let carrierData: any = null;
    try {
      const saferResp = await getCarrierByDot(dotToUse);
      carrierData = extractCarrier(saferResp);
      const saferUrl = SAFER_URL(dotToUse);

      const updates: any = {
        legal_name: (carrierData && carrierData.legalName) || carrier.legal_name || 'Unknown',
        dba_name: (carrierData && carrierData.dbaName) || '',
        usdot_number: (carrierData && carrierData.dotNumber) || dotToUse,
        mc_number: (carrierData && carrierData.mcNumber) || carrier.mc_number || '',
        operating_status: carrierData && carrierData.allowToOperate === 'Y' ? 'Authorized' : 'Not Authorized',
        address: (carrierData && carrierData.phyStreet) || '',
        city: (carrierData && carrierData.phyCity) || '',
        state: (carrierData && carrierData.phyState) || '',
        zip: (carrierData && carrierData.phyZip) || '',
        country: (carrierData && carrierData.phyCountry) || 'US',
        phone: (carrierData && carrierData.telephone) || '',
        power_units: carrierData && carrierData.powerUnits ? parseInt(carrierData.powerUnits) : carrier.power_units,
        drivers: carrierData && carrierData.driver ? parseInt(carrierData.driver) : carrier.drivers,
        safer_url: saferUrl,
        last_researched_at: now,
        research_status: 'SAFER Complete',
      };

      await db.entities.Carrier.update(carrier.id, updates);

      const evidenceFields = [
        { field: 'legal_name', value: updates.legal_name, confidence: 'High' },
        { field: 'dba_name', value: updates.dba_name, confidence: 'High' },
        { field: 'usdot_number', value: updates.usdot_number, confidence: 'High' },
        { field: 'mc_number', value: updates.mc_number, confidence: 'High' },
        { field: 'operating_status', value: updates.operating_status, confidence: 'High' },
        { field: 'address', value: updates.address, confidence: 'High' },
        { field: 'city', value: updates.city, confidence: 'High' },
        { field: 'state', value: updates.state, confidence: 'High' },
        { field: 'zip', value: updates.zip, confidence: 'High' },
        { field: 'phone', value: updates.phone, confidence: 'High' },
        { field: 'power_units', value: updates.power_units ? String(updates.power_units) : '', confidence: 'High' },
        { field: 'drivers', value: updates.drivers ? String(updates.drivers) : '', confidence: 'High' },
      ];

      for (const ef of evidenceFields) {
        if (ef.value && ef.value !== 'Unknown' && ef.value !== '') {
          await db.entities.Evidence.create({
            carrier_id: cid,
            field_name: ef.field,
            field_value: ef.value,
            source_name: 'FMCSA SAFER',
            source_url: saferUrl,
            source_page: 'Company Snapshot',
            retrieval_date: now,
            confidence: ef.confidence,
            notes: '',
          });
        }
      }

      await db.entities.ActivityLog.create({
        carrier_id: cid, action: 'SAFER lookup completed', workflow: 'researchCarrier',
        details: 'Extracted ' + evidenceFields.length + ' fields', status: 'Success', timestamp: now,
      });
      results.steps.push({ step: 'safer', status: 'success', fields: evidenceFields.length });
    } catch (e: any) {
      await db.entities.ResearchError.create({
        carrier_id: cid, step: 'safer_lookup', error_type: 'API Error',
        error_message: e.message, source_url: SAFER_URL(dotToUse),
        retry_count: 0, recommended_action: 'Check FMCSA API key and USDOT number',
        status: 'New', timestamp: now,
      });
      await db.entities.ActivityLog.create({
        carrier_id: cid, action: 'SAFER lookup failed', workflow: 'researchCarrier',
        details: e.message, status: 'Error', timestamp: now,
      });
      results.steps.push({ step: 'safer', status: 'failed', error: e.message });
    }

    // Step 2: BASICs / SMS
    let basicsData: any[] = [];
    try {
      await db.entities.ActivityLog.create({
        carrier_id: cid, action: 'SMS/BASIC retrieval started', workflow: 'researchCarrier',
        status: 'Info', timestamp: now,
      });
      const basicsResp = await getBasics(dotToUse);
      basicsData = extractList(basicsResp);
      const smsUrl = SMS_URL(dotToUse);

      for (const basic of basicsData) {
        await db.entities.SafetyBasic.create({
          carrier_id: cid,
          basic_category: basic.basicDesc || basic.basicShortDesc || 'Unknown',
          measure_value: basic.measureValue ? String(basic.measureValue) : '',
          on_road_percentile: basic.percentile ? String(basic.percentile) : '',
          violation_count: basic.totalViolation || 0,
          deficiency_indicator: basic.rdDeficient === 'Y' ? 'Alert' : 'No Deficiency',
          data_period: '24 months',
          data_date: basic.snapShotDate || '',
          source_url: smsUrl,
          retrieval_date: now,
        });
      }

      await db.entities.Carrier.update(carrier.id, { sms_url: smsUrl, research_status: 'SMS Complete' });
      await db.entities.ActivityLog.create({
        carrier_id: cid, action: 'SMS retrieved', workflow: 'researchCarrier',
        details: basicsData.length + ' BASIC records', status: 'Success', timestamp: now,
      });
      results.steps.push({ step: 'basics', status: 'success', count: basicsData.length });
    } catch (e: any) {
      await db.entities.ResearchError.create({
        carrier_id: cid, step: 'basics', error_type: 'API Error',
        error_message: e.message, retry_count: 0,
        recommended_action: 'Carrier may not have SMS data',
        status: 'New', timestamp: now,
      });
      results.steps.push({ step: 'basics', status: 'failed', error: e.message });
    }

    // Step 3: Cargo carried
    try {
      const cargoResp = await getCargoCarried(dotToUse);
      const cargoList = extractList(cargoResp);
      const cargoTypes = cargoList.map((c: any) => c.cargoDescription || c.description || c.name).filter(Boolean).join(', ');
      if (cargoTypes) {
        await db.entities.Carrier.update(carrier.id, { cargo_types: cargoTypes });
        await db.entities.Evidence.create({
          carrier_id: cid, field_name: 'cargo_types', field_value: cargoTypes,
          source_name: 'FMCSA SAFER', source_url: SAFER_URL(dotToUse),
          source_page: 'Cargo Carried', retrieval_date: now, confidence: 'High',
        });
      }
      results.steps.push({ step: 'cargo', status: 'success', cargo: cargoTypes });
    } catch (e: any) {
      results.steps.push({ step: 'cargo', status: 'failed', error: e.message });
    }

    // Step 4: OOS
    let oosData: any = null;
    try {
      oosData = extractCarrier(await getOos(dotToUse));
      if (oosData) {
        await db.entities.Evidence.create({
          carrier_id: cid, field_name: 'out_of_service',
          field_value: oosData.outOfService === 'Y' ? 'Out of Service' : 'In Service',
          source_name: 'FMCSA SAFER', source_url: SAFER_URL(dotToUse),
          source_page: 'OOS', retrieval_date: now, confidence: 'High',
        });
      }
      results.steps.push({ step: 'oos', status: 'success', oos: oosData ? oosData.outOfService : null });
    } catch (e: any) {
      results.steps.push({ step: 'oos', status: 'failed', error: e.message });
    }

    // Step 5: Authority / Insurance
    let authorityData: any = null;
    try {
      const authResp = await getAuthority(dotToUse);
      authorityData = extractCarrier(authResp);
      const authList = extractList(authResp);

      for (const auth of authList) {
        if (auth.insuranceType || auth.companyName || auth.policyNumber) {
          await db.entities.InsuranceRecord.create({
            carrier_id: cid,
            insurance_type: auth.insuranceType || auth.authorityType || '',
            insurance_company: auth.companyName || '',
            policy_number: auth.policyNumber || '',
            coverage_amount: auth.coverage ? String(auth.coverage) : '',
            effective_date: auth.effectiveDate || '',
            cancellation_date: auth.cancellationDate || '',
            filing_type: auth.filingType || '',
            authority_status: auth.status || auth.authorityStatus || '',
            source_url: SAFER_URL(dotToUse),
            retrieval_date: now,
          });
        }
      }

      await db.entities.Carrier.update(carrier.id, { research_status: 'Insurance Complete' });
      await db.entities.ActivityLog.create({
        carrier_id: cid, action: 'Insurance retrieved', workflow: 'researchCarrier',
        details: authList.length + ' records', status: 'Success', timestamp: now,
      });
      results.steps.push({ step: 'authority', status: 'success', count: authList.length });
    } catch (e: any) {
      results.steps.push({ step: 'authority', status: 'failed', error: e.message });
    }

    // Step 6: Docket numbers (MC/MX)
    try {
      const docketResp = await getDocketNumbers(dotToUse);
      const dockets = extractList(docketResp);
      const mcNumbers = dockets.filter((d: any) => d.docketType === 'MC').map((d: any) => d.docketNumber).join(', ');
      const mxNumbers = dockets.filter((d: any) => d.docketType === 'MX').map((d: any) => d.docketNumber).join(', ');
      if (mcNumbers) {
        await db.entities.Carrier.update(carrier.id, { mc_number: mcNumbers });
        await db.entities.Evidence.create({
          carrier_id: cid, field_name: 'mc_number', field_value: mcNumbers,
          source_name: 'FMCSA SAFER', source_url: SAFER_URL(dotToUse),
          source_page: 'Docket Numbers', retrieval_date: now, confidence: 'High',
        });
      }
      if (mxNumbers) {
        await db.entities.Carrier.update(carrier.id, { mx_number: mxNumbers });
      }
      results.steps.push({ step: 'dockets', status: 'success', mc: mcNumbers, mx: mxNumbers });
    } catch (e: any) {
      results.steps.push({ step: 'dockets', status: 'failed', error: e.message });
    }

    // Step 7: Operation classification
    try {
      const opResp = await getOperationClassification(dotToUse);
      const opList = extractList(opResp);
      const opTypes = opList.map((o: any) => o.opClassDesc || o.description).filter(Boolean).join(', ');
      if (opTypes) {
        await db.entities.Carrier.update(carrier.id, { carrier_type: opTypes });
        await db.entities.Evidence.create({
          carrier_id: cid, field_name: 'carrier_type', field_value: opTypes,
          source_name: 'FMCSA SAFER', source_url: SAFER_URL(dotToUse),
          source_page: 'Operation Classification', retrieval_date: now, confidence: 'High',
        });
      }
      results.steps.push({ step: 'operation', status: 'success', types: opTypes });
    } catch (e: any) {
      results.steps.push({ step: 'operation', status: 'failed', error: e.message });
    }

    // Step 8: Safety qualification
    try {
      const updatedCarrier = (await db.entities.Carrier.filter({ carrier_id: cid }))[0];
      const safetyResult = qualifySafety(updatedCarrier, basicsData, oosData, authorityData, null, null);

      await db.entities.Carrier.update(carrier.id, {
        safety_qualification: safetyResult.status,
        safety_reasons: safetyResult.reasons.join('; '),
        safety_positive_indicators: safetyResult.positiveIndicators.join('; '),
        safety_risk_flags: safetyResult.riskFlags.join('; '),
        safety_rating: (carrierData && (carrierData.rating || carrierData.safetyRating)) || '',
        research_status: 'Safety Complete',
      });

      await db.entities.ActivityLog.create({
        carrier_id: cid, action: 'Safety qualification generated', workflow: 'researchCarrier',
        details: safetyResult.status + ': ' + safetyResult.reasons.join(', '),
        status: 'Success', timestamp: now,
      });
      results.safety = safetyResult;
    } catch (e: any) {
      results.steps.push({ step: 'safety_qualification', status: 'failed', error: e.message });
    }

    // Step 9: Lead score
    try {
      const updatedCarrier = (await db.entities.Carrier.filter({ carrier_id: cid }))[0];
      const scoreResult = calculateLeadScore(updatedCarrier, {});
      await db.entities.Carrier.update(carrier.id, {
        lead_score: scoreResult.score,
        lead_score_reasons: scoreResult.reasons.join('; '),
      });
      results.lead_score = scoreResult;
    } catch (e: any) {
      results.steps.push({ step: 'lead_score', status: 'failed', error: e.message });
    }

    // Step 10: Data completeness
    try {
      const updatedCarrier = (await db.entities.Carrier.filter({ carrier_id: cid }))[0];
      const completeness = calculateDataCompleteness(updatedCarrier);
      await db.entities.Carrier.update(carrier.id, { data_completeness: completeness });
      results.data_completeness = completeness;
    } catch (e: any) {
      // non-critical
    }

    // Final status
    const failedSteps = results.steps.filter((s: any) => s.status === 'failed');
    const finalStatus = failedSteps.length === 0
      ? 'Contact Complete'
      : failedSteps.length <= 2
        ? 'Needs Review'
        : 'Failed';

    await db.entities.Carrier.update(carrier.id, {
      lead_status: finalStatus,
      research_status: 'Complete',
      last_researched_at: now,
    });

    await db.entities.ActivityLog.create({
      carrier_id: cid, action: 'Research completed', workflow: 'researchCarrier',
      details: 'Status: ' + finalStatus, status: 'Success', timestamp: now,
    });

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}