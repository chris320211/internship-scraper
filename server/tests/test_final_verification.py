#!/usr/bin/env python3
"""Final verification that new SerpAPI queries find unique internships"""
import os
import requests
from serpapi import GoogleSearch

# Set API key
os.environ['SERPAPI_API_KEY'] = 'c05116e4b537d6afccbbea9d958bf2706677a1658ecf8d5c60f86ca728a51b2d'

API_URL = "http://localhost:3001/api"

def get_all_internships():
    """Get all internships from database"""
    try:
        response = requests.get(f"{API_URL}/internships?limit=10000", timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('internships', [])
        return []
    except:
        return []

def test_query(query: str):
    """Test a single SerpAPI query"""
    params = {
        "api_key": os.environ['SERPAPI_API_KEY'],
        "engine": "google_jobs",
        "q": query,
        "hl": "en",
        "gl": "us",
        "num": 10,
        "date_posted": "week",
        "job_employment_type": "internship",
    }

    search = GoogleSearch(params)
    results = search.get_dict()

    if "error" in results:
        return []

    return results.get("jobs_results", [])

def main():
    print("="*80)
    print("FINAL VERIFICATION: Testing New SerpAPI Queries")
    print("="*80)

    # Get existing data
    print("\n📊 Loading database...")
    existing = get_all_internships()
    print(f"   Total internships in DB: {len(existing)}")

    # Build lookup sets
    existing_titles = set()
    existing_companies = set()
    existing_sources = set()

    for job in existing:
        title = job.get('position_title', '').lower()
        company = job.get('company_name', '').lower()
        source = job.get('source', '')

        existing_titles.add(title)
        existing_companies.add(company)
        existing_sources.add(source)

    print(f"   Unique companies: {len(existing_companies)}")
    print(f"   Sources: {existing_sources}")

    # Test specific queries that should find NEW internships
    test_queries = [
        ("Google", "Google software engineering internship"),
        ("NVIDIA", "NVIDIA software engineering internship"),
        ("Meta", "Meta software engineering internship"),
        ("Microsoft", "Microsoft software engineering internship"),
        ("Databricks", "Databricks software engineering internship"),
    ]

    print("\n" + "="*80)
    print("TESTING COMPANY-SPECIFIC QUERIES")
    print("="*80)

    all_new = []
    all_existing = []

    for company, query in test_queries:
        print(f"\n🔍 Testing: {company}")
        print(f"   Query: \"{query}\"")

        jobs = test_query(query)
        print(f"   Results: {len(jobs)}")

        if not jobs:
            print("   ⚠️  No results from SerpAPI")
            continue

        new_count = 0
        existing_count = 0

        for job in jobs:
            title = job.get("title", "").lower()
            job_company = job.get("company_name", "").lower()

            # Check if this exact title exists
            is_new = title not in existing_titles

            if is_new:
                new_count += 1
                all_new.append({
                    'title': job.get("title", ""),
                    'company': job.get("company_name", ""),
                    'location': job.get("location", ""),
                    'query': query
                })
            else:
                existing_count += 1
                all_existing.append(title)

        print(f"   ✓ New: {new_count}")
        print(f"   • Already in DB: {existing_count}")

        # Show sample new jobs
        if new_count > 0:
            sample_jobs = [j for j in jobs if j.get("title", "").lower() not in existing_titles][:2]
            for job in sample_jobs:
                print(f"      → {job.get('title', 'N/A')}")

    # Final Summary
    print("\n" + "="*80)
    print("FINAL RESULTS")
    print("="*80)

    print(f"\n✅ NEW INTERNSHIPS FOUND: {len(all_new)}")
    print(f"⚪ Existing (duplicates): {len(all_existing)}")

    if all_new:
        print(f"\n📋 Sample of NEW internships (showing 10 of {len(all_new)}):\n")
        for i, job in enumerate(all_new[:10], 1):
            print(f"{i}. {job['title']}")
            print(f"   Company: {job['company']}")
            print(f"   Location: {job['location']}")
            print(f"   Source Query: {job['query']}")
            print()

    print("="*80)
    if len(all_new) >= 10:
        print("✅ SUCCESS: SerpAPI queries are finding NEW internships!")
        print(f"   Found {len(all_new)} new internships not in the database")
    elif len(all_new) > 0:
        print("✅ PARTIAL SUCCESS: Some new internships found")
        print(f"   Found {len(all_new)} new internships")
    else:
        print("⚠️  No new internships found (all were already in database)")

    print("="*80)

if __name__ == '__main__':
    main()
