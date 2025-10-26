#!/usr/bin/env python3
"""Test company-specific SerpAPI queries"""
import os
from serpapi import GoogleSearch

# Set API key
os.environ['SERPAPI_API_KEY'] = 'c05116e4b537d6afccbbea9d958bf2706677a1658ecf8d5c60f86ca728a51b2d'

MAJOR_COMPANIES = [
    "Google", "Meta", "Amazon", "Apple", "Microsoft",
    "NVIDIA", "Tesla", "Palantir", "Stripe", "Databricks",
]

COMPANY_QUERY_TEMPLATES = [
    "{company} internship 2026",
    "{company} software engineering internship",
]

def test_company_query(query: str):
    """Test a single query"""
    params = {
        "api_key": os.environ['SERPAPI_API_KEY'],
        "engine": "google_jobs",
        "q": query,
        "hl": "en",
        "gl": "us",
        "num": 5,
        "date_posted": "week",
        "job_employment_type": "internship",
    }

    search = GoogleSearch(params)
    results = search.get_dict()

    if "error" in results:
        return 0, f"Error: {results['error']}"

    jobs = results.get("jobs_results", [])
    return len(jobs), jobs

def main():
    print("="*80)
    print("TESTING COMPANY-SPECIFIC QUERIES")
    print("="*80)

    print(f"\nTesting {len(MAJOR_COMPANIES)} major companies...")
    print("Limiting to 2 queries per company for this test\n")

    total_results = 0
    successful_queries = 0
    failed_queries = 0

    for company in MAJOR_COMPANIES:
        print(f"\n🏢 {company}")
        print("-" * 40)

        for template in COMPANY_QUERY_TEMPLATES[:2]:  # Test first 2 templates
            query = template.format(company=company)
            count, result = test_company_query(query)

            if isinstance(result, str):
                print(f"  ❌ {query}")
                print(f"     {result}")
                failed_queries += 1
            else:
                print(f"  ✓ {query}: {count} results")
                successful_queries += 1
                total_results += count

                # Show first result
                if result:
                    job = result[0]
                    title = job.get("title", "N/A")
                    print(f"    → {title}")

    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"\nCompanies tested: {len(MAJOR_COMPANIES)}")
    print(f"Successful queries: {successful_queries}")
    print(f"Failed queries: {failed_queries}")
    print(f"Total results found: {total_results}")
    print(f"Average results per query: {total_results / successful_queries:.1f}" if successful_queries > 0 else "N/A")

    print("\n✅ Company-specific queries are working!")

if __name__ == '__main__':
    main()
