import express from 'express';
import cors from 'cors';
import { getInternships, getDatabaseStats, getScrapingStats, databaseReady } from './database.js';
import { setupScraperJobs, runInitialScrape, runAllScrapers } from './scraperJob.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const stats = await getDatabaseStats();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        ...stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error.message,
      },
    });
  }
});

// Get all internships from database
app.get('/api/internships', async (req, res) => {
  try {
    const filters = {
      query: req.query.q,
      jobTypes: req.query.jobTypes ? req.query.jobTypes.split(',') : undefined,
      years: req.query.years ? req.query.years.split(',') : undefined,
      remoteOnly: req.query.remoteOnly === 'true',
      source: req.query.source,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    };

    const internships = await getInternships(filters);

    res.json({
      total: internships.length,
      internships: internships,
    });
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({
      error: 'Failed to fetch internships',
      message: error.message,
    });
  }
});

// Force refresh internships (run scraping jobs manually)
app.post('/api/internships/refresh', async (req, res) => {
  try {
    console.log('Manual refresh triggered...');
    const results = await runAllScrapers();

    const stats = await getDatabaseStats();

    res.json({
      message: 'Internships refreshed successfully',
      ...stats,
      scrapingResults: results,
    });
  } catch (error) {
    console.error('Error refreshing internships:', error);
    res.status(500).json({
      error: 'Failed to refresh internships',
      message: error.message,
    });
  }
});

// Get database and scraping statistics
app.get('/api/stats', async (req, res) => {
  try {
    const [dbStats, scrapingStats] = await Promise.all([
      getDatabaseStats(),
      getScrapingStats(),
    ]);

    res.json({
      database: dbStats,
      scraping: scrapingStats,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

function onServerStart() {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💼 Internships API: http://localhost:${PORT}/api/internships`);
  console.log(`🔄 Refresh API: http://localhost:${PORT}/api/internships/refresh`);
  console.log(`📈 Stats API: http://localhost:${PORT}/api/stats`);

  setupScraperJobs();

  if (process.env.SKIP_INITIAL_SCRAPE !== 'true') {
    setTimeout(() => {
      runInitialScrape().catch((error) => {
        console.error('Failed to complete initial scrape:', error);
      });
    }, 5000);
  }
}

async function bootstrap() {
  try {
    await databaseReady;
    app.listen(PORT, onServerStart);
  } catch (error) {
    console.error('Failed to start server because the database is not ready:', error);
    process.exit(1);
  }
}

bootstrap();
