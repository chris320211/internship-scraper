import pkg from 'pg';
import { fileURLToPath } from 'url';
import path from 'path';
import { readFile } from 'fs/promises';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMA_PATH = path.resolve(__dirname, '../database/schema.sql');
let schemaInitialization;

function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const entityMap = {
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
    '&amp;': '&',
    '&nbsp;': ' ',
  };

  let decoded = text.replace(
    /&(lt|gt|quot|apos|amp|nbsp);/g,
    (match) => entityMap[match] || match
  );

  decoded = decoded.replace(/&#x([\da-fA-F]+);/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
  decoded = decoded.replace(/&#(\d+);/g, (_, dec) =>
    String.fromCharCode(parseInt(dec, 10))
  );

  return decoded;
}

function sanitizeDescription(description) {
  if (!description) {
    return '';
  }

  const decoded = decodeHtmlEntities(description);
  const withoutTags = decoded.replace(/<[^>]*>/g, ' ');
  const cleaned = withoutTags.replace(/\s+/g, ' ').trim();

  return cleaned || '';
}

function normalizeCompanyName(name) {
  if (!name) {
    return 'Unknown Company';
  }

  const normalized = String(name).trim();
  return normalized || 'Unknown Company';
}

function isSearchUrl(url) {
  if (!url) {
    return true;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const query = parsed.search.toLowerCase();
    const searchParams = new URLSearchParams(parsed.search);
    const hasJobIdentifier = ['gh_jid', 'gh_src', 'lever_origin', 'lever-source', 'gh_adid'].some((key) =>
      searchParams.has(key)
    );

    const exactMatches = new Set(['', '/', '/jobs', '/careers', '/careers/']);
    if (exactMatches.has(pathname)) {
      return true;
    }

    const substrings = [
      '/jobs/search',
      '/job-search',
      '/jobsearch',
      '/search/jobs',
      '/careers/search',
      '/search-careers',
      '/search/',
    ];
    if (!hasJobIdentifier && substrings.some((segment) => pathname.includes(segment))) {
      return true;
    }

    // Google Jobs URLs with ibp=htl;jobs parameter are valid job postings (check before generic q= check)
    if (hostname.includes('google.com') && query.includes('ibp=htl;jobs')) {
      return false;
    }

    if (
      !hasJobIdentifier &&
      (query.includes('search=') || query.includes('keyword=') || query.includes('keywords=') || query.includes('q='))
    ) {
      return true;
    }

    if (hostname.includes('indeed') && !pathname.includes('viewjob')) {
      return true;
    }

    if (hostname.includes('linkedin') && pathname.includes('/jobs/')) {
      return pathname.includes('/jobs/search');
    }

    return false;
  } catch (error) {
    return true;
  }
}

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'internship_scraper',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

async function ensureSchema() {
  let schema;
  try {
    schema = await readFile(SCHEMA_PATH, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`⚠️  Schema file not found at ${SCHEMA_PATH}; skipping automatic schema ensure`);
      return;
    }
    throw error;
  }
  const client = await pool.connect();

  try {
    await client.query(schema);
    console.log('📦 PostgreSQL schema ensured');
  } finally {
    client.release();
  }
}

export function initializeDatabase() {
  if (!schemaInitialization) {
    schemaInitialization = ensureSchema().catch((error) => {
      console.error('❌ Failed to initialize PostgreSQL schema:', error);
      throw error;
    });
  }

  return schemaInitialization;
}

export const databaseReady = initializeDatabase();

/**
 * Upsert an internship into the database
 */
export async function upsertInternship(internship) {
  const sanitizedDescription = sanitizeDescription(internship.description);
  const companyName = normalizeCompanyName(internship.company_name);
  if (isSearchUrl(internship.application_url)) {
    console.warn(`Skipping internship ${internship.id} due to search page URL: ${internship.application_url}`);
    return null;
  }

  const query = `
    INSERT INTO internships (
      id, company_name, position_title, description, job_type, location,
      eligible_years, posted_date, application_deadline, application_url,
      is_active, source, last_seen_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
    ON CONFLICT (id)
    DO UPDATE SET
      position_title = EXCLUDED.position_title,
      description = EXCLUDED.description,
      job_type = EXCLUDED.job_type,
      location = EXCLUDED.location,
      eligible_years = EXCLUDED.eligible_years,
      application_url = EXCLUDED.application_url,
      is_active = EXCLUDED.is_active,
      last_seen_at = NOW()
    RETURNING *;
  `;

  const values = [
    internship.id,
    companyName,
    internship.position_title,
    sanitizedDescription,
    internship.job_type,
    internship.location,
    internship.eligible_years || [],
    internship.posted_date || new Date().toISOString(),
    internship.application_deadline || null,
    internship.application_url,
    internship.is_active !== false,
    internship.source || 'unknown',
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Bulk upsert internships
 */
export async function bulkUpsertInternships(internships) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let newCount = 0;
    let updatedCount = 0;

    for (const internship of internships) {
      if (isSearchUrl(internship.application_url)) {
        console.warn(`Skipping internship ${internship.id} due to search page URL: ${internship.application_url}`);
        continue;
      }

      const companyName = normalizeCompanyName(internship.company_name);
      const result = await client.query(
        `
        INSERT INTO internships (
          id, company_name, position_title, description, job_type, location,
          eligible_years, posted_date, application_deadline, application_url,
          is_active, source, last_seen_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        ON CONFLICT (id)
        DO UPDATE SET
          position_title = EXCLUDED.position_title,
          description = EXCLUDED.description,
          job_type = EXCLUDED.job_type,
          location = EXCLUDED.location,
          eligible_years = EXCLUDED.eligible_years,
          application_url = EXCLUDED.application_url,
          is_active = EXCLUDED.is_active,
          last_seen_at = NOW(),
          updated_at = NOW()
        RETURNING (xmax = 0) AS inserted;
        `,
        [
          internship.id,
          companyName,
          internship.position_title,
          sanitizeDescription(internship.description),
          internship.job_type,
          internship.location,
          internship.eligible_years || [],
          internship.posted_date || new Date().toISOString(),
          internship.application_deadline || null,
          internship.application_url,
          internship.is_active !== false,
          internship.source || 'unknown',
        ]
      );

      if (result.rows[0].inserted) {
        newCount++;
      } else {
        updatedCount++;
      }
    }

    await client.query('COMMIT');
    return { newCount, updatedCount };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all active internships with filters
 */
export async function getInternships(filters = {}) {
  const conditions = ['is_active = true', "COALESCE(application_url, '') <> ''"];
  const values = [];
  let paramCount = 1;

  // Search query filter
  if (filters.query) {
    conditions.push(`(
      LOWER(company_name) LIKE $${paramCount} OR
      LOWER(position_title) LIKE $${paramCount} OR
      LOWER(description) LIKE $${paramCount} OR
      LOWER(job_type) LIKE $${paramCount}
    )`);
    values.push(`%${filters.query.toLowerCase()}%`);
    paramCount++;
  }

  // Job type filter
  if (filters.jobTypes && filters.jobTypes.length > 0) {
    conditions.push(`job_type = ANY($${paramCount})`);
    values.push(filters.jobTypes);
    paramCount++;
  }

  // Eligible years filter
  if (filters.years && filters.years.length > 0) {
    conditions.push(`eligible_years && $${paramCount}`);
    values.push(filters.years);
    paramCount++;
  }

  // Remote only filter
  if (filters.remoteOnly) {
    conditions.push(`LOWER(location) LIKE '%remote%'`);
  }

  // Source filter
  if (filters.source) {
    conditions.push(`source = $${paramCount}`);
    values.push(filters.source);
    paramCount++;
  }

  const whereClause = conditions.length > 0 ? conditions.join(' AND ') : 'TRUE';

  let query = `
    SELECT *
    FROM (
      SELECT
        i.*,
        ROW_NUMBER() OVER (
          PARTITION BY
            LOWER(TRIM(i.company_name)),
            LOWER(TRIM(i.position_title)),
            LOWER(TRIM(i.location)),
            COALESCE(i.application_url, '')
        ) AS row_num
      FROM internships i
      WHERE ${whereClause}
    ) filtered
    WHERE row_num = 1
    ORDER BY posted_date DESC
  `;

  // Limit
  if (filters.limit) {
    query += ` LIMIT $${paramCount}`;
    values.push(filters.limit);
    paramCount++;
  }

  const result = await pool.query(query, values);

  // Debug: Log SerpAPI filtering
  const serpApiRows = result.rows.filter(r => r.source === 'Google Jobs (SerpApi)');
  if (serpApiRows.length > 0) {
    console.log(`[DEBUG] Found ${serpApiRows.length} SerpAPI rows before filter`);
    serpApiRows.slice(0, 2).forEach(row => {
      const isSearch = isSearchUrl(row.application_url);
      console.log(`[DEBUG] SerpAPI URL: ${row.application_url.substring(0, 80)}...`);
      console.log(`[DEBUG] isSearchUrl result: ${isSearch}`);
    });
  }

  return result.rows
    .filter((row) => !isSearchUrl(row.application_url))
    .map((row) => ({
      ...row,
      description: '',
      company_name: normalizeCompanyName(row.company_name),
    }));
}

/**
 * Log scraping activity
 */
export async function logScraping(source, stats) {
  const query = `
    INSERT INTO scraping_logs (
      source, total_jobs_found, internships_found, new_internships,
      updated_internships, status, error_message, completed_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    RETURNING *;
  `;

  const values = [
    source,
    stats.totalJobs || 0,
    stats.internships || 0,
    stats.newCount || 0,
    stats.updatedCount || 0,
    stats.status || 'success',
    stats.error || null,
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Get scraping statistics
 */
export async function getScrapingStats() {
  const query = `
    SELECT
      source,
      COUNT(*) as total_runs,
      SUM(internships_found) as total_internships_found,
      SUM(new_internships) as total_new,
      SUM(updated_internships) as total_updated,
      MAX(completed_at) as last_run
    FROM scraping_logs
    WHERE completed_at > NOW() - INTERVAL '7 days'
    GROUP BY source
    ORDER BY last_run DESC;
  `;

  const result = await pool.query(query);
  return result.rows;
}

/**
 * Get database stats
 */
export async function getDatabaseStats() {
  const queries = await Promise.all([
    pool.query('SELECT COUNT(*) as total FROM internships WHERE is_active = true'),
    pool.query('SELECT COUNT(DISTINCT company_name) as companies FROM internships WHERE is_active = true'),
    pool.query('SELECT COUNT(DISTINCT source) as sources FROM internships WHERE is_active = true'),
    pool.query('SELECT source, COUNT(*) as count FROM internships WHERE is_active = true GROUP BY source'),
  ]);

  return {
    totalActive: parseInt(queries[0].rows[0].total),
    totalCompanies: parseInt(queries[1].rows[0].companies),
    totalSources: parseInt(queries[2].rows[0].sources),
    bySource: queries[3].rows,
  };
}

/**
 * Mark old internships as inactive
 */
export async function markOldInternshipsInactive(daysOld = 90) {
  const query = `
    UPDATE internships
    SET is_active = false
    WHERE last_seen_at < NOW() - INTERVAL '${daysOld} days'
    AND is_active = true
    RETURNING id;
  `;

  const result = await pool.query(query);
  return result.rows.length;
}

export default pool;
