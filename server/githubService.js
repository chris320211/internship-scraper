/**
 * GitHub Repository Data Integration
 * Fetches curated internship lists from popular GitHub repositories
 */

// GitHub raw file URLs for internship repositories
const GITHUB_SOURCES = {
  simplify: {
    name: 'SimplifyJobs',
    url: 'https://raw.githubusercontent.com/SimplifyJobs/Summer2025-Internships/dev/.github/scripts/listings.json',
    format: 'json',
    repo: 'SimplifyJobs/Summer2025-Internships'
  },
  pittcsc: {
    name: 'Pitt CSC',
    url: 'https://raw.githubusercontent.com/pittcsc/Summer2025-Internships/dev/.github/scripts/listings.json',
    format: 'json',
    repo: 'pittcsc/Summer2025-Internships'
  },
  codingcrashkourse: {
    name: 'Coding Crashkourse',
    // This repo uses a different structure, will need to check README.md
    url: 'https://raw.githubusercontent.com/Coding-Crashkurse/Internships/main/internships.json',
    format: 'json',
    repo: 'Coding-Crashkurse/Internships',
    fallback: 'https://api.github.com/repos/Coding-Crashkurse/Internships/contents/'
  }
};

/**
 * Fetch data from a GitHub raw URL
 */
async function fetchGitHubData(source) {
  try {
    console.log(`Fetching ${source.name} data from GitHub...`);
    const response = await fetch(source.url);

    if (!response.ok) {
      console.warn(`Failed to fetch ${source.name}: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get('content-type');

    if (source.format === 'json' && contentType?.includes('application/json')) {
      return await response.json();
    } else {
      const text = await response.text();
      // Try to parse as JSON even if content-type is wrong
      try {
        return JSON.parse(text);
      } catch {
        console.warn(`${source.name} returned non-JSON data`);
        return null;
      }
    }
  } catch (error) {
    console.error(`Error fetching ${source.name}:`, error.message);
    return null;
  }
}

/**
 * Determine job type from title
 */
function categorizeJobType(title) {
  const titleLower = title.toLowerCase();

  if (titleLower.includes('software') || titleLower.includes('swe') || titleLower.includes('engineer')) {
    return 'Software Engineering';
  }
  if (titleLower.includes('data scien')) {
    return 'Data Science';
  }
  if (titleLower.includes('machine learning') || titleLower.includes('ml ') || titleLower.includes('ai ')) {
    return 'Machine Learning';
  }
  if (titleLower.includes('product manage') || titleLower.includes('pm ')) {
    return 'Product Management';
  }
  if (titleLower.includes('mobile') || titleLower.includes('ios') || titleLower.includes('android')) {
    return 'Mobile Development';
  }
  if (titleLower.includes('security') || titleLower.includes('cybersecurity')) {
    return 'Security Engineering';
  }
  if (titleLower.includes('devops') || titleLower.includes('sre')) {
    return 'DevOps';
  }
  if (titleLower.includes('design') || titleLower.includes('ui') || titleLower.includes('ux')) {
    return 'UI/UX Design';
  }
  if (titleLower.includes('data engineer')) {
    return 'Data Engineering';
  }
  if (titleLower.includes('frontend') || titleLower.includes('front-end')) {
    return 'Frontend Development';
  }
  if (titleLower.includes('backend') || titleLower.includes('back-end')) {
    return 'Backend Development';
  }
  if (titleLower.includes('fullstack') || titleLower.includes('full-stack') || titleLower.includes('full stack')) {
    return 'Full Stack Development';
  }
  if (titleLower.includes('quant')) {
    return 'Quantitative';
  }

  return 'Other';
}

/**
 * Determine eligible years from job title/description
 */
function determineEligibleYears(job) {
  const text = `${job.title || ''} ${job.description || ''} ${job.terms || ''}`.toLowerCase();
  const years = [];

  if (text.includes('freshman') || text.includes('freshmen')) {
    years.push('Freshman');
  }
  if (text.includes('sophomore')) {
    years.push('Sophomore');
  }
  if (text.includes('junior')) {
    years.push('Junior');
  }
  if (text.includes('senior')) {
    years.push('Senior');
  }
  if (text.includes('graduate') || text.includes('grad student') || text.includes('masters') || text.includes('phd')) {
    years.push('Graduate');
  }

  // If no specific year mentioned, assume it's open to most students
  if (years.length === 0) {
    return ['Sophomore', 'Junior', 'Senior', 'Graduate'];
  }

  return years;
}

/**
 * Parse SimplifyJobs/Pitt CSC format
 * Expected format: Array of objects with company_name, title, location, url, etc.
 */
function parseSimplifyFormat(data, sourceName) {
  if (!Array.isArray(data)) {
    console.warn(`${sourceName}: Expected array, got ${typeof data}`);
    return [];
  }

  return data.map(job => {
    const id = `github-${sourceName.toLowerCase().replace(/\s+/g, '-')}-${job.id || job.url || Math.random().toString(36).substring(7)}`;

    // Convert Unix timestamp to ISO string if needed
    let postedDate = new Date().toISOString();
    if (job.date_posted) {
      // Check if it's a Unix timestamp (number) or ISO string
      if (typeof job.date_posted === 'number') {
        postedDate = new Date(job.date_posted * 1000).toISOString();
      } else {
        postedDate = job.date_posted;
      }
    } else if (job.date_updated) {
      if (typeof job.date_updated === 'number') {
        postedDate = new Date(job.date_updated * 1000).toISOString();
      } else {
        postedDate = job.date_updated;
      }
    }

    return {
      id: id.substring(0, 255), // Ensure ID isn't too long
      company_name: job.company_name || job.company || 'Unknown',
      position_title: job.title || job.role || 'Internship',
      description: job.description || `${job.title || 'Internship'} at ${job.company_name || job.company}`,
      job_type: categorizeJobType(job.title || job.role || ''),
      location: job.location || job.locations?.join(', ') || 'Remote',
      eligible_years: determineEligibleYears(job),
      posted_date: postedDate,
      application_deadline: job.application_deadline || null,
      application_url: job.url || job.application_url || null,
      is_active: job.active !== false && job.is_visible !== false,
      created_at: new Date().toISOString(),
      source: `github_${sourceName.toLowerCase().replace(/\s+/g, '_')}`,
    };
  }).filter(job => job.application_url && job.is_active);
}

/**
 * Parse Coding Crashkourse format
 */
function parseCodingCrashkourseFormat(data, sourceName) {
  // This might have a different structure, handle both array and object with array
  let internships = [];

  if (Array.isArray(data)) {
    internships = data;
  } else if (data.internships && Array.isArray(data.internships)) {
    internships = data.internships;
  } else if (data.jobs && Array.isArray(data.jobs)) {
    internships = data.jobs;
  } else {
    console.warn(`${sourceName}: Unexpected data structure`);
    return [];
  }

  return internships.map(job => {
    const id = `github-coding-crashkourse-${job.id || job.url || Math.random().toString(36).substring(7)}`;

    return {
      id: id.substring(0, 255),
      company_name: job.company || job.company_name || 'Unknown',
      position_title: job.title || job.position || 'Internship',
      description: job.description || `${job.title || 'Internship'} at ${job.company || job.company_name}`,
      job_type: categorizeJobType(job.title || job.position || ''),
      location: job.location || 'Remote',
      eligible_years: determineEligibleYears(job),
      posted_date: job.posted || job.date || new Date().toISOString(),
      application_deadline: null,
      application_url: job.url || job.link || null,
      is_active: true,
      created_at: new Date().toISOString(),
      source: 'github_coding_crashkourse',
    };
  }).filter(job => job.application_url);
}

/**
 * Fetch and parse internships from all GitHub sources
 */
export async function fetchAllGitHubInternships() {
  console.log('🔄 Fetching internships from GitHub repositories...');
  const startTime = Date.now();

  const results = await Promise.allSettled([
    fetchGitHubData(GITHUB_SOURCES.simplify),
    fetchGitHubData(GITHUB_SOURCES.pittcsc),
    fetchGitHubData(GITHUB_SOURCES.codingcrashkourse),
  ]);

  let allInternships = [];

  // Parse SimplifyJobs
  if (results[0].status === 'fulfilled' && results[0].value) {
    const simplifyInternships = parseSimplifyFormat(results[0].value, 'SimplifyJobs');
    console.log(`✅ SimplifyJobs: ${simplifyInternships.length} internships`);
    allInternships = allInternships.concat(simplifyInternships);
  } else {
    console.warn('❌ SimplifyJobs: Failed to fetch');
  }

  // Parse Pitt CSC
  if (results[1].status === 'fulfilled' && results[1].value) {
    const pittInternships = parseSimplifyFormat(results[1].value, 'Pitt CSC');
    console.log(`✅ Pitt CSC: ${pittInternships.length} internships`);
    allInternships = allInternships.concat(pittInternships);
  } else {
    console.warn('❌ Pitt CSC: Failed to fetch');
  }

  // Parse Coding Crashkourse
  if (results[2].status === 'fulfilled' && results[2].value) {
    const ccInternships = parseCodingCrashkourseFormat(results[2].value, 'Coding Crashkourse');
    console.log(`✅ Coding Crashkourse: ${ccInternships.length} internships`);
    allInternships = allInternships.concat(ccInternships);
  } else {
    console.warn('❌ Coding Crashkourse: Failed to fetch');
  }

  // Deduplicate by URL (many repos might have overlapping data)
  const uniqueInternships = [];
  const seenUrls = new Set();

  for (const internship of allInternships) {
    if (!seenUrls.has(internship.application_url)) {
      seenUrls.add(internship.application_url);
      uniqueInternships.push(internship);
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Total GitHub internships: ${uniqueInternships.length} (${allInternships.length} before deduplication)`);
  console.log(`⏱️  GitHub fetch completed in ${duration}s`);

  return uniqueInternships;
}

/**
 * Get list of GitHub sources for stats/display
 */
export function getGitHubSources() {
  return Object.values(GITHUB_SOURCES).map(source => ({
    name: source.name,
    repo: source.repo,
    url: `https://github.com/${source.repo}`
  }));
}
