import { categorizeJobType } from './jobTypeClassifier.js';

/**
 * Lever Job Board API Integration
 * Lever boards are accessible at https://jobs.lever.co/{company}
 * JSON feed available at https://api.lever.co/v0/postings/{company}?mode=json
 */

/**
 * Fetch jobs from a single company's Lever board
 */
export async function fetchLeverJobs(companyToken) {
  try {
    const response = await fetch(`https://api.lever.co/v0/postings/${companyToken}?mode=json`);

    if (!response.ok) {
      console.warn(`Failed to fetch Lever jobs from ${companyToken}: ${response.status}`);
      return [];
    }

    const jobs = await response.json();
    return Array.isArray(jobs) ? jobs : [];
  } catch (error) {
    console.error(`Error fetching Lever jobs from ${companyToken}:`, error.message);
    return [];
  }
}

/**
 * Check if a job is an internship based on title and categories
 */
function isInternship(job) {
  const title = job.text?.toLowerCase() || '';
  const description = job.description?.toLowerCase() || '';
  const categories = job.categories?.commitment?.toLowerCase() || '';

  const internshipKeywords = ['intern', 'internship', 'co-op', 'coop', 'summer program'];

  return internshipKeywords.some(keyword =>
    title.includes(keyword) || description.includes(keyword) || categories.includes(keyword)
  );
}

/**
 * Determine eligible years from job title/description
 */
function determineEligibleYears(job) {
  const text = `${job.text} ${job.description}`.toLowerCase();
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
 * Clean HTML content
 */
function cleanDescription(html) {
  if (!html) return 'No description available';

  // Strip HTML tags
  let text = html.replace(/<[^>]*>/g, ' ');

  // Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Get first 300 characters for description
  if (text.length > 300) {
    text = text.substring(0, 300) + '...';
  }

  return text || 'No description available';
}

/**
 * Transform Lever job data to our internal format
 */
function transformJob(job, companyName) {
  const location = job.categories?.location || job.workplaceType || 'Remote';

  return {
    id: `lever-${companyName.toLowerCase()}-${job.id}`,
    company_name: companyName,
    position_title: job.text,
    description: cleanDescription(job.description),
    job_type: categorizeJobType(job.text, job.description),
    location: location,
    eligible_years: determineEligibleYears(job),
    posted_date: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
    application_deadline: null,
    application_url: job.hostedUrl || job.applyUrl,
    is_active: true,
    created_at: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
    source: 'lever',
  };
}

/**
 * Fetch internships from a single Lever company
 */
export async function fetchLeverInternships(company) {
  const jobs = await fetchLeverJobs(company.token);
  const internships = jobs
    .filter(isInternship)
    .map(job => transformJob(job, company.name));

  console.log(`Found ${internships.length} Lever internships at ${company.name}`);
  return internships;
}

/**
 * Fetch all internships from all configured Lever companies
 */
export async function fetchAllLeverInternships(companies) {
  console.log(`Fetching Lever internships from ${companies.length} companies...`);

  const results = await Promise.allSettled(
    companies.map(company => fetchLeverInternships(company))
  );

  // Combine all successful results
  const allInternships = results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);

  console.log(`Total Lever internships found: ${allInternships.length}`);
  return allInternships;
}
