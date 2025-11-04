import { categorizeJobType } from './jobTypeClassifier.js';
import { extractEligibility } from './eligibilityExtractor.js';

/**
 * Workday Job Board API Integration
 * Workday job listings accessible via /wday/cxs/{org}/{tenant}/jobs
 * Example: https://wd1.myworkdaysite.com/wday/cxs/{org}/{tenant}/jobs
 */

/**
 * Fetch jobs from a single company's Workday instance
 * @param {string} org - Organization identifier
 * @param {string} tenant - Tenant identifier (e.g., 'recruiting', 'careers')
 * @param {string} subdomain - Subdomain (e.g., 'wd1', 'wd5')
 */
export async function fetchWorkdayJobs(org, tenant, subdomain = 'wd1') {
  try {
    const baseUrl = `https://${subdomain}.myworkdaysite.com/wday/cxs/${org}/${tenant}/jobs`;

    // Workday typically requires a POST request with search parameters
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        appliedFacets: {},
        limit: 100,
        offset: 0,
        searchText: '',
      }),
    });

    if (!response.ok) {
      console.warn(`Failed to fetch Workday jobs from ${org}/${tenant}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.jobPostings || [];
  } catch (error) {
    console.error(`Error fetching Workday jobs from ${org}/${tenant}:`, error.message);
    return [];
  }
}

/**
 * Check if a job is an internship based on title
 */
function isInternship(job) {
  const title = job.title?.toLowerCase() || '';
  const bulletFields = job.bulletFields?.join(' ').toLowerCase() || '';

  const internshipKeywords = ['intern', 'internship', 'co-op', 'coop', 'summer program'];

  return internshipKeywords.some(keyword =>
    title.includes(keyword) || bulletFields.includes(keyword)
  );
}

/**
 * Determine eligible years from job title/description
 */
function determineEligibleYears(job) {
  const text = `${job.title} ${job.bulletFields?.join(' ') || ''}`.toLowerCase();
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
 * Transform Workday job data to our internal format
 */
function transformJob(job, companyName, org, tenant, subdomain) {
  const location = job.locationsText || 'Remote';
  const jobUrl = `https://${subdomain}.myworkdaysite.com/${org}/${tenant}/job/${job.bulletFields?.[0] || job.title}/${job.externalPath}`;
  const description = job.bulletFields?.join(' • ') || 'No description available';
  const eligibility = extractEligibility(job.title, description);

  return {
    id: `workday-${companyName.toLowerCase()}-${job.externalPath}`,
    company_name: companyName,
    position_title: job.title,
    description: description,
    job_type: categorizeJobType(job.title, job.bulletFields?.join(' ')),
    location: location,
    eligible_years: eligibility.eligible_years,
    student_status: eligibility.student_status,
    visa_requirements: eligibility.visa_requirements,
    degree_level: eligibility.degree_level,
    major_requirements: eligibility.major_requirements,
    posted_date: job.postedOn ? new Date(job.postedOn).toISOString() : new Date().toISOString(),
    application_deadline: null,
    application_url: jobUrl,
    is_active: true,
    created_at: job.postedOn ? new Date(job.postedOn).toISOString() : new Date().toISOString(),
    source: 'workday',
  };
}

/**
 * Fetch internships from a single Workday company
 */
export async function fetchWorkdayInternships(company) {
  const jobs = await fetchWorkdayJobs(company.org, company.tenant, company.subdomain);
  const internships = jobs
    .filter(isInternship)
    .map(job => transformJob(job, company.name, company.org, company.tenant, company.subdomain));

  console.log(`Found ${internships.length} Workday internships at ${company.name}`);
  return internships;
}

/**
 * Fetch all internships from all configured Workday companies
 */
export async function fetchAllWorkdayInternships(companies) {
  console.log(`Fetching Workday internships from ${companies.length} companies...`);

  const results = await Promise.allSettled(
    companies.map(company => fetchWorkdayInternships(company))
  );

  // Combine all successful results
  const allInternships = results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);

  console.log(`Total Workday internships found: ${allInternships.length}`);
  return allInternships;
}
