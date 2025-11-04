"""
Delta-friendly scrapers for job board APIs (Greenhouse, Lever, Workday, etc.)

These scrapers leverage:
- API timestamps (updated_at fields)
- Structured JSON responses
- Content hashing for HTML sources
"""
import hashlib
import json
from datetime import datetime
from typing import Dict, List, Optional
import requests
from scrapling.fetchers import Fetcher


class GreenhouseScraper:
    """
    Scraper for Greenhouse job boards with delta detection

    Greenhouse APIs provide:
    - updated_at timestamp per job
    - Structured JSON responses
    - Consistent job IDs
    """

    def __init__(self, company_boards: Optional[List[str]] = None):
        """
        Initialize Greenhouse scraper

        Args:
            company_boards: List of company board subdomain names (e.g., ['meta', 'stripe'])
        """
        self.company_boards = company_boards or []

    def _build_api_url(self, company: str) -> str:
        """Build Greenhouse API URL for a company"""
        return f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs"

    def fetch_jobs(self, company: str, since: Optional[datetime] = None) -> List[Dict]:
        """
        Fetch jobs from Greenhouse API

        Args:
            company: Company subdomain (e.g., 'meta')
            since: Only return jobs updated since this datetime (delta)

        Returns:
            List of job dictionaries with updated_at timestamps
        """
        url = self._build_api_url(company)

        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()

            jobs = data.get('jobs', [])

            # Filter internships and apply delta filter
            filtered_jobs = []
            for job in jobs:
                title = job.get('title', '').lower()

                # Check if internship
                if not any(keyword in title for keyword in ['intern', 'co-op', 'coop']):
                    continue

                # Apply delta filter if since timestamp provided
                if since:
                    updated_at_str = job.get('updated_at')
                    if updated_at_str:
                        # Parse ISO timestamp
                        updated_at = datetime.fromisoformat(
                            updated_at_str.replace('Z', '+00:00')
                        )
                        if updated_at < since:
                            continue

                filtered_jobs.append(job)

            return filtered_jobs

        except Exception as e:
            print(f"Error fetching Greenhouse jobs for {company}: {e}")
            return []

    def parse_job(self, job: Dict, company: str) -> Dict:
        """Parse Greenhouse job into standard format"""
        job_id = job.get('id')
        title = job.get('title', '').strip()
        absolute_url = job.get('absolute_url', '')

        # Extract location
        location_obj = job.get('location', {})
        location = location_obj.get('name', 'Various') if isinstance(location_obj, dict) else str(location_obj)

        # Extract departments
        departments = job.get('departments', [])
        department = departments[0].get('name') if departments else 'Engineering'

        # Updated timestamp
        updated_at = job.get('updated_at', datetime.utcnow().isoformat())

        return {
            'id': f'greenhouse-{company}-{job_id}',
            'company_name': company.title(),
            'position_title': title,
            'description': f'{title} at {company.title()}',
            'job_type': self._categorize_from_title(title),
            'location': location,
            'eligible_years': ['Sophomore', 'Junior', 'Senior'],
            'posted_date': updated_at,
            'updated_at': updated_at,  # Important for delta detection
            'application_url': absolute_url,
            'is_active': True,
            'source': 'greenhouse',
        }

    def _categorize_from_title(self, title: str) -> str:
        """Simple job type categorization"""
        title_lower = title.lower()

        if 'machine learning' in title_lower or 'ml' in title_lower:
            return 'Machine Learning'
        elif 'data science' in title_lower:
            return 'Data Science'
        elif 'frontend' in title_lower or 'front-end' in title_lower:
            return 'Frontend Development'
        elif 'backend' in title_lower or 'back-end' in title_lower:
            return 'Backend Development'
        elif 'full stack' in title_lower or 'fullstack' in title_lower:
            return 'Full Stack Development'
        else:
            return 'Software Engineering'

    def scrape_all_boards(self, since: Optional[datetime] = None) -> List[Dict]:
        """Scrape all configured Greenhouse boards"""
        all_jobs = []

        for company in self.company_boards:
            print(f"  Scraping Greenhouse: {company}")
            jobs = self.fetch_jobs(company, since=since)
            parsed_jobs = [self.parse_job(job, company) for job in jobs]
            all_jobs.extend(parsed_jobs)
            print(f"    Found {len(parsed_jobs)} internships")

        return all_jobs


class LeverScraper:
    """
    Scraper for Lever job boards with delta detection

    Lever APIs provide:
    - createdAt/updatedAt timestamps
    - Structured JSON responses
    - Team/department filtering
    """

    def __init__(self, company_boards: Optional[List[str]] = None):
        """
        Initialize Lever scraper

        Args:
            company_boards: List of company Lever sites (e.g., ['netflix', 'twitch'])
        """
        self.company_boards = company_boards or []

    def _build_api_url(self, company: str) -> str:
        """Build Lever API URL for a company"""
        return f"https://api.lever.co/v0/postings/{company}"

    def fetch_jobs(self, company: str, since: Optional[datetime] = None) -> List[Dict]:
        """
        Fetch jobs from Lever API

        Args:
            company: Company identifier
            since: Only return jobs updated since this datetime

        Returns:
            List of job dictionaries
        """
        url = self._build_api_url(company)
        params = {'mode': 'json'}

        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            jobs = response.json()

            # Filter internships and apply delta
            filtered_jobs = []
            for job in jobs:
                text = job.get('text', '').lower()
                categories = job.get('categories', {})
                commitment = categories.get('commitment', '').lower()

                # Check if internship
                is_internship = (
                    'intern' in text or
                    'intern' in commitment or
                    'co-op' in text
                )

                if not is_internship:
                    continue

                # Apply delta filter
                if since:
                    created_at_ts = job.get('createdAt')
                    if created_at_ts:
                        created_at = datetime.fromtimestamp(created_at_ts / 1000)
                        if created_at < since:
                            continue

                filtered_jobs.append(job)

            return filtered_jobs

        except Exception as e:
            print(f"Error fetching Lever jobs for {company}: {e}")
            return []

    def parse_job(self, job: Dict, company: str) -> Dict:
        """Parse Lever job into standard format"""
        job_id = job.get('id')
        title = job.get('text', '').strip()
        apply_url = job.get('hostedUrl', '')

        categories = job.get('categories', {})
        location = categories.get('location', 'Various')
        team = categories.get('team', 'Engineering')

        created_at_ts = job.get('createdAt', 0)
        created_at = datetime.fromtimestamp(created_at_ts / 1000).isoformat() if created_at_ts else datetime.utcnow().isoformat()

        return {
            'id': f'lever-{company}-{job_id}',
            'company_name': company.title(),
            'position_title': title,
            'description': job.get('descriptionPlain', '')[:500],
            'job_type': self._categorize_from_title(title),
            'location': location,
            'eligible_years': ['Sophomore', 'Junior', 'Senior'],
            'posted_date': created_at,
            'updated_at': created_at,
            'application_url': apply_url,
            'is_active': True,
            'source': 'lever',
        }

    def _categorize_from_title(self, title: str) -> str:
        """Simple job type categorization"""
        title_lower = title.lower()

        if 'machine learning' in title_lower or 'ml' in title_lower:
            return 'Machine Learning'
        elif 'data' in title_lower:
            return 'Data Science'
        elif 'frontend' in title_lower:
            return 'Frontend Development'
        elif 'backend' in title_lower:
            return 'Backend Development'
        else:
            return 'Software Engineering'

    def scrape_all_boards(self, since: Optional[datetime] = None) -> List[Dict]:
        """Scrape all configured Lever boards"""
        all_jobs = []

        for company in self.company_boards:
            print(f"  Scraping Lever: {company}")
            jobs = self.fetch_jobs(company, since=since)
            parsed_jobs = [self.parse_job(job, company) for job in jobs]
            all_jobs.extend(parsed_jobs)
            print(f"    Found {len(parsed_jobs)} internships")

        return all_jobs


class WorkdayScraper:
    """
    Scraper for Workday job boards with content hashing for delta detection

    Workday doesn't provide updated_at timestamps, so we:
    - Hash the normalized job listing JSON
    - Compare hashes to detect changes
    """

    def __init__(self, company_urls: Optional[Dict[str, str]] = None):
        """
        Initialize Workday scraper

        Args:
            company_urls: Dict mapping company name to Workday URL
        """
        self.company_urls = company_urls or {}

    def _normalize_job(self, job: Dict) -> Dict:
        """Normalize job dict for consistent hashing"""
        return {
            'title': job.get('title', '').strip(),
            'location': job.get('location', '').strip(),
            'id': job.get('id', '').strip(),
        }

    def _hash_job(self, job: Dict) -> str:
        """Compute hash of normalized job"""
        normalized = self._normalize_job(job)
        content = json.dumps(normalized, sort_keys=True)
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def fetch_jobs(self, company: str, url: str, previous_hashes: Optional[set] = None) -> Tuple[List[Dict], set]:
        """
        Fetch and parse Workday jobs

        Args:
            company: Company name
            url: Workday URL
            previous_hashes: Set of previously seen job hashes (for delta detection)

        Returns:
            Tuple of (new/changed jobs, current hashes)
        """
        try:
            page = Fetcher.get(url, timeout=30)

            # Parse jobs from page (Workday uses specific structure)
            jobs = []
            job_elements = page.css('[data-automation-id="compositeContainer"]')

            current_hashes = set()
            new_or_changed_jobs = []

            for elem in job_elements:
                try:
                    title_elem = elem.css_first('[data-automation-id="jobTitle"]')
                    location_elem = elem.css_first('[data-automation-id="locations"]')

                    if not title_elem:
                        continue

                    title = title_elem.text.strip()

                    # Check if internship
                    if not any(kw in title.lower() for kw in ['intern', 'co-op']):
                        continue

                    job = {
                        'title': title,
                        'location': location_elem.text.strip() if location_elem else 'Various',
                        'id': hashlib.md5(f"{company}-{title}".encode()).hexdigest()[:16],
                    }

                    # Hash the job
                    job_hash = self._hash_job(job)
                    current_hashes.add(job_hash)

                    # Check if new or changed
                    if previous_hashes is None or job_hash not in previous_hashes:
                        new_or_changed_jobs.append(job)

                    jobs.append(job)

                except Exception as e:
                    print(f"  Error parsing Workday job: {e}")
                    continue

            if previous_hashes is not None:
                print(f"  {company} (Workday): {len(new_or_changed_jobs)} new/changed out of {len(jobs)} total")

            return new_or_changed_jobs, current_hashes

        except Exception as e:
            print(f"Error fetching Workday jobs for {company}: {e}")
            return [], set()

    def parse_job(self, job: Dict, company: str) -> Dict:
        """Parse Workday job into standard format"""
        return {
            'id': f'workday-{company.lower().replace(" ", "-")}-{job["id"]}',
            'company_name': company,
            'position_title': job['title'],
            'description': f'{job["title"]} at {company}',
            'job_type': 'Software Engineering',
            'location': job['location'],
            'eligible_years': ['Sophomore', 'Junior', 'Senior'],
            'posted_date': datetime.utcnow().isoformat(),
            'application_url': '',
            'is_active': True,
            'source': 'workday',
        }


# Pre-configured company lists for major tech companies
GREENHOUSE_COMPANIES = [
    'meta',
    'stripe',
    'airbnb',
    'reddit',
    'ramp',
    'figma',
]

LEVER_COMPANIES = [
    'netflix',
    'twitch',
    'robinhood',
    'plaid',
    'scale',
]


# Example usage
if __name__ == '__main__':
    from datetime import timedelta

    # Greenhouse example
    gh_scraper = GreenhouseScraper(GREENHOUSE_COMPANIES)

    # Get all jobs updated in last 7 days
    since = datetime.utcnow() - timedelta(days=7)
    jobs = gh_scraper.scrape_all_boards(since=since)
    print(f"Found {len(jobs)} Greenhouse jobs updated since {since}")

    # Lever example
    lever_scraper = LeverScraper(LEVER_COMPANIES)
    jobs = lever_scraper.scrape_all_boards(since=since)
    print(f"Found {len(jobs)} Lever jobs updated since {since}")
