import { GREENHOUSE_COMPANIES } from './companies.js';

const GREENHOUSE_API_BASE = 'https://boards-api.greenhouse.io/v1/boards';

/**
 * Fetch jobs from a single company's Greenhouse board
 */
export async function fetchCompanyJobs(boardToken) {
  try {
    const response = await fetch(`${GREENHOUSE_API_BASE}/${boardToken}/jobs?content=true`);

    if (!response.ok) {
      console.warn(`Failed to fetch jobs from ${boardToken}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.jobs || [];
  } catch (error) {
    console.error(`Error fetching jobs from ${boardToken}:`, error.message);
    return [];
  }
}

/**
 * Check if a job is an internship based on title and metadata
 */
function isInternship(job) {
  const title = job.title?.toLowerCase() || '';
  const content = job.content?.toLowerCase() || '';

  const internshipKeywords = ['intern', 'internship', 'co-op', 'coop', 'summer program'];

  return internshipKeywords.some(keyword =>
    title.includes(keyword) || content.includes(keyword)
  );
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
  if (titleLower.includes('machine learning') || titleLower.includes('ml ')) {
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
  if (titleLower.includes('fullstack') || titleLower.includes('full-stack')) {
    return 'Full Stack Development';
  }

  return 'Other';
}

/**
 * Determine eligible years from job title/description
 */
function determineEligibleYears(job) {
  const text = `${job.title} ${job.content}`.toLowerCase();
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
 * Transform Greenhouse job data to our internal format
 */
function transformJob(job, companyName) {
  const location = job.location?.name || 'Remote';

  return {
    id: `${companyName.toLowerCase()}-${job.id}`,
    company_name: companyName,
    position_title: job.title,
    description: job.content?.replace(/<[^>]*>/g, '').substring(0, 500) || 'No description available',
    job_type: categorizeJobType(job.title),
    location: location,
    eligible_years: determineEligibleYears(job),
    posted_date: job.updated_at || new Date().toISOString(),
    application_deadline: null,
    application_url: job.absolute_url,
    is_active: true,
    created_at: job.updated_at || new Date().toISOString(),
  };
}

/**
 * Fetch all internships from all configured companies
 */
export async function fetchAllInternships() {
  console.log(`Fetching internships from ${GREENHOUSE_COMPANIES.length} companies...`);

  const results = await Promise.allSettled(
    GREENHOUSE_COMPANIES.map(async (company) => {
      const jobs = await fetchCompanyJobs(company.token);
      const internships = jobs
        .filter(isInternship)
        .map(job => transformJob(job, company.name));

      console.log(`Found ${internships.length} internships at ${company.name}`);
      return internships;
    })
  );

  // Combine all successful results
  const allInternships = results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);

  console.log(`Total internships found: ${allInternships.length}`);
  return allInternships;
}

/**
 * Search internships with filters
 */
export function searchInternships(internships, filters = {}) {
  let filtered = [...internships];

  // Search query filter
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filtered = filtered.filter(internship =>
      internship.company_name.toLowerCase().includes(query) ||
      internship.position_title.toLowerCase().includes(query) ||
      internship.description.toLowerCase().includes(query) ||
      internship.job_type.toLowerCase().includes(query)
    );
  }

  // Job type filter
  if (filters.jobTypes && filters.jobTypes.length > 0) {
    filtered = filtered.filter(internship =>
      filters.jobTypes.includes(internship.job_type)
    );
  }

  // Eligible years filter
  if (filters.years && filters.years.length > 0) {
    filtered = filtered.filter(internship =>
      internship.eligible_years.some(year => filters.years.includes(year))
    );
  }

  // Remote only filter
  if (filters.remoteOnly) {
    filtered = filtered.filter(internship =>
      internship.location.toLowerCase().includes('remote')
    );
  }

  return filtered;
}
