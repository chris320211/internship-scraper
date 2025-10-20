/**
 * Test script to verify new job board integrations
 * Run with: node test-new-sources.js
 */

import { fetchAllLeverInternships } from './leverService.js';
import { fetchAllAshbyInternships } from './ashbyService.js';
import { fetchAllWorkdayInternships } from './workdayService.js';
import { fetchAllSmartRecruitersInternships } from './smartRecruitersService.js';
import {
  LEVER_COMPANIES,
  ASHBY_COMPANIES,
  WORKDAY_COMPANIES,
  SMARTRECRUITERS_COMPANIES,
} from './companies.js';

console.log('🧪 Testing new job board integrations...\n');

async function testAll() {
  const startTime = Date.now();

  try {
    console.log('1️⃣  Testing Lever integration...');
    const leverInternships = await fetchAllLeverInternships(LEVER_COMPANIES);
    console.log(`   ✅ Lever: ${leverInternships.length} internships found\n`);

    console.log('2️⃣  Testing Ashby integration...');
    const ashbyInternships = await fetchAllAshbyInternships(ASHBY_COMPANIES);
    console.log(`   ✅ Ashby: ${ashbyInternships.length} internships found\n`);

    console.log('3️⃣  Testing Workday integration...');
    const workdayInternships = await fetchAllWorkdayInternships(WORKDAY_COMPANIES);
    console.log(`   ✅ Workday: ${workdayInternships.length} internships found\n`);

    console.log('4️⃣  Testing SmartRecruiters integration...');
    const smartRecruitersInternships = await fetchAllSmartRecruitersInternships(SMARTRECRUITERS_COMPANIES);
    console.log(`   ✅ SmartRecruiters: ${smartRecruitersInternships.length} internships found\n`);

    const total = leverInternships.length + ashbyInternships.length + workdayInternships.length + smartRecruitersInternships.length;
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('═══════════════════════════════════════');
    console.log(`🎉 Total new internships: ${total}`);
    console.log(`⏱️  Time taken: ${duration}s`);
    console.log('═══════════════════════════════════════\n');

    // Show sample internships
    if (leverInternships.length > 0) {
      console.log('📋 Sample Lever internship:');
      console.log(JSON.stringify(leverInternships[0], null, 2));
      console.log();
    }

    if (ashbyInternships.length > 0) {
      console.log('📋 Sample Ashby internship:');
      console.log(JSON.stringify(ashbyInternships[0], null, 2));
      console.log();
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAll();
