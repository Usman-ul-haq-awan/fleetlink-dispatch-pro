// Standalone test runner: node test.js 1673510
// Runs a real browser extraction and prints the structured JSON result.

const { runResearch } = require('./scraper');

async function main() {
  const arg = process.argv[2] || '1673510';
  const isMc = /^MC/i.test(arg);
  const input = isMc ? { mc: arg } : { usdot: arg };

  console.log(`Starting browser research for ${JSON.stringify(input)} ...`);
  const start = Date.now();
  const result = await runResearch(input);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\n=== Extraction complete in ${elapsed}s ===\n`);
  console.log('Identity verified:', result.identity_verified);
  console.log('Carrier:', JSON.stringify(result.carrier, null, 2));
  console.log('SAFER status:', result.safer.status);
  console.log('SMS status:', result.sms.status);
  console.log('SMS Profile:', result.sms_profile.status);
  console.log('Carrier History:', result.carrier_history.status);
  console.log('Registration:', result.registration.status);
  console.log('Insurance:', result.insurance.status);
  console.log('Inspections/Crashes:', result.inspection_crash.status);
  console.log('Safety Rating:', result.safety_rating.status, result.safety_rating.rating || '');
  console.log('Contacts:', JSON.stringify(result.contacts, null, 2));
  console.log('Links discovered:', JSON.stringify(result.links_discovered, null, 2));
  console.log('Steps:');
  for (const s of result.steps) {
    console.log(`  ${s.status === 'ok' ? '✓' : s.status === 'failed' ? '✗' : '-'} ${s.name}${s.source_url ? '  ' + s.source_url : ''}`);
  }
  if (result.errors.length > 0) {
    console.log('Errors:', JSON.stringify(result.errors, null, 2));
  }
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});