/**
 * Ashby Job Board API Integration
 * Ashby boards are accessible at https://jobs.ashbyhq.com/{company}
 * JSON feed available at https://jobs.ashbyhq.com/{company}.json
 */

/**
 * Fetch jobs from a single company's Ashby board
 */
export async function fetchAshbyJobs(companyToken) {
  try {
    const response = await fetch(`https://jobs.ashbyhq.com/${companyToken}.json`);

    if (!response.ok) {
      console.warn(`Failed to fetch Ashby jobs from ${companyToken}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.jobs || [];
  } catch (error) {
    console.error(`Error fetching Ashby jobs from ${companyToken}:`, error.message);
    return [];
  }
}

/**
 * Check if a job is an internship based on title and metadata
 */
function isInternship(job) {
  const title = job.title?.toLowerCase() || '';
  const description = job.description?.toLowerCase() || '';
  const department = job.departmentName?.toLowerCase() || '';

  const internshipKeywords = ['intern', 'internship', 'co-op', 'coop', 'summer program'];

  return internshipKeywords.some(keyword =>
    title.includes(keyword) || description.includes(keyword) || department.includes(keyword)
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
  const text = `${job.title} ${job.description}`.toLowerCase();
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
 * Transform Ashby job data to our internal format
 */
function transformJob(job, companyName) {
  const location = job.locationName || job.location || 'Remote';

  return {
    id: `ashby-${companyName.toLowerCase()}-${job.id}`,
    company_name: companyName,
    position_title: job.title,
    description: cleanDescription(job.description),
    job_type: categorizeJobType(job.title),
    location: location,
    eligible_years: determineEligibleYears(job),
    posted_date: job.publishedDate ? new Date(job.publishedDate).toISOString() : new Date().toISOString(),
    application_deadline: null,
    application_url: job.jobUrl || `https://jobs.ashbyhq.com/${companyName.toLowerCase()}/${job.id}`,
    is_active: job.isListed !== false,
    created_at: job.publishedDate ? new Date(job.publishedDate).toISOString() : new Date().toISOString(),
    source: 'ashby',
  };
}

/**
 * Fetch internships from a single Ashby company
 */
export async function fetchAshbyInternships(company) {
  const jobs = await fetchAshbyJobs(company.token);
  const internships = jobs
    .filter(isInternship)
    .map(job => transformJob(job, company.name));

  console.log(`Found ${internships.length} Ashby internships at ${company.name}`);
  return internships;
}

/**
 * Fetch all internships from all configured Ashby companies
 */
export async function fetchAllAshbyInternships(companies) {
  console.log(`Fetching Ashby internships from ${companies.length} companies...`);

  const results = await Promise.allSettled(
    companies.map(company => fetchAshbyInternships(company))
  );

  // Combine all successful results
  const allInternships = results
    .filter(result => result.status === 'fulfilled')
    .flatMap(result => result.value);

  console.log(`Total Ashby internships found: ${allInternships.length}`);
  return allInternships;
}
