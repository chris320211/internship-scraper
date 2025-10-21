#!/usr/bin/env python3
"""Compare existing Google internships with SerpAPI results"""
import os
import requests
from serpapi import GoogleSearch

os.environ['SERPAPI_API_KEY'] = 'c05116e4b537d6afccbbea9d958bf2706677a1658ecf8d5c60f86ca728a51b2d'

def get_existing_google():
    """Get existing Google internships from DB"""
    response = requests.get("http://localhost:3001/api/internships?limit=10000", timeout=10)
    if response.status_code == 200:
        data = response.json()
        internships = data.get('internships', [])
        return [job for job in internships if 'google' in job['company_name'].lower()]
    return []

def get_serpapi_google():
    """Get Google internships from SerpAPI"""
    params = {
        "api_key": os.environ['SERPAPI_API_KEY'],
        "engine": "google_jobs",
        "q": "Google software engineering internship",
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
    print("COMPARING EXISTING vs SerpAPI GOOGLE INTERNSHIPS")
    print("="*80)

    # Get existing
    existing = get_existing_google()
    print(f"\n📊 Existing Google internships in DB: {len(existing)}")

    existing_titles = set()
    existing_urls = set()

    print("\nExisting titles:")
    for job in existing:
        title = job['position_title']
        url = job.get('application_url', '')
        existing_titles.add(title.lower())
        existing_urls.add(url)
        print(f"  • {title}")

    # Get SerpAPI results
    print(f"\n\n📡 Fetching from SerpAPI...")
    serpapi_jobs = get_serpapi_google()
    print(f"SerpAPI results: {len(serpapi_jobs)}")

    print("\n" + "="*80)
    print("SERPAPI RESULTS vs DATABASE")
    print("="*80)

    new_count = 0
    duplicate_count = 0

    for i, job in enumerate(serpapi_jobs, 1):
        title = job.get("title", "")
        company = job.get("company_name", "")
        url = job.get("share_url", "")

        # Check if it's truly new
        is_duplicate_title = title.lower() in existing_titles
        is_duplicate_url = url in existing_urls
        is_duplicate = is_duplicate_title or is_duplicate_url

        status = "⚠️  DUPLICATE" if is_duplicate else "✅ NEW"

        print(f"\n{i}. {status}")
        print(f"   Title: {title}")
        print(f"   Company: {company}")

        if is_duplicate:
            duplicate_count += 1
            if is_duplicate_title:
                print(f"   Reason: Title matches existing")
            if is_duplicate_url:
                print(f"   Reason: URL matches existing")
        else:
            new_count += 1
            print(f"   URL: {url[:70]}..." if len(url) > 70 else f"   URL: {url}")

    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print(f"SerpAPI Results: {len(serpapi_jobs)}")
    print(f"✅ New: {new_count}")
    print(f"⚠️  Duplicates: {duplicate_count}")

    if new_count > 0:
        print(f"\n✅ SUCCESS: Found {new_count} truly NEW Google internships!")
    else:
        print(f"\n⚠️  All SerpAPI results are duplicates of existing database entries")

if __name__ == '__main__':
    main()
