#!/usr/bin/env python3
"""Test SerpAPI search queries without full scraper imports"""
import os
from datetime import datetime

# Mock the scraper's query logic
SEARCH_QUERIES = [
    "software engineering internship 2026",
    "machine learning internship 2026",
    "data science internship 2026",
    "product management internship 2026",
    "quantitative internship 2026",
    "frontend engineering internship 2026",
    "backend engineering internship 2026",
    "full stack internship 2026",
]

MAJOR_COMPANIES = [
    "Google", "Meta", "Amazon", "Apple", "Microsoft",
    "NVIDIA", "Tesla", "Palantir", "Stripe", "Databricks",
    "Snowflake", "Netflix", "Uber", "Lyft", "Airbnb",
]

COMPANY_QUERY_TEMPLATES = [
    "{company} internship 2026",
    "{company} software engineering internship",
    "{company} new grad internship",
    "{company} intern program",
]

def build_all_queries():
    """Build all possible queries"""
    queries = []
    queries.extend(SEARCH_QUERIES)

    for company in MAJOR_COMPANIES:
        for template in COMPANY_QUERY_TEMPLATES:
            queries.append(template.format(company=company))

    # Deduplicate
    seen = set()
    deduped = []
    for q in queries:
        trimmed = q.strip()
        if trimmed and trimmed.lower() not in seen:
            seen.add(trimmed.lower())
            deduped.append(trimmed)

    return deduped

def main():
    # Set API key
    os.environ['SERPAPI_API_KEY'] = 'c05116e4b537d6afccbbea9d958bf2706677a1658ecf8d5c60f86ca728a51b2d'

    all_queries = build_all_queries()

    print('=== ALL SEARCH QUERIES ===')
    print(f'Total unique queries: {len(all_queries)}\n')

    print('Base Internship Type Queries:')
    for i, q in enumerate(SEARCH_QUERIES, 1):
        print(f'  {i}. {q}')

    print(f'\nCompany-Specific Queries ({len(MAJOR_COMPANIES)} companies × {len(COMPANY_QUERY_TEMPLATES)} templates):')
    company_queries = [q for q in all_queries if q not in SEARCH_QUERIES]
    for i, q in enumerate(company_queries[:10], 1):
        print(f'  {i}. {q}')
    print(f'  ... and {len(company_queries) - 10} more company queries')

    # Show rotation logic
    max_per_run = 6
    day_index = datetime.utcnow().timetuple().tm_yday % len(all_queries)
    rotated = all_queries[day_index:] + all_queries[:day_index]
    today_queries = rotated[:max_per_run]

    print(f'\n=== TODAY\'S QUERIES (day of year: {datetime.utcnow().timetuple().tm_yday}) ===')
    print(f'Running {len(today_queries)} of {len(all_queries)} queries:\n')
    for i, q in enumerate(today_queries, 1):
        print(f'  {i}. {q}')

    print('\n=== RUNNING TEST SEARCH ===')
    print('Testing first query to verify new internships...\n')

    # Now import and run actual search
    from serpapi import GoogleSearch

    test_query = today_queries[0]
    print(f'Query: "{test_query}"')

    params = {
        "api_key": os.environ['SERPAPI_API_KEY'],
        "engine": "google_jobs",
        "q": test_query,
        "hl": "en",
        "gl": "us",
        "num": 10,
        "date_posted": "week",
        "job_employment_type": "internship",
    }

    search = GoogleSearch(params)
    results = search.get_dict()

    if "error" in results:
        print(f'❌ Error: {results["error"]}')
        return

    jobs = results.get("jobs_results", [])
    print(f'✓ Found {len(jobs)} jobs\n')

    print('Sample Results:')
    for i, job in enumerate(jobs[:5], 1):
        title = job.get("title", "N/A")
        company = job.get("company_name", "N/A")
        location = job.get("location", "N/A")
        print(f'\n{i}. {title}')
        print(f'   Company: {company}')
        print(f'   Location: {location}')

        # Show if it's in the database already
        url = job.get("share_url", "N/A")
        print(f'   URL: {url[:80]}...' if len(url) > 80 else f'   URL: {url}')

if __name__ == '__main__':
    main()
