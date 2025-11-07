// Company logo mapping - only for logos we actually have in /public/company-logos/
export const companyLogos: Record<string, string> = {
  // Original logos
  'Google': '/company-logos/google.svg',
  'Meta': '/company-logos/meta.svg',
  'Microsoft': '/company-logos/microsoft.svg',
  'Amazon': '/company-logos/amazon.svg',
  'Stripe': '/company-logos/stripe.svg',
  'Airbnb': '/company-logos/airbnb.svg',
  'Tesla': '/company-logos/tesla.svg',
  'Cloudflare': '/company-logos/cloudflare.svg',
  'Netflix': '/company-logos/netflix.svg',
  'Figma': '/company-logos/figma.svg',
  'Shopify': '/company-logos/shopify.svg',
  'Notion': '/company-logos/notion.svg',
  'Coinbase': '/company-logos/coinbase.svg',
  'Databricks': '/company-logos/databricks.svg',
  'Discord': '/company-logos/discord.svg',
  'Dropbox': '/company-logos/dropbox.svg',
  'GitLab': '/company-logos/gitlab.svg',
  'Lyft': '/company-logos/lyft.svg',
  'Reddit': '/company-logos/reddit.svg',
  'Robinhood': '/company-logos/robinhood.svg',
  'Twitch': '/company-logos/twitch.svg',
  'Asana': '/company-logos/asana.svg',

  // Newly added tech companies
  'Apple': '/company-logos/apple.svg',
  'Adobe': '/company-logos/adobe.svg',
  'NVIDIA': '/company-logos/nvidia.svg',
  'IBM': '/company-logos/ibm.svg',
  'Intel': '/company-logos/intel.svg',
  'Oracle': '/company-logos/oracle.svg',
  'Salesforce': '/company-logos/salesforce.svg',
  'Qualcomm': '/company-logos/qualcomm.svg',
  'AMD': '/company-logos/amd.svg',

  // Communication & Collaboration
  'Slack': '/company-logos/slack.svg',
  'Zoom': '/company-logos/zoom.svg',
  'GitHub': '/company-logos/github.svg',
  'Atlassian': '/company-logos/atlassian.svg',

  // Cloud & Database
  'MongoDB': '/company-logos/mongodb.svg',
  'Snowflake': '/company-logos/snowflake.svg',
  'VMware': '/company-logos/vmware.svg',
  'Cisco': '/company-logos/cisco.svg',

  // Social Media & Content
  'Twitter': '/company-logos/twitter.svg',
  'X': '/company-logos/twitter.svg',
  'LinkedIn': '/company-logos/linkedin.svg',
  'Pinterest': '/company-logos/pinterest.svg',
  'Spotify': '/company-logos/spotify.svg',

  // Finance & Payments
  'Visa': '/company-logos/visa.svg',
  'Mastercard': '/company-logos/mastercard.svg',
  'PayPal': '/company-logos/paypal.svg',
  'Point72': '/company-logos/point72.svg',
  // Removed broken logos: Goldman Sachs, JPMorgan, Morgan Stanley - will use Clearbit API

  // Consulting
  // Removed broken logos: Deloitte, Accenture - will use Clearbit API

  // Transportation & Delivery
  'Uber': '/company-logos/uber.svg',
  'DoorDash': '/company-logos/doordash.svg',

  // Entertainment & Media
  'Disney': '/company-logos/disney.svg',
  'Walt Disney': '/company-logos/disney.svg',
  'The Walt Disney Company': '/company-logos/disney.svg',
  'SpaceX': '/company-logos/spacex.svg',
  'Roblox': '/company-logos/roblox.svg',
  'Unity': '/company-logos/unity.svg',

  // Aerospace & Automotive
  'Boeing': '/company-logos/boeing.svg',
  'Ford': '/company-logos/ford.svg',
  'Toyota': '/company-logos/toyota.svg',

  // Retail & E-commerce
  'Walmart': '/company-logos/walmart.svg',
  'Target': '/company-logos/target.svg',
  'Etsy': '/company-logos/etsy.svg',

  // Software & Tools
  'HubSpot': '/company-logos/hubspot.svg',
  'Canva': '/company-logos/canva.svg',
  // Removed broken logos: Autodesk, Intuit - will use Clearbit API

  // Telecom
  'Verizon': '/company-logos/verizon.svg',
};

// Company domain mapping for logo API fallback
const companyDomains: Record<string, string> = {
  // Tech
  'Apple': 'apple.com',
  'Google': 'google.com',
  'Microsoft': 'microsoft.com',
  'Meta': 'meta.com',
  'Facebook': 'facebook.com',
  'Amazon': 'amazon.com',
  'Netflix': 'netflix.com',
  'Adobe': 'adobe.com',
  'NVIDIA': 'nvidia.com',
  'Intel': 'intel.com',
  'IBM': 'ibm.com',
  'Oracle': 'oracle.com',
  'Salesforce': 'salesforce.com',
  'SAP': 'sap.com',
  'Qualcomm': 'qualcomm.com',
  'Palantir': 'palantir.com',
  'ByteDance': 'bytedance.com',
  'Uber': 'uber.com',
  'Lyft': 'lyft.com',
  'Airbnb': 'airbnb.com',
  'Tesla': 'tesla.com',
  'Snap': 'snap.com',
  'Snapchat': 'snap.com',
  'Twitter': 'twitter.com',
  'X': 'x.com',
  'LinkedIn': 'linkedin.com',
  'Pinterest': 'pinterest.com',
  'Spotify': 'spotify.com',
  'Slack': 'slack.com',
  'Zoom': 'zoom.us',
  'Atlassian': 'atlassian.com',
  'Square': 'squareup.com',
  'Block': 'block.xyz',
  'Stripe': 'stripe.com',
  'PayPal': 'paypal.com',
  'Coinbase': 'coinbase.com',
  'Robinhood': 'robinhood.com',
  'Shopify': 'shopify.com',
  'Notion': 'notion.so',
  'Figma': 'figma.com',
  'Canva': 'canva.com',
  'Discord': 'discord.com',
  'Twitch': 'twitch.tv',
  'Reddit': 'reddit.com',
  'GitHub': 'github.com',
  'GitLab': 'gitlab.com',
  'Dropbox': 'dropbox.com',
  'Cloudflare': 'cloudflare.com',
  'Databricks': 'databricks.com',
  'Snowflake': 'snowflake.com',
  'MongoDB': 'mongodb.com',
  'Splunk': 'splunk.com',
  'ServiceNow': 'servicenow.com',
  'Workday': 'workday.com',
  'DoorDash': 'doordash.com',
  'Instacart': 'instacart.com',
  'Roblox': 'roblox.com',
  'Unity': 'unity.com',
  'Epic Games': 'epicgames.com',
  'Electronic Arts': 'ea.com',
  'Activision': 'activision.com',
  'TikTok': 'tiktok.com',
  'Autodesk': 'autodesk.com',
  'Intuit': 'intuit.com',
  'HubSpot': 'hubspot.com',

  // Finance
  'Goldman Sachs': 'goldmansachs.com',
  'JPMorgan': 'jpmorganchase.com',
  'JPMorgan Chase': 'jpmorganchase.com',
  'Chase': 'chase.com',
  'Morgan Stanley': 'morganstanley.com',
  'Citadel': 'citadel.com',
  'Citadel Securities': 'citadelsecurities.com',
  'Jane Street': 'janestreet.com',
  'Two Sigma': 'twosigma.com',
  'Jump Trading': 'jumptrading.com',
  'Point72': 'point72.com',
  'Visa': 'visa.com',
  'Mastercard': 'mastercard.com',
  'American Express': 'americanexpress.com',
  'Capital One': 'capitalone.com',
  'Wells Fargo': 'wellsfargo.com',
  'Bank of America': 'bankofamerica.com',
  'BlackRock': 'blackrock.com',
  'Fidelity': 'fidelity.com',

  // Consulting
  'McKinsey': 'mckinsey.com',
  'BCG': 'bcg.com',
  'Bain': 'bain.com',
  'Deloitte': 'deloitte.com',
  'PwC': 'pwc.com',
  'EY': 'ey.com',
  'KPMG': 'kpmg.com',
  'Accenture': 'accenture.com',

  // Semiconductor
  'AMD': 'amd.com',
  'ARM': 'arm.com',
  'Broadcom': 'broadcom.com',
  'Texas Instruments': 'ti.com',
  'Analog Devices': 'analog.com',

  // Aerospace
  'SpaceX': 'spacex.com',
  'Blue Origin': 'blueorigin.com',
  'Boeing': 'boeing.com',
  'Lockheed Martin': 'lockheedmartin.com',
  'Northrop Grumman': 'northropgrumman.com',
  'Raytheon': 'rtx.com',
  'RTX': 'rtx.com',

  // Automotive
  'Ford': 'ford.com',
  'GM': 'gm.com',
  'Toyota': 'toyota.com',
  'Rivian': 'rivian.com',
  'Lucid': 'lucidmotors.com',

  // Retail
  'Walmart': 'walmart.com',
  'Target': 'target.com',
  'Wayfair': 'wayfair.com',
  'Etsy': 'etsy.com',

  // Healthcare
  'Johnson & Johnson': 'jnj.com',
  'Pfizer': 'pfizer.com',
  'Moderna': 'modernatx.com',

  // Enterprise
  'VMware': 'vmware.com',
  'Red Hat': 'redhat.com',
  'Cisco': 'cisco.com',

  // Entertainment
  'Walt Disney': 'disney.com',
  'Disney': 'disney.com',
  'The Walt Disney Company': 'disney.com',

  // Telecom
  'Verizon': 'verizon.com',
  'AT&T': 'att.com',
  'T-Mobile': 't-mobile.com',

  // Additional Tech Companies
  'Plaid': 'plaid.com',
  'Brex': 'brex.com',
  'Chime': 'chime.com',
  'Affirm': 'affirm.com',
  'Gusto': 'gusto.com',
  'Rippling': 'rippling.com',
  'Ramp': 'ramp.com',
  'Anthropic': 'anthropic.com',
  'OpenAI': 'openai.com',
  'Cohere': 'cohere.ai',
  'Hugging Face': 'huggingface.co',
  'Scale AI': 'scale.com',
  'DataRobot': 'datarobot.com',
  'Datadog': 'datadoghq.com',
  'New Relic': 'newrelic.com',
  'PagerDuty': 'pagerduty.com',
  'HashiCorp': 'hashicorp.com',
  'Vercel': 'vercel.com',
  'Netlify': 'netlify.com',
  'Twilio': 'twilio.com',
  'SendGrid': 'sendgrid.com',
  'Segment': 'segment.com',
  'Amplitude': 'amplitude.com',
  'Mixpanel': 'mixpanel.com',
  'LaunchDarkly': 'launchdarkly.com',
  'Cockroach Labs': 'cockroachlabs.com',
  'CockroachDB': 'cockroachlabs.com',
  'Elastic': 'elastic.co',
  'Confluent': 'confluent.io',
  'Redis': 'redis.io',
  'Redis Labs': 'redis.com',
  'Neo4j': 'neo4j.com',
  'Airtable': 'airtable.com',
  'Coda': 'coda.io',
  'Linear': 'linear.app',
  'Retool': 'retool.com',
  'Zapier': 'zapier.com',
  'IFTTT': 'ifttt.com',
  'Miro': 'miro.com',
  'Sketch': 'sketch.com',
  'InVision': 'invisionapp.com',
  'Abstract': 'abstract.com',

  // Gaming & Entertainment
  'Riot Games': 'riotgames.com',
  'Blizzard': 'blizzard.com',
  'Valve': 'valvesoftware.com',
  'Nintendo': 'nintendo.com',
  'Sony': 'sony.com',
  'PlayStation': 'playstation.com',
  'Xbox': 'xbox.com',

  // E-commerce & Retail
  'eBay': 'ebay.com',
  'Alibaba': 'alibaba.com',
  'Mercari': 'mercari.com',
  'Poshmark': 'poshmark.com',
  'Gopuff': 'gopuff.com',
  'Postmates': 'postmates.com',
  'Grubhub': 'grubhub.com',
  'Deliveroo': 'deliveroo.com',

  // Travel & Hospitality
  'Booking.com': 'booking.com',
  'Expedia': 'expedia.com',
  'TripAdvisor': 'tripadvisor.com',
  'Hopper': 'hopper.com',

  // Health Tech
  'Oscar Health': 'hioscar.com',
  'Ro': 'ro.co',
  'Hims': 'forhims.com',
  'Calm': 'calm.com',
  'Headspace': 'headspace.com',
  '23andMe': '23andme.com',
  'Tempus': 'tempus.com',
  'Color': 'color.com',

  // Education
  'Coursera': 'coursera.org',
  'Udacity': 'udacity.com',
  'edX': 'edx.org',
  'Khan Academy': 'khanacademy.org',
  'Duolingo': 'duolingo.com',
  'Quizlet': 'quizlet.com',
  'Chegg': 'chegg.com',

  // Cybersecurity
  'CrowdStrike': 'crowdstrike.com',
  'Palo Alto Networks': 'paloaltonetworks.com',
  'Okta': 'okta.com',
  'Auth0': 'auth0.com',
  'Snyk': 'snyk.io',
  '1Password': '1password.com',
  'LastPass': 'lastpass.com',
  'Duo Security': 'duo.com',
  'Tanium': 'tanium.com',

  // More Startups
  'Flexport': 'flexport.com',
  'Convoy': 'convoy.com',
  'Faire': 'faire.com',
  'Coupang': 'coupang.com',
  'Grab': 'grab.com',
  'GoJek': 'gojek.com',
  'Nubank': 'nubank.com.br',
  'Klarna': 'klarna.com',
  'SoFi': 'sofi.com',
  'Wealthfront': 'wealthfront.com',
  'Betterment': 'betterment.com',

  // Real Estate & PropTech
  'Zillow': 'zillow.com',
  'Redfin': 'redfin.com',
  'Compass': 'compass.com',
  'OpenDoor': 'opendoor.com',
  'Offerpad': 'offerpad.com',

  // HR Tech
  'Greenhouse': 'greenhouse.io',
  'Lever': 'lever.co',
  'Ashby': 'ashbyhq.com',
  'BambooHR': 'bamboohr.com',
  'Lattice': 'lattice.com',
  'Culture Amp': 'cultureamp.com',
  '15Five': '15five.com',

  // Media & Communication
  'Medium': 'medium.com',
  'Substack': 'substack.com',
  'Patreon': 'patreon.com',
  'OnlyFans': 'onlyfans.com',
  'Clubhouse': 'clubhouse.com',

  // Cloud & Infrastructure
  'DigitalOcean': 'digitalocean.com',
  'Linode': 'linode.com',
  'Vultr': 'vultr.com',
  'Fastly': 'fastly.com',
  'Akamai': 'akamai.com',
};

// Helper function to get company domain
function getCompanyDomain(companyName: string): string | null {
  if (!companyName) return null;

  // Direct match
  if (companyDomains[companyName]) {
    return companyDomains[companyName];
  }

  // Case-insensitive match
  const normalized = companyName.trim();
  const exactMatch = Object.keys(companyDomains).find(
    key => key.toLowerCase() === normalized.toLowerCase()
  );
  if (exactMatch) {
    return companyDomains[exactMatch];
  }

  // Partial match
  const partialMatch = Object.keys(companyDomains).find(key => {
    const keyLower = key.toLowerCase();
    const nameLower = normalized.toLowerCase();
    return nameLower.includes(keyLower) || keyLower.includes(nameLower);
  });

  return partialMatch ? companyDomains[partialMatch] : null;
}

// Helper function to guess domain from company name
function guessDomainFromName(companyName: string): string | null {
  if (!companyName) return null;

  // Clean up the name
  let cleanName = companyName
    .toLowerCase()
    .trim()
    // Remove common suffixes
    .replace(/\s+(inc\.?|llc\.?|corp\.?|corporation|limited|ltd\.?|company|co\.?)$/i, '')
    // Remove special characters but keep spaces temporarily
    .replace(/[^a-z0-9\s&-]/g, '')
    .trim();

  // Handle special cases
  if (cleanName.includes('&')) {
    cleanName = cleanName.replace(/\s*&\s*/g, '');
  }

  // Remove spaces and hyphens for domain
  cleanName = cleanName.replace(/[\s-]/g, '');

  // If name is too short, might not be valid
  if (cleanName.length < 3) return null;

  return `${cleanName}.com`;
}

// Helper function to get company logo with multiple fallback strategies
export const getCompanyLogo = (companyName: string): string | null => {
  if (!companyName) return null;

  // Strategy 1: Use Brandfetch CDN - direct access, no API key needed, most reliable
  const domain = getCompanyDomain(companyName);
  if (domain) {
    // Brandfetch CDN - serves logos directly from their CDN
    return `https://cdn.brandfetch.io/${domain}?c=1idalcQyn-8DLRJFuTP`;
  }

  // Strategy 2: Try to guess the domain from the company name
  const guessedDomain = guessDomainFromName(companyName);
  if (guessedDomain) {
    return `https://cdn.brandfetch.io/${guessedDomain}?c=1idalcQyn-8DLRJFuTP`;
  }

  // Strategy 3: Return null to show initials fallback in component
  return null;
};

// Helper to get fallback logo (using Clearbit)
export const getFallbackLogo = (companyName: string): string | null => {
  const domain = getCompanyDomain(companyName) || guessDomainFromName(companyName);
  if (domain) {
    // Try Clearbit as first fallback
    return `https://logo.clearbit.com/${domain}`;
  }
  return null;
};

// Helper to get final fallback logo (Google favicon)
export const getFinalFallbackLogo = (companyName: string): string | null => {
  const domain = getCompanyDomain(companyName) || guessDomainFromName(companyName);
  if (domain) {
    // Google's favicon service as ultimate fallback - always works
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
  }
  return null;
};
