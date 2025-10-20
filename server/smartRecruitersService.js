/**
 * SmartRecruiters API Integration
 * Public REST endpoint: https://api.smartrecruiters.com/v1/companies/{companyId}/postings
 * Easy to filter by title/location
 */

/**
 * Fetch jobs from a single company's SmartRecruiters board
 */
export async function fetchSmartRecruitersJobs(companyId) {
  try {
    const response = await fetch(
      `https://api.smartrecruiters.com/v1/companies/${companyId}/postings?limit=100`
    );

    if (!response.ok) {
      console.warn(`Failed to fetch SmartRecruiters jobs from ${companyId}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.content || [];
  } catch (error) {
    console.error(`Error fetching SmartRecruiters jobs from ${companyId}:`, error.message);
    return [];
  }
}

/**
 * Check if a job is an internship based on title and type
 */
function isInternship(job) {
  const title = job.name?.toLowerCase() || '';
  const typeLabel = job.typeLabel?.toLowerCase() || '';
  const experienceLevel = job.experienceLevel?.toLowerCase() || '';

  const internshipKeywords = ['intern', 'internship', 'co-op', 'coop', 'summer program'];

  return internshipKeywords.some(keyword =>
    title.includes(keyword) || typeLabel.includes(keyword) || experienceLevel.includes(keyword)
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
  const text = `${job.name} ${job.experienceLevel || ''}`.toLowerCase();
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
 * Transform SmartRecruiters job data to our internal format
 */
function transformJob(job, companyName) {
  const location = job.location?.city && job.location?.country
    ? `${job.location.city}, ${job.location.country}`
    : job.location?.remote
    ? 'Remote'
    : 'Remote';

  return {
    id: `smartrecruiters-${companyName.toLowerCase()}-${job.id}`,
    company_name: companyName,
    position_title: job.name,
    description: job.postingDescription || 'No description available',
    job_type: categorizeJobType(job.name),
    location: location,
    eligible_years: determineEligibleYears(job),
    posted_date: job.releasedDate ? new Date(job.releasedDate).toISOString() : new Date().toISOString(),
    application_deadline: null,
    application_url: job.ref || `https://jobs.smartrecruiters.com/${companyName}/${job.id}`,
    is_active: job.status === 'PUBLISHED',
    created_at: job.releasedDate ? new Date(job.releasedDate).toISOString() : new Date().toISOString(),
    source: 'smartrecruiters',
  };
}

/**
 * Fetch internships from a single SmartRecruiters company
 */
export async function fetchSmartRecruitersInternships(company) {
  const jobs = await fetchSmartRecruitersJobs(company.companyId);
  const internships = jobs
    .filter(isInternship)
    .map(job => transformJob(job, company.name));

  console.log(`Found ${internships.length} SmartRecruiters internships at ${company.name}`);
  return internships;
}

/**
 * Fetch all internships from all configured SmartRecruiters companies
 */
export async function fetchAllSmartRecruitersInternships(companies) {
  console.log(`Fetching SmartRecruiters internships from ${companies.length} companies...`);

  const results = await Promise.allSettled(
    companies.map(company => fetchSmartRecruitersInternships(company))
  );

  // Combine all successful results
  const allInternships = results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);

  console.log(`Total SmartRecruiters internships found: ${allInternships.length}`);
  return allInternships;
}
