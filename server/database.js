import pkg from 'pg';
const { Pool } = pkg;

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

/**
 * Upsert an internship into the database
 */
export async function upsertInternship(internship) {
  const sanitizedDescription = sanitizeDescription(internship.description);

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
    internship.company_name,
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
          internship.company_name,
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
  let query = 'SELECT * FROM internships WHERE is_active = true';
  const values = [];
  let paramCount = 1;

  // Search query filter
  if (filters.query) {
    query += ` AND (
      LOWER(company_name) LIKE $${paramCount} OR
      LOWER(position_title) LIKE $${paramCount} OR
      LOWER(description) LIKE $${paramCount} OR
      LOWER(job_type) LIKE $${paramCount}
    )`;
    values.push(`%${filters.query.toLowerCase()}%`);
    paramCount++;
  }

  // Job type filter
  if (filters.jobTypes && filters.jobTypes.length > 0) {
    query += ` AND job_type = ANY($${paramCount})`;
    values.push(filters.jobTypes);
    paramCount++;
  }

  // Eligible years filter
  if (filters.years && filters.years.length > 0) {
    query += ` AND eligible_years && $${paramCount}`;
    values.push(filters.years);
    paramCount++;
  }

  // Remote only filter
  if (filters.remoteOnly) {
    query += ` AND LOWER(location) LIKE '%remote%'`;
  }

  // Source filter
  if (filters.source) {
    query += ` AND source = $${paramCount}`;
    values.push(filters.source);
    paramCount++;
  }

  query += ' ORDER BY posted_date DESC';

  // Limit
  if (filters.limit) {
    query += ` LIMIT $${paramCount}`;
    values.push(filters.limit);
    paramCount++;
  }

  const result = await pool.query(query, values);
  return result.rows.map((row) => ({
    ...row,
    description: sanitizeDescription(row.description),
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
