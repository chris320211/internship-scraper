// Test the isSearchUrl function with SerpAPI URLs

function isSearchUrl(url) {
  if (!url) {
    return true;
  }

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const query = parsed.search.toLowerCase();
    const searchParams = new URLSearchParams(parsed.search);
    const hasJobIdentifier = ['gh_jid', 'gh_src', 'lever_origin', 'lever-source', 'gh_adid'].some((key) =>
      searchParams.has(key)
    );

    const exactMatches = new Set(['', '/', '/jobs', '/careers', '/careers/']);
    if (exactMatches.has(pathname)) {
      return true;
    }

    const substrings = [
      '/jobs/search',
      '/job-search',
      '/jobsearch',
      '/search/jobs',
      '/careers/search',
      '/search-careers',
      '/search/',
    ];
    if (!hasJobIdentifier && substrings.some((segment) => pathname.includes(segment))) {
      return true;
    }

    // Google Jobs URLs with ibp=htl;jobs parameter are valid job postings (check before generic q= check)
    if (hostname.includes('google.com') && query.includes('ibp=htl;jobs')) {
      console.log('  → Matched Google Jobs exception, returning FALSE (valid URL)');
      return false;
    }

    if (
      !hasJobIdentifier &&
      (query.includes('search=') || query.includes('keyword=') || query.includes('keywords=') || query.includes('q='))
    ) {
      return true;
    }

    if (hostname.includes('indeed') && !pathname.includes('viewjob')) {
      return true;
    }

    if (hostname.includes('linkedin') && pathname.includes('/jobs/')) {
      return pathname.includes('/jobs/search');
    }

    return false;
  } catch (error) {
    return true;
  }
}

// Test with real SerpAPI URL
const testUrl = 'https://www.google.com/search?ibp=htl;jobs&q=eyJqb2JfdGl0bGUiOiJTb2Z0d2FyZSBEZXZlbG9wZXIgSW50ZXJuIChOZXcgWW9yaykg4oCTIFN1bW1lciAyMDI2IiwiY29tcGFueV9uYW1lIjoiVGhlIEQuIEUuIFNoYXcgR3JvdXAiLCJhZGRyZXNzX2NpdHkiOiJOZXcgWW9yaywgTlkiLCJodGlkb2NpZCI6IjJUZ0xEcnZMUmM5VWpDMFBBQUFBQUE9PSIsImdsIjoidXMiLCJobCI6ImVuIn0=';

console.log('Testing URL:', testUrl);
console.log('\nParsing URL...');
const parsed = new URL(testUrl);
console.log('  Hostname:', parsed.hostname);
console.log('  Pathname:', parsed.pathname);
console.log('  Search:', parsed.search);
console.log('  Contains "ibp=htl;jobs":', parsed.search.includes('ibp=htl;jobs'));
console.log('  Contains "/search":', parsed.pathname.includes('/search'));

console.log('\nTesting isSearchUrl function...');
const result = isSearchUrl(testUrl);

console.log('\n' + '='.repeat(60));
console.log('Result:', result ? '❌ FILTERED OUT (search URL)' : '✅ VALID (job posting)');
console.log('='.repeat(60));

if (result === true) {
  console.log('\n⚠️  PROBLEM: SerpAPI URLs are being filtered out!');
} else {
  console.log('\n✅ GOOD: SerpAPI URLs are recognized as valid job postings');
}
