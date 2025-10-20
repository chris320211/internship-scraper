// Company logo mapping - using public folder paths
export const companyLogos: Record<string, string> = {
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
};

// Helper function to get company logo
export const getCompanyLogo = (companyName: string): string | null => {
  return companyLogos[companyName] || null;
};
