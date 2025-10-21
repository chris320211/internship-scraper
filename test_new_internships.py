#!/usr/bin/env python3
"""Test if SerpAPI queries find new internships vs what's already in database"""
import os
import sys
import requests
from serpapi import GoogleSearch
from datetime import datetime

# Set API key
os.environ['SERPAPI_API_KEY'] = 'c05116e4b537d6afccbbea9d958bf2706677a1658ecf8d5c60f86ca728a51b2d'

# Backend API URL
API_URL = "http://localhost:3001/api"

def get_existing_internships():
    """Get all internships currently in the database"""
    try:
        response = requests.get(f"{API_URL}/internships", timeout=10)
        if response.status_code == 200:
            data = response.json()
            internships = data.get('internships', [])
            return internships
        else:
            print(f"⚠️  API returned status {response.status_code}")
            return []
    except requests.exceptions.ConnectionError:
        print("⚠️  Cannot connect to backend API at localhost:3001")
        print("   Make sure the backend is running!")
        return None
    except Exception as e:
        print(f"❌ Error fetching internships: {e}")
        return None

def test_serpapi_search(query: str, num_results: int = 10):
    """Run a SerpAPI search and return results"""
    params = {
        "api_key": os.environ['SERPAPI_API_KEY'],
        "engine": "google_jobs",
        "q": query,
        "hl": "en",
        "gl": "us",
        "num": num_results,
        "date_posted": "week",
        "job_employment_type": "internship",
    }

    search = GoogleSearch(params)
    results = search.get_dict()

    if "error" in results:
        print(f'❌ SerpAPI Error: {results["error"]}')
        return []

    return results.get("jobs_results", [])

def main():
    print("="*80)
    print("TESTING NEW SERPAPI SEARCH QUERIES")
    print("="*80)

    # Get existing internships from database
    print("\n1️⃣  Fetching existing internships from database...")
    existing = get_existing_internships()

    if existing is None:
        print("\n⚠️  Backend not running. Starting backend required for full test.")
        print("   Run: cd backend && npm run dev")
        print("\n   Continuing with SerpAPI test only...\n")
        existing = []
    else:
        print(f"   ✓ Found {len(existing)} internships in database")

        # Show breakdown by source
        sources = {}
        for job in existing:
            source = job.get('source', 'Unknown')
            sources[source] = sources.get(source, 0) + 1

        print("\n   Breakdown by source:")
        for source, count in sorted(sources.items(), key=lambda x: -x[1]):
            print(f"     • {source}: {count}")

    # Build set of existing URLs for comparison
    existing_urls = set()
    existing_titles = set()
    for job in existing:
        url = job.get('application_url', '')
        title = job.get('position_title', '')
        if url:
            existing_urls.add(url)
        if title:
            existing_titles.add(title.lower())

    print(f"\n2️⃣  Testing SerpAPI with new query configurations...")

    # Test a few different queries
    test_queries = [
        "software engineering internship 2026",
        "Google software engineering internship",
        "Meta internship 2026",
        "machine learning internship 2026",
    ]

    all_new_jobs = []
    all_duplicate_jobs = []

    for query in test_queries:
        print(f"\n   Query: \"{query}\"")
        jobs = test_serpapi_search(query, num_results=10)
        print(f"   ✓ Found {len(jobs)} results from SerpAPI")

        # Check which are new vs duplicates
        new_count = 0
        dup_count = 0

        for job in jobs:
            url = job.get("share_url", "")
            title = job.get("title", "").lower()
            company = job.get("company_name", "")

            is_new = url not in existing_urls and title not in existing_titles

            if is_new:
                new_count += 1
                all_new_jobs.append({
                    'title': job.get("title", ""),
                    'company': company,
                    'url': url,
                    'query': query
                })
            else:
                dup_count += 1
                all_duplicate_jobs.append({
                    'title': job.get("title", ""),
                    'company': company,
                    'url': url,
                    'query': query
                })

        print(f"     • New: {new_count}")
        print(f"     • Duplicates: {dup_count}")

    # Summary
    print("\n" + "="*80)
    print("RESULTS SUMMARY")
    print("="*80)

    print(f"\n✓ Total SerpAPI results: {len(all_new_jobs) + len(all_duplicate_jobs)}")
    print(f"  • New internships: {len(all_new_jobs)}")
    print(f"  • Already in database: {len(all_duplicate_jobs)}")

    if all_new_jobs:
        print(f"\n📋 NEW INTERNSHIPS FOUND ({len(all_new_jobs)}):")
        for i, job in enumerate(all_new_jobs[:10], 1):
            print(f"\n{i}. {job['title']}")
            print(f"   Company: {job['company']}")
            print(f"   Query: {job['query']}")
            print(f"   URL: {job['url'][:70]}..." if len(job['url']) > 70 else f"   URL: {job['url']}")

        if len(all_new_jobs) > 10:
            print(f"\n   ... and {len(all_new_jobs) - 10} more new internships")

    if all_duplicate_jobs:
        print(f"\n📌 EXISTING INTERNSHIPS (already in DB, {len(all_duplicate_jobs)} total):")
        for i, job in enumerate(all_duplicate_jobs[:3], 1):
            print(f"\n{i}. {job['title']}")
            print(f"   Company: {job['company']}")
            print(f"   (Already tracked)")

        if len(all_duplicate_jobs) > 3:
            print(f"\n   ... and {len(all_duplicate_jobs) - 3} more existing internships")

    print("\n" + "="*80)
    if len(all_new_jobs) > 0:
        print("✅ SUCCESS: New search queries are finding NEW internships!")
    else:
        print("⚠️  WARNING: No new internships found (may indicate all were already scraped)")
    print("="*80)

if __name__ == '__main__':
    main()
