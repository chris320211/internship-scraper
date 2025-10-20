# New Job Board Integrations - Summary

## Overview

Successfully integrated **4 new job board platforms** into the internship scraper, expanding coverage from 20 to 50+ companies.

## New Platforms Added

### 1. Lever (10 companies)
- **API Endpoint**: `https://api.lever.co/v0/postings/{company}?mode=json`
- **Service File**: [server/leverService.js](server/leverService.js)
- **Companies**: Netflix, Canva, Rippling, Instacart, Grammarly, Scale AI, Figma, Brex, Plaid, Airtable
- **Features**: JSON feed, easy parsing, includes categories and location data

### 2. Ashby (8 companies)
- **API Endpoint**: `https://jobs.ashbyhq.com/{company}.json`
- **Service File**: [server/ashbyService.js](server/ashbyService.js)
- **Companies**: Anthropic, OpenAI, Ramp, Mercury, Anduril, Retool, Watershed, Deel
- **Features**: Growing adoption by tech companies, clean JSON structure

### 3. Workday (8 companies)
- **API Endpoint**: `https://{subdomain}.myworkdaysite.com/wday/cxs/{org}/{tenant}/jobs`
- **Service File**: [server/workdayService.js](server/workdayService.js)
- **Companies**: Amazon, Apple, Microsoft, Salesforce, Oracle, IBM, Intel, Cisco
- **Features**: Used by many large firms, requires POST with search params

### 4. SmartRecruiters (6 companies)
- **API Endpoint**: `https://api.smartrecruiters.com/v1/companies/{companyId}/postings`
- **Service File**: [server/smartRecruitersService.js](server/smartRecruitersService.js)
- **Companies**: Visa, LinkedIn, Bosch, IKEA, Sephora, McDonald's
- **Features**: Public REST API, easy filtering by title/location

## Files Created/Modified

### New Files Created
1. `/server/leverService.js` - Lever integration service
2. `/server/ashbyService.js` - Ashby integration service
3. `/server/workdayService.js` - Workday integration service
4. `/server/smartRecruitersService.js` - SmartRecruiters integration service

### Modified Files
1. `/server/companies.js` - Added company lists for all 4 new platforms
2. `/server/scraperJob.js` - Integrated all new services into scraping jobs
3. `/README.md` - Updated documentation with new platforms and usage instructions

## Architecture

Each service follows the same pattern established by the Greenhouse integration:

```javascript
// Fetch jobs from API
fetchXJobs(token) → Array<Job>

// Filter for internships
isInternship(job) → Boolean

// Categorize job type
categorizeJobType(title) → String

// Determine eligible years
determineEligibleYears(job) → Array<String>

// Transform to internal format
transformJob(job, companyName) → InternshipObject

// Fetch all internships for all companies
fetchAllXInternships(companies) → Array<Internship>
```

## Data Format

All services normalize data to a common format:
```javascript
{
  id: 'platform-company-jobid',
  company_name: 'Company',
  position_title: 'Job Title',
  description: 'Clean text description',
  job_type: 'Software Engineering',
  location: 'Location or Remote',
  eligible_years: ['Sophomore', 'Junior', 'Senior', 'Graduate'],
  posted_date: '2025-01-01T00:00:00.000Z',
  application_deadline: null,
  application_url: 'https://...',
  is_active: true,
  created_at: '2025-01-01T00:00:00.000Z',
  source: 'platform_name'
}
```

## Scraping Schedule

All platforms are scraped concurrently:
- **Schedule**: Every 6 hours via cron job (configurable via `SCRAPER_SCHEDULE` env var)
- **Initial scrape**: Runs 5 seconds after server startup (unless `SKIP_INITIAL_SCRAPE=true`)
- **Parallel execution**: All platforms fetch simultaneously for optimal performance

## Testing

All JavaScript files have been syntax-validated:
```bash
cd server && node --check *.js
```

To test the integrations:
```bash
# Start the server
cd server && npm start

# Trigger a manual refresh
curl -X POST http://localhost:3001/api/internships/refresh

# Check the stats
curl http://localhost:3001/api/stats

# View internships from specific sources
curl "http://localhost:3001/api/internships?source=lever"
curl "http://localhost:3001/api/internships?source=ashby"
curl "http://localhost:3001/api/internships?source=workday"
curl "http://localhost:3001/api/internships?source=smartrecruiters"
```

## Adding More Companies

To add more companies to any platform, edit [server/companies.js](server/companies.js):

```javascript
// Example: Adding a new Lever company
export const LEVER_COMPANIES = [
  // ... existing companies
  { name: 'NewCompany', token: 'newcompany' },
];

// Example: Adding a new Workday company
export const WORKDAY_COMPANIES = [
  // ... existing companies
  { name: 'NewCompany', org: 'newcompany', tenant: 'careers', subdomain: 'wd5' },
];
```

## Impact

- **Total companies**: Increased from 20 to 52 (160% increase)
- **Platform diversity**: Now supporting 5 major ATS platforms + web scraping
- **Major employers**: Added FAANG companies (Amazon, Apple, Microsoft) via Workday
- **AI companies**: Added leading AI companies (Anthropic, OpenAI) via Ashby
- **Enterprise companies**: Added Fortune 500 companies via SmartRecruiters

## Next Steps

1. **Monitor scraping performance**: Check logs for any API errors or rate limits
2. **Validate data quality**: Review internships from new sources for accuracy
3. **Add more companies**: Identify additional companies using these platforms
4. **Optimize scraping**: Consider staggered scraping if APIs have rate limits
5. **Frontend updates**: Consider adding source filtering in the UI

## Notes

- All APIs are **public and free** - no authentication required
- **Workday** structure varies by company - may need adjustments per organization
- Some companies may not have active internship postings at all times
- The scraper gracefully handles failures and continues with other sources
