/**
 * Test GitHub repository integration
 * Run with: node test-github.js
 */

import { fetchAllGitHubInternships, getGitHubSources } from './githubService.js';

console.log('🧪 Testing GitHub repository integration...\n');

async function test() {
  const startTime = Date.now();

  try {
    console.log('📚 GitHub Sources:');
    const sources = getGitHubSources();
    sources.forEach(source => {
      console.log(`   - ${source.name}: ${source.url}`);
    });
    console.log();

    const internships = await fetchAllGitHubInternships();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n═══════════════════════════════════════');
    console.log(`🎉 Total GitHub internships: ${internships.length}`);
    console.log(`⏱️  Time taken: ${duration}s`);
    console.log('═══════════════════════════════════════\n');

    if (internships.length > 0) {
      console.log('📋 Sample internship (first):');
      console.log(JSON.stringify(internships[0], null, 2));
      console.log();

      console.log('📋 Sample internship (last):');
      console.log(JSON.stringify(internships[internships.length - 1], null, 2));
      console.log();

      // Stats by source
      const bySource = {};
      internships.forEach(job => {
        bySource[job.source] = (bySource[job.source] || 0) + 1;
      });

      console.log('📊 Breakdown by source:');
      Object.entries(bySource).forEach(([source, count]) => {
        console.log(`   ${source}: ${count} internships`);
      });
      console.log();

      // Stats by company
      const byCompany = {};
      internships.forEach(job => {
        byCompany[job.company_name] = (byCompany[job.company_name] || 0) + 1;
      });

      const topCompanies = Object.entries(byCompany)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      console.log('🏢 Top 10 companies:');
      topCompanies.forEach(([company, count]) => {
        console.log(`   ${company}: ${count} internships`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

test();
