import express from 'express';
import cors from 'cors';
import NodeCache from 'node-cache';
import { fetchAllInternships, searchInternships } from './greenhouseService.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Cache internships for 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600 });
const CACHE_KEY = 'all_internships';

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all internships (with caching)
app.get('/api/internships', async (req, res) => {
  try {
    // Try to get from cache first
    let internships = cache.get(CACHE_KEY);

    if (!internships) {
      console.log('Cache miss - fetching fresh internships from Greenhouse...');
      internships = await fetchAllInternships();
      cache.set(CACHE_KEY, internships);
    } else {
      console.log('Cache hit - returning cached internships');
    }

    // Apply filters from query params
    const filters = {
      query: req.query.q,
      jobTypes: req.query.jobTypes ? req.query.jobTypes.split(',') : undefined,
      years: req.query.years ? req.query.years.split(',') : undefined,
      remoteOnly: req.query.remoteOnly === 'true',
    };

    const filtered = searchInternships(internships, filters);

    res.json({
      total: filtered.length,
      internships: filtered,
    });
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({
      error: 'Failed to fetch internships',
      message: error.message,
    });
  }
});

// Force refresh internships (clears cache)
app.post('/api/internships/refresh', async (req, res) => {
  try {
    console.log('Forcing refresh of internships...');
    cache.del(CACHE_KEY);
    const internships = await fetchAllInternships();
    cache.set(CACHE_KEY, internships);

    res.json({
      message: 'Internships refreshed successfully',
      total: internships.length,
    });
  } catch (error) {
    console.error('Error refreshing internships:', error);
    res.status(500).json({
      error: 'Failed to refresh internships',
      message: error.message,
    });
  }
});

// Get cache stats
app.get('/api/stats', (req, res) => {
  const stats = cache.getStats();
  const internships = cache.get(CACHE_KEY) || [];

  res.json({
    cache: stats,
    totalInternships: internships.length,
    cacheAge: cache.getTtl(CACHE_KEY) ? Math.floor((cache.getTtl(CACHE_KEY) - Date.now()) / 1000) : 0,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💼 Internships API: http://localhost:${PORT}/api/internships`);
  console.log(`🔄 Refresh API: http://localhost:${PORT}/api/internships/refresh`);

  // Warm up the cache on startup
  console.log('Warming up cache...');
  fetchAllInternships()
    .then(internships => {
      cache.set(CACHE_KEY, internships);
      console.log(`✅ Cache warmed up with ${internships.length} internships`);
    })
    .catch(error => {
      console.error('❌ Failed to warm up cache:', error.message);
    });
});
