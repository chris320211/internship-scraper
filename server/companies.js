// List of companies that use Greenhouse for their job boards
// These are publicly accessible board tokens
export const GREENHOUSE_COMPANIES = [
  { name: 'Airbnb', token: 'airbnb' },
  { name: 'Slack', token: 'slack' },
  { name: 'Stripe', token: 'stripe' },
  { name: 'Notion', token: 'notion' },
  { name: 'Coinbase', token: 'coinbase' },
  { name: 'Databricks', token: 'databricks' },
  { name: 'Reddit', token: 'reddit' },
  { name: 'Robinhood', token: 'robinhood' },
  { name: 'Dropbox', token: 'dropbox' },
  { name: 'Square', token: 'square' },
  { name: 'Twitch', token: 'twitch' },
  { name: 'DoorDash', token: 'doordash' },
  { name: 'Lyft', token: 'lyft' },
  { name: 'Snap', token: 'snapchat' },
  { name: 'Discord', token: 'discord' },
  { name: 'Shopify', token: 'shopify' },
  { name: 'Atlassian', token: 'atlassian' },
  { name: 'GitLab', token: 'gitlab' },
  { name: 'Cloudflare', token: 'cloudflare' },
  { name: 'Asana', token: 'asana' },
];

// Companies using Lever job boards (https://jobs.lever.co/{token})
// To find more companies, visit company career pages and look for URLs like:
// https://jobs.lever.co/{token} - then test the API: https://api.lever.co/v0/postings/{token}?mode=json
export const LEVER_COMPANIES = [
  { name: 'Plaid', token: 'plaid' },
  // Many companies have moved away from Lever or don't have public APIs
  // Add more as you discover them by testing the API endpoints
];

// Companies using Ashby job boards (https://jobs.ashbyhq.com/{token})
// Note: Ashby doesn't provide public JSON feeds - these companies need web scraping
// or you need to verify the exact API endpoint format
export const ASHBY_COMPANIES = [
  // Temporarily disabled - Ashby requires different API access
  // { name: 'Anthropic', token: 'anthropic' },
  // { name: 'Ramp', token: 'ramp' },
];

// Companies using Workday (structure: org/tenant/subdomain)
// Note: Workday requires complex reverse engineering per company
// These need to be verified individually as the API structure varies
export const WORKDAY_COMPANIES = [
  // Temporarily disabled - Workday requires company-specific configuration
  // and may need authentication or different API endpoints
];

// Companies using SmartRecruiters (https://api.smartrecruiters.com/v1/companies/{companyId}/postings)
// Note: SmartRecruiters may require API authentication or have restricted public access
export const SMARTRECRUITERS_COMPANIES = [
  // Temporarily disabled - SmartRecruiters public API needs verification
  // Many companies may require authentication
];
