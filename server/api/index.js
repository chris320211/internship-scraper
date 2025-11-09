import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';
import { getInternships, getDatabaseStats, getScrapingStats, databaseReady, getSavedInternships, saveInternship, unsaveInternship } from './database.js';
import { setupScraperJobs, runInitialScrape, runAllScrapers } from './scraperJob.js';
import { signup, login, createUserProfile, updateUserProfile, getUserProfile } from './authService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize logo cache with 7 day TTL
const logoCache = new NodeCache({ stdTTL: 604800, checkperiod: 86400 });

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

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters',
      });
    }

    const user = await signup(email, password);

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error in signup:', error);
    if (error.message === 'User already exists') {
      return res.status(409).json({
        error: error.message,
      });
    }
    res.status(500).json({
      error: 'Failed to create user',
      message: error.message,
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
      });
    }

    const user = await login(email, password);

    res.json({
      message: 'Login successful',
      user,
    });
  } catch (error) {
    console.error('Error in login:', error);
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({
        error: error.message,
      });
    }
    res.status(500).json({
      error: 'Failed to login',
      message: error.message,
    });
  }
});

// User profile routes
app.post('/api/profile', async (req, res) => {
  try {
    const { userId, collegeYear, careerInterests } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
      });
    }

    const profile = await updateUserProfile(userId, collegeYear, careerInterests);

    res.json({
      message: 'Profile saved successfully',
      profile,
    });
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({
      error: 'Failed to save profile',
      message: error.message,
    });
  }
});

app.get('/api/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await getUserProfile(userId);

    res.json({
      profile,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error.message,
    });
  }
});

// Helper function to fetch logo with caching
async function fetchLogoWithCache(domain, fallback) {
  const cacheKey = `${domain}-${fallback || 'default'}`;

  // Check cache first
  const cached = logoCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let logoUrl;

  // Try different logo services based on fallback level
  if (fallback === 'brandfetch') {
    logoUrl = `https://cdn.brandfetch.io/${domain}?c=1idalcQyn-8DLRJFuTP`;
  } else if (fallback === 'google') {
    logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
  } else {
    // Default to Clearbit
    logoUrl = `https://logo.clearbit.com/${domain}`;
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(logoUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Logo fetch failed with status ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    const result = {
      buffer: Buffer.from(imageBuffer),
      contentType,
    };

    // Cache the successful result
    logoCache.set(cacheKey, result);

    return result;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Company logo proxy endpoint with in-memory caching
app.get('/api/logo/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const { fallback } = req.query;

    if (!domain) {
      return res.status(400).json({ error: 'Domain is required' });
    }

    try {
      const { buffer, contentType } = await fetchLogoWithCache(domain, fallback);

      // Set headers for browser caching
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
      res.setHeader('Access-Control-Allow-Origin', '*');

      return res.send(buffer);
    } catch (error) {
      // Logo fetch failed, return error with fallback hint
      return res.status(404).json({
        error: 'Logo not found',
        nextFallback: fallback === 'brandfetch' ? 'google' : (fallback ? null : 'brandfetch')
      });
    }
  } catch (error) {
    console.error('Error in logo endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch logo',
      message: error.message,
    });
  }
});

// Saved internships routes
app.get('/api/saved-internships/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required',
      });
    }

    const savedInternships = await getSavedInternships(userId);

    res.json({
      savedInternships,
    });
  } catch (error) {
    console.error('Error fetching saved internships:', error);
    res.status(500).json({
      error: 'Failed to fetch saved internships',
      message: error.message,
    });
  }
});

app.post('/api/saved-internships', async (req, res) => {
  try {
    const { userId, internshipId } = req.body;

    if (!userId || !internshipId) {
      return res.status(400).json({
        error: 'User ID and Internship ID are required',
      });
    }

    const savedInternship = await saveInternship(userId, internshipId);

    res.status(201).json({
      message: 'Internship saved successfully',
      savedInternship,
    });
  } catch (error) {
    console.error('Error saving internship:', error);
    res.status(500).json({
      error: 'Failed to save internship',
      message: error.message,
    });
  }
});

app.delete('/api/saved-internships/:userId/:internshipId', async (req, res) => {
  try {
    const { userId, internshipId } = req.params;

    if (!userId || !internshipId) {
      return res.status(400).json({
        error: 'User ID and Internship ID are required',
      });
    }

    await unsaveInternship(userId, internshipId);

    res.json({
      message: 'Internship unsaved successfully',
    });
  } catch (error) {
    console.error('Error unsaving internship:', error);
    res.status(500).json({
      error: 'Failed to unsave internship',
      message: error.message,
    });
  }
});

// Preload logos for top companies to warm up cache
async function preloadLogos() {
  console.log('🎨 Preloading company logos...');

  // Top tech companies and common internship providers
  const topCompanies = [
    'google.com', 'meta.com', 'microsoft.com', 'amazon.com', 'apple.com',
    'netflix.com', 'adobe.com', 'nvidia.com', 'intel.com', 'ibm.com',
    'oracle.com', 'salesforce.com', 'stripe.com', 'airbnb.com', 'uber.com',
    'tesla.com', 'snap.com', 'twitter.com', 'linkedin.com', 'spotify.com',
    'slack.com', 'zoom.us', 'github.com', 'gitlab.com', 'atlassian.com',
    'dropbox.com', 'cloudflare.com', 'databricks.com', 'snowflake.com',
    'mongodb.com', 'shopify.com', 'notion.so', 'figma.com', 'canva.com',
    'discord.com', 'twitch.tv', 'reddit.com', 'coinbase.com', 'robinhood.com',
    'paypal.com', 'visa.com', 'mastercard.com', 'goldmansachs.com',
    'jpmorganchase.com', 'morganstanley.com', 'citadel.com', 'janestreet.com',
    'mckinsey.com', 'bcg.com', 'bain.com', 'deloitte.com', 'accenture.com',
    'spacex.com', 'boeing.com', 'lockheedmartin.com', 'palantir.com',
    // Additional companies from current database
    'lyft.com', 'ramp.com', 'braze.com', 'toasttab.com', 'asana.com',
    'zoox.com', 'getcruise.com', 'waymo.com', 'bose.com', 'sonos.com',
    'seagate.com', 'motorola.com', 'honeywell.com', 'rtx.com'
  ];

  let cached = 0;
  const promises = topCompanies.map(async (domain) => {
    try {
      await fetchLogoWithCache(domain, null);
      cached++;
    } catch (error) {
      // Silently fail for preloading - logo will be fetched on demand
    }
  });

  await Promise.allSettled(promises);
  console.log(`✅ Preloaded ${cached}/${topCompanies.length} company logos into cache`);
}

function onServerStart() {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💼 Internships API: http://localhost:${PORT}/api/internships`);
  console.log(`🔄 Refresh API: http://localhost:${PORT}/api/internships/refresh`);
  console.log(`📈 Stats API: http://localhost:${PORT}/api/stats`);

  setupScraperJobs();

  // Preload logos in background
  preloadLogos().catch((error) => {
    console.error('Failed to preload logos:', error);
  });

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
