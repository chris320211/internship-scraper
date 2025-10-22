import express from 'express';
import cors from 'cors';
import { getInternships, getDatabaseStats, getScrapingStats, databaseReady } from './database.js';
import { setupScraperJobs, runInitialScrape, runAllScrapers } from './scraperJob.js';
import { signup, login, createUserProfile, updateUserProfile, getUserProfile } from './authService.js';

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
