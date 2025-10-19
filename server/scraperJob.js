import cron from 'node-cron';
import { fetchAllInternships } from './greenhouseService.js';
import { bulkUpsertInternships, logScraping, markOldInternshipsInactive } from './database.js';

const SCRAPER_SERVICE_URL = process.env.SCRAPER_SERVICE_URL || 'http://localhost:3002';

/**
 * Fetch and store Greenhouse internships
 */
async function scrapeGreenhouse() {
  console.log('🔄 Starting Greenhouse scraping job...');
  const startTime = Date.now();

  try {
    const internships = await fetchAllInternships();

    // Add source to each internship
    const internshipsWithSource = internships.map(i => ({
      ...i,
      source: 'greenhouse'
    }));

    const { newCount, updatedCount } = await bulkUpsertInternships(internshipsWithSource);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    await logScraping('greenhouse', {
      totalJobs: internships.length,
      internships: internships.length,
      newCount,
      updatedCount,
      status: 'success',
    });

    console.log(`✅ Greenhouse scraping completed in ${duration}s`);
    console.log(`   - Total internships: ${internships.length}`);
    console.log(`   - New: ${newCount}, Updated: ${updatedCount}`);

    return { success: true, newCount, updatedCount };
  } catch (error) {
    console.error('❌ Greenhouse scraping failed:', error.message);

    await logScraping('greenhouse', {
      status: 'failed',
      error: error.message,
    });

    return { success: false, error: error.message };
  }
}

/**
 * Fetch and store web-scraped internships
 */
async function scrapeWeb() {
  console.log('🔄 Starting web scraping job...');
  const startTime = Date.now();

  try {
    const response = await fetch(`${SCRAPER_SERVICE_URL}/api/scrape`);

    if (!response.ok) {
      throw new Error(`Scraper service returned ${response.status}`);
    }

    const data = await response.json();
    const internships = data.internships || [];

    if (internships.length === 0) {
      console.log('⚠️  No internships found from web scraping');
      return { success: true, newCount: 0, updatedCount: 0 };
    }

    const { newCount, updatedCount } = await bulkUpsertInternships(internships);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    await logScraping('web_scraping', {
      totalJobs: internships.length,
      internships: internships.length,
      newCount,
      updatedCount,
      status: 'success',
    });

    console.log(`✅ Web scraping completed in ${duration}s`);
    console.log(`   - Total internships: ${internships.length}`);
    console.log(`   - New: ${newCount}, Updated: ${updatedCount}`);
    console.log(`   - Sources: ${data.sources?.join(', ') || 'unknown'}`);

    return { success: true, newCount, updatedCount };
  } catch (error) {
    console.error('❌ Web scraping failed:', error.message);

    await logScraping('web_scraping', {
      status: 'failed',
      error: error.message,
    });

    return { success: false, error: error.message };
  }
}

/**
 * Run all scraping jobs
 */
export async function runAllScrapers() {
  console.log('🚀 Running all scraping jobs...');
  const startTime = Date.now();

  const results = await Promise.allSettled([
    scrapeGreenhouse(),
    scrapeWeb(),
  ]);

  // Mark old internships as inactive
  const inactiveCount = await markOldInternshipsInactive(90);
  if (inactiveCount > 0) {
    console.log(`🗑️  Marked ${inactiveCount} old internships as inactive`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ All scraping jobs completed in ${duration}s\n`);

  return results.map((result, index) => ({
    source: index === 0 ? 'greenhouse' : 'web_scraping',
    ...result.value,
  }));
}

/**
 * Set up cron jobs for automated scraping
 */
export function setupScraperJobs() {
  // Run every 6 hours: 0 */6 * * *
  // Run every hour for testing: 0 * * * *
  const schedule = process.env.SCRAPER_SCHEDULE || '0 */6 * * *';

  console.log(`📅 Scheduling scraper jobs: ${schedule}`);

  cron.schedule(schedule, async () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`⏰ Scheduled scraping job triggered at ${new Date().toISOString()}`);
    console.log('='.repeat(60));

    await runAllScrapers();
  });

  console.log('✅ Scraper jobs scheduled successfully');
}

/**
 * Run scraper jobs immediately on startup
 */
export async function runInitialScrape() {
  console.log('\n🌟 Running initial scrape on startup...\n');
  await runAllScrapers();
}
