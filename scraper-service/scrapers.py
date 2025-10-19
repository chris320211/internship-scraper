"""
Web scrapers for various internship sources using Scrapling
"""
from scrapling.fetchers import Fetcher, StealthyFetcher
from typing import List, Dict, Optional
import re
from datetime import datetime
from urllib.parse import urljoin, urlparse


class InternshipScraper:
    """Base class for internship scrapers"""

    def __init__(self):
        self.internships = []

    def is_internship(self, title: str, description: str = "") -> bool:
        """Check if a job posting is an internship"""
        text = f"{title} {description}".lower()
        keywords = ['intern', 'internship', 'co-op', 'coop', 'summer program', 'summer 2025', 'summer 2026']
        return any(keyword in text for keyword in keywords)

    def categorize_job_type(self, title: str) -> str:
        """Categorize job type from title"""
        title_lower = title.lower()

        if 'software' in title_lower or 'swe' in title_lower or 'engineer' in title_lower:
            return 'Software Engineering'
        elif 'data scien' in title_lower:
            return 'Data Science'
        elif 'machine learning' in title_lower or 'ml ' in title_lower:
            return 'Machine Learning'
        elif 'product manage' in title_lower or 'pm ' in title_lower:
            return 'Product Management'
        elif 'mobile' in title_lower or 'ios' in title_lower or 'android' in title_lower:
            return 'Mobile Development'
        elif 'security' in title_lower or 'cybersecurity' in title_lower:
            return 'Security Engineering'
        elif 'devops' in title_lower or 'sre' in title_lower:
            return 'DevOps'
        elif 'design' in title_lower or 'ui' in title_lower or 'ux' in title_lower:
            return 'UI/UX Design'

        return 'Other'

    def scrape(self) -> List[Dict]:
        """Override this method in subclasses"""
        raise NotImplementedError


class LinkedInScraper(InternshipScraper):
    """Scrape LinkedIn job postings"""

    def scrape(self, keywords: str = "software engineering intern") -> List[Dict]:
        """Scrape LinkedIn for internships"""
        try:
            # LinkedIn search URL for internships
            search_url = f"https://www.linkedin.com/jobs/search?keywords={keywords.replace(' ', '%20')}&f_E=1,2"

            # Use StealthyFetcher to avoid detection
            page = StealthyFetcher.fetch(search_url, headless=True, timeout=30)

            jobs = []
            job_cards = page.css('.base-card')[:20]  # Limit to first 20 results

            for card in job_cards:
                try:
                    title_elem = card.css_first('.base-search-card__title')
                    company_elem = card.css_first('.base-search-card__subtitle')
                    location_elem = card.css_first('.job-search-card__location')
                    link_elem = card.css_first('a.base-card__full-link')

                    if not title_elem:
                        continue

                    title = title_elem.text.strip()
                    company = company_elem.text.strip() if company_elem else 'Unknown'
                    location = location_elem.text.strip() if location_elem else 'Remote'
                    url = link_elem.attrs.get('href', '') if link_elem else ''

                    if self.is_internship(title):
                        jobs.append({
                            'id': f'linkedin-{hash(url)}',
                            'company_name': company,
                            'position_title': title,
                            'description': f'Internship opportunity at {company}',
                            'job_type': self.categorize_job_type(title),
                            'location': location,
                            'eligible_years': ['Junior', 'Senior', 'Graduate'],
                            'posted_date': datetime.now().isoformat(),
                            'application_deadline': None,
                            'application_url': url,
                            'is_active': True,
                            'source': 'LinkedIn'
                        })
                except Exception as e:
                    print(f"Error parsing LinkedIn job card: {e}")
                    continue

            return jobs
        except Exception as e:
            print(f"Error scraping LinkedIn: {e}")
            return []


class IndeedScraper(InternshipScraper):
    """Scrape Indeed job postings"""

    def scrape(self, keywords: str = "software engineering intern") -> List[Dict]:
        """Scrape Indeed for internships"""
        try:
            search_url = f"https://www.indeed.com/jobs?q={keywords.replace(' ', '+')}&l=&jt=internship"

            page = Fetcher.get(search_url, timeout=30)

            jobs = []
            job_cards = page.css('.job_seen_beacon')[:20]

            for card in job_cards:
                try:
                    title_elem = card.css_first('h2.jobTitle span')
                    company_elem = card.css_first('[data-testid="company-name"]')
                    location_elem = card.css_first('[data-testid="text-location"]')
                    link_elem = card.css_first('h2.jobTitle a')

                    if not title_elem:
                        continue

                    title = title_elem.text.strip()
                    company = company_elem.text.strip() if company_elem else 'Unknown'
                    location = location_elem.text.strip() if location_elem else 'Remote'

                    job_key = link_elem.attrs.get('data-jk', '') if link_elem else ''
                    url = f"https://www.indeed.com/viewjob?jk={job_key}" if job_key else ''

                    if self.is_internship(title):
                        jobs.append({
                            'id': f'indeed-{job_key}',
                            'company_name': company,
                            'position_title': title,
                            'description': f'Internship opportunity at {company}',
                            'job_type': self.categorize_job_type(title),
                            'location': location,
                            'eligible_years': ['Sophomore', 'Junior', 'Senior', 'Graduate'],
                            'posted_date': datetime.now().isoformat(),
                            'application_deadline': None,
                            'application_url': url,
                            'is_active': True,
                            'source': 'Indeed'
                        })
                except Exception as e:
                    print(f"Error parsing Indeed job card: {e}")
                    continue

            return jobs
        except Exception as e:
            print(f"Error scraping Indeed: {e}")
            return []


class LevelsFyiScraper(InternshipScraper):
    """Scrape Levels.fyi internship postings"""

    def scrape(self) -> List[Dict]:
        """Scrape Levels.fyi for internships"""
        try:
            url = "https://www.levels.fyi/internships/"

            page = Fetcher.get(url, timeout=30)

            jobs = []
            rows = page.css('table tbody tr')[:30]

            for row in rows:
                try:
                    cells = row.css('td')
                    if len(cells) < 3:
                        continue

                    company = cells[0].text.strip()
                    title = cells[1].text.strip()
                    location = cells[2].text.strip() if len(cells) > 2 else 'Various'

                    link_elem = cells[1].css_first('a')
                    url = link_elem.attrs.get('href', '') if link_elem else ''

                    jobs.append({
                        'id': f'levels-{hash(f"{company}-{title}")}',
                        'company_name': company,
                        'position_title': title,
                        'description': f'{title} internship at {company}',
                        'job_type': self.categorize_job_type(title),
                        'location': location,
                        'eligible_years': ['Sophomore', 'Junior', 'Senior'],
                        'posted_date': datetime.now().isoformat(),
                        'application_deadline': None,
                        'application_url': url if url.startswith('http') else f'https://www.levels.fyi{url}',
                        'is_active': True,
                        'source': 'Levels.fyi'
                    })
                except Exception as e:
                    print(f"Error parsing Levels.fyi row: {e}")
                    continue

            return jobs
        except Exception as e:
            print(f"Error scraping Levels.fyi: {e}")
            return []


class SimplifyScraper(InternshipScraper):
    """Scrape Simplify internship listings (GitHub repo)"""

    def scrape(self) -> List[Dict]:
        """Scrape Simplify's curated internship list"""
        try:
            # Simplify maintains a popular GitHub repo with internship listings
            url = "https://github.com/SimplifyJobs/Summer2025-Internships"

            page = Fetcher.get(url, timeout=30)

            jobs = []
            # Look for table rows in the README
            rows = page.css('table tbody tr')[:50]

            for row in rows:
                try:
                    cells = row.css('td')
                    if len(cells) < 2:
                        continue

                    company_elem = cells[0]
                    role_elem = cells[1] if len(cells) > 1 else None
                    location_elem = cells[2] if len(cells) > 2 else None

                    company = company_elem.text.strip()
                    role = role_elem.text.strip() if role_elem else 'Software Engineering Intern'
                    location = location_elem.text.strip() if location_elem else 'Various'

                    # Try to find apply link
                    link_elem = role_elem.css_first('a') if role_elem else company_elem.css_first('a')
                    url = link_elem.attrs.get('href', '') if link_elem else ''

                    if company and role:
                        jobs.append({
                            'id': f'simplify-{hash(f"{company}-{role}")}',
                            'company_name': company,
                            'position_title': role,
                            'description': f'Summer 2025 internship at {company}',
                            'job_type': self.categorize_job_type(role),
                            'location': location,
                            'eligible_years': ['Sophomore', 'Junior', 'Senior', 'Graduate'],
                            'posted_date': datetime.now().isoformat(),
                            'application_deadline': None,
                            'application_url': url,
                            'is_active': True,
                            'source': 'Simplify'
                        })
                except Exception as e:
                    print(f"Error parsing Simplify row: {e}")
                    continue

            return jobs
        except Exception as e:
            print(f"Error scraping Simplify: {e}")
            return []


def scrape_all_sources(keywords: str = "software engineering intern") -> List[Dict]:
    """Scrape all sources and combine results"""
    all_jobs = []

    scrapers = [
        # IndeedScraper(),
        LevelsFyiScraper(),
        SimplifyScraper(),
        # LinkedInScraper(),  # LinkedIn might require auth
    ]

    for scraper in scrapers:
        try:
            print(f"Scraping {scraper.__class__.__name__}...")
            if hasattr(scraper.scrape, '__code__') and scraper.scrape.__code__.co_argcount > 1:
                jobs = scraper.scrape(keywords)
            else:
                jobs = scraper.scrape()
            all_jobs.extend(jobs)
            print(f"Found {len(jobs)} internships from {scraper.__class__.__name__}")
        except Exception as e:
            print(f"Error with {scraper.__class__.__name__}: {e}")
            continue

    return all_jobs
