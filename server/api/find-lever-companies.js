/**
 * Script to find working Lever company tokens
 */

const testCompanies = [
  'netflix', 'uber', 'coursera', 'cruise', 'flexport',
  'eventbrite', 'postmates', 'tripadvisor', 'zapier', 'miro',
  'grammarly', 'carta', 'calm', 'convoy', 'blend',
  'pagerduty', 'optimizely', 'redox', 'cockroachlabs', 'databricks',
  'plaid', 'segment', 'lattice', 'figma', 'ramp'
];

async function testLeverCompany(token) {
  try {
    const response = await fetch(`https://api.lever.co/v0/postings/${token}?mode=json`);
    if (response.ok) {
      const jobs = await response.json();
      return { token, count: jobs.length, works: true };
    }
    return { token, count: 0, works: false, status: response.status };
  } catch (error) {
    return { token, count: 0, works: false, error: error.message };
  }
}

console.log('🔍 Testing Lever company tokens...\n');

async function main() {
  const results = await Promise.all(testCompanies.map(testLeverCompany));

  const working = results.filter(r => r.works && r.count > 0);
  const notWorking = results.filter(r => !r.works || r.count === 0);

  console.log('✅ Working companies with jobs:');
  working.forEach(r => console.log(`   ${r.token}: ${r.count} jobs`));

  console.log('\n❌ Not working or no jobs:');
  notWorking.forEach(r => {
    if (r.status) {
      console.log(`   ${r.token}: HTTP ${r.status}`);
    } else {
      console.log(`   ${r.token}: ${r.error || 'No jobs'}`);
    }
  });

  console.log(`\n📊 Summary: ${working.length}/${testCompanies.length} working`);
}

main();
