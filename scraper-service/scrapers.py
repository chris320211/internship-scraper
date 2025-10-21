"""
Web scrapers for various internship sources using Scrapling
"""
from scrapling.fetchers import Fetcher, StealthyFetcher
from typing import List, Dict, Optional
import os
import re
from datetime import datetime, date
from urllib.parse import urljoin, urlparse
from html import unescape
from dateutil import parser as date_parser
import requests

DATE_KEYWORDS = re.compile(
    r'(deadline|apply by|apply before|applications? (?:due|close|deadline)|'
    r'application deadline|closes on|closing date|apply no later than)',
    re.IGNORECASE
)

DATE_PATTERNS = [
    re.compile(r'\b\d{1,2}/\d{1,2}/\d{2,4}\b'),
    re.compile(r'\b\d{4}-\d{1,2}-\d{1,2}\b'),
    re.compile(
        r'\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|'
        r'jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|'
        r'dec(?:ember)?)[\s\.]+\d{1,2}(?:st|nd|rd|th)?(?:,\s*\d{4})?\b',
        re.IGNORECASE
    ),
]

JOB_TYPE_PATTERNS = [
    (
        'Machine Learning',
        [
            re.compile(r'machine learning', re.IGNORECASE),
            re.compile(r'\bml\b', re.IGNORECASE),
            re.compile(r'deep learning', re.IGNORECASE),
            re.compile(r'computer vision', re.IGNORECASE),
            re.compile(r'artificial intelligence', re.IGNORECASE),
        ],
    ),
    (
        'Data Science',
        [
            re.compile(r'data science', re.IGNORECASE),
            re.compile(r'data scientist', re.IGNORECASE),
            re.compile(r'data analytics', re.IGNORECASE),
            re.compile(r'data analyst', re.IGNORECASE),
            re.compile(r'business intelligence', re.IGNORECASE),
        ],
    ),
    (
        'Data Engineering',
        [
            re.compile(r'data engineer', re.IGNORECASE),
            re.compile(r'data platform', re.IGNORECASE),
            re.compile(r'analytics engineer', re.IGNORECASE),
            re.compile(r'data pipeline', re.IGNORECASE),
        ],
    ),
    (
        'Quantitative Finance',
        [
            re.compile(r'quantitative', re.IGNORECASE),
            re.compile(r'\bquant\b', re.IGNORECASE),
            re.compile(r'algorithmic trading', re.IGNORECASE),
            re.compile(r'trading analyst', re.IGNORECASE),
            re.compile(r'derivatives', re.IGNORECASE),
        ],
    ),
    (
        'Research',
        [
            re.compile(r'research scientist', re.IGNORECASE),
            re.compile(r'research engineer', re.IGNORECASE),
            re.compile(r'research internship', re.IGNORECASE),
            re.compile(r'r&d', re.IGNORECASE),
        ],
    ),
    (
        'Full Stack Development',
        [
            re.compile(r'full[-\s]?stack', re.IGNORECASE),
            re.compile(r'fullstack', re.IGNORECASE),
        ],
    ),
    (
        'Frontend Development',
        [
            re.compile(r'front[-\s]?end', re.IGNORECASE),
            re.compile(r'frontend', re.IGNORECASE),
            re.compile(r'web developer', re.IGNORECASE),
            re.compile(r'ui engineer', re.IGNORECASE),
        ],
    ),
    (
        'Backend Development',
        [
            re.compile(r'back[-\s]?end', re.IGNORECASE),
            re.compile(r'backend', re.IGNORECASE),
            re.compile(r'api developer', re.IGNORECASE),
            re.compile(r'platform engineer', re.IGNORECASE),
        ],
    ),
    (
        'Software Engineering',
        [
            re.compile(r'software engineer', re.IGNORECASE),
            re.compile(r'software developer', re.IGNORECASE),
            re.compile(r'software engineering', re.IGNORECASE),
            re.compile(r'\bswe\b', re.IGNORECASE),
        ],
    ),
    (
        'Mobile Development',
        [
            re.compile(r'mobile', re.IGNORECASE),
            re.compile(r'\bios\b', re.IGNORECASE),
            re.compile(r'android', re.IGNORECASE),
            re.compile(r'react native', re.IGNORECASE),
            re.compile(r'swift', re.IGNORECASE),
            re.compile(r'kotlin', re.IGNORECASE),
        ],
    ),
    (
        'Security Engineering',
        [
            re.compile(r'security engineer', re.IGNORECASE),
            re.compile(r'cybersecurity', re.IGNORECASE),
            re.compile(r'information security', re.IGNORECASE),
            re.compile(r'appsec', re.IGNORECASE),
        ],
    ),
    (
        'DevOps',
        [
            re.compile(r'devops', re.IGNORECASE),
            re.compile(r'site reliability', re.IGNORECASE),
            re.compile(r'\bsre\b', re.IGNORECASE),
            re.compile(r'infrastructure', re.IGNORECASE),
            re.compile(r'cloud engineer', re.IGNORECASE),
            re.compile(r'platform reliability', re.IGNORECASE),
        ],
    ),
    (
        'Quality Assurance',
        [
            re.compile(r'\bqa\b', re.IGNORECASE),
            re.compile(r'quality assurance', re.IGNORECASE),
            re.compile(r'test engineer', re.IGNORECASE),
            re.compile(r'testing engineer', re.IGNORECASE),
            re.compile(r'automation engineer', re.IGNORECASE),
        ],
    ),
    (
        'Hardware Engineering',
        [
            re.compile(r'hardware engineer', re.IGNORECASE),
            re.compile(r'electrical engineer', re.IGNORECASE),
            re.compile(r'electronics engineer', re.IGNORECASE),
            re.compile(r'asic', re.IGNORECASE),
            re.compile(r'fpga', re.IGNORECASE),
            re.compile(r'semiconductor', re.IGNORECASE),
        ],
    ),
    (
        'Embedded Systems',
        [
            re.compile(r'embedded engineer', re.IGNORECASE),
            re.compile(r'embedded systems', re.IGNORECASE),
            re.compile(r'firmware', re.IGNORECASE),
            re.compile(r'\biot\b', re.IGNORECASE),
            re.compile(r'real-time systems', re.IGNORECASE),
        ],
    ),
    (
        'Robotics',
        [
            re.compile(r'robotics', re.IGNORECASE),
            re.compile(r'robotic engineer', re.IGNORECASE),
            re.compile(r'autonomous systems', re.IGNORECASE),
            re.compile(r'mechatronics', re.IGNORECASE),
        ],
    ),
    (
        'Product Management',
        [
            re.compile(r'product manager', re.IGNORECASE),
            re.compile(r'product management', re.IGNORECASE),
            re.compile(r'product strategy', re.IGNORECASE),
        ],
    ),
    (
        'UI/UX Design',
        [
            re.compile(r'user experience', re.IGNORECASE),
            re.compile(r'user interface', re.IGNORECASE),
            re.compile(r'ux design', re.IGNORECASE),
            re.compile(r'ui design', re.IGNORECASE),
            re.compile(r'product design', re.IGNORECASE),
            re.compile(r'interaction design', re.IGNORECASE),
        ],
    ),
]

def _parse_date_string(raw_value: str) -> Optional[str]:
    """Attempt to parse a string into ISO date format."""
    try:
        parsed = date_parser.parse(
            raw_value,
            fuzzy=True,
            default=datetime(datetime.utcnow().year, 1, 1)
        )
        parsed_date = parsed.date()

        # If parser defaulted to year 1900, skip
        if parsed.year == 1900:
            return None

        # Normalize to future if date already passed this year but no year provided
        today = datetime.utcnow().date()
        if parsed.year == today.year and parsed_date < today:
            try:
                parsed_date = date(
                    today.year + 1,
                    parsed_date.month,
                    parsed_date.day
                )
            except ValueError:
                # Handle February 29 on non-leap year by skipping
                return None

        return parsed_date.isoformat()
    except (ValueError, OverflowError):
        return None


def extract_application_deadline(*candidates: Optional[str]) -> Optional[str]:
    """Extract application deadline from iterable text snippets."""
    for raw in candidates:
        if not raw:
            continue

        text = unescape(raw).strip()
        if not text:
            continue

        # Direct parsing if the entire string looks like a date
        direct = _parse_date_string(text)
        if direct:
            return direct

        if not DATE_KEYWORDS.search(text):
            # Check generic date patterns even without keywords
            segments = []
            for pattern in DATE_PATTERNS:
                segments.extend(pattern.findall(text))
        else:
            segments = [text]

        for segment in segments:
            parsed = _parse_date_string(segment if isinstance(segment, str) else segment[0])
            if parsed:
                return parsed

    return None


class InternshipScraper:
    """Base class for internship scrapers"""

    def __init__(self):
        self.internships = []

    def is_internship(self, title: str, description: str = "") -> bool:
        """Check if a job posting is an internship"""
        text = f"{title} {description}".lower()
        keywords = ['intern', 'internship', 'co-op', 'coop', 'summer program', 'summer 2025', 'summer 2026']
        return any(keyword in text for keyword in keywords)

    def categorize_job_type(self, title: str, description: str = "") -> str:
        """Categorize job type from title and optional description"""
        text = f"{title or ''} {description or ''}"

        for label, patterns in JOB_TYPE_PATTERNS:
            if any(pattern.search(text) for pattern in patterns):
                return label

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

                    timeline_text = ''
                    posted_elem = card.css_first('time')
                    if posted_elem:
                        timeline_text = posted_elem.text.strip()

                    deadline = extract_application_deadline(
                        timeline_text,
                        card.text
                    )

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
                            'application_deadline': deadline,
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

                    deadline = extract_application_deadline(
                        card.text,
                        link_elem.attrs.get('title', '') if link_elem else ''
                    )

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
                            'application_deadline': deadline,
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

                    deadline_candidates = []
                    if len(cells) > 3:
                        deadline_candidates.append(cells[3].text.strip())
                    if len(cells) > 4:
                        deadline_candidates.append(cells[4].text.strip())
                    deadline = extract_application_deadline(*deadline_candidates)

                    jobs.append({
                        'id': f'levels-{hash(f"{company}-{title}")}',
                        'company_name': company,
                        'position_title': title,
                        'description': f'{title} internship at {company}',
                        'job_type': self.categorize_job_type(title),
                        'location': location,
                        'eligible_years': ['Sophomore', 'Junior', 'Senior'],
                        'posted_date': datetime.now().isoformat(),
                        'application_deadline': deadline,
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

                    deadline_candidates = []
                    if len(cells) > 3:
                        deadline_candidates.append(cells[3].text.strip())
                    if len(cells) > 4:
                        deadline_candidates.append(cells[4].text.strip())
                    deadline = extract_application_deadline(*deadline_candidates, role, company)

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
                            'application_deadline': deadline,
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


class SerpApiLinkedInScraper(InternshipScraper):
    """Fetch LinkedIn internships via SerpApi"""

    API_ENDPOINT = "https://serpapi.com/search.json"

    def __init__(self):
        super().__init__()
        self.api_key = os.environ.get("SERPAPI_API_KEY") or os.environ.get("SERPAPI_KEY")

    def _build_application_url(self, job: Dict) -> str:
        if link := job.get("link"):
            return link
        if job_id := job.get("job_id"):
            return f"https://www.linkedin.com/jobs/view/{job_id}"
        return ""

    def _normalize_posted_date(self, job: Dict) -> str:
        detected = job.get("detected_extensions") or {}
        posted_text = detected.get("posted_at") or detected.get("posted_at_date")
        parsed = _parse_date_string(posted_text) if posted_text else None
        if parsed:
            return f"{parsed}T00:00:00Z"
        return datetime.utcnow().isoformat()

    def scrape(self, keywords: str = "software engineering intern") -> List[Dict]:
        """Invoke SerpApi LinkedIn engine to gather internships"""
        if not self.api_key:
            print("SerpApi key not configured, skipping LinkedIn scraper")
            return []

        params = {
            "engine": "linkedin_jobs",
            "q": keywords,
            "api_key": self.api_key,
            "remote": "false",
        }

        try:
            response = requests.get(self.API_ENDPOINT, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as exc:
            print(f"Error contacting SerpApi: {exc}")
            return []
        except ValueError:
            print("Unable to decode SerpApi response as JSON")
            return []

        results = data.get("jobs_results") or []
        jobs = []

        for job in results:
            title = job.get("title", "Internship").strip()
            company = job.get("company_name") or job.get("company") or "Unknown Company"
            description = job.get("description") or job.get("snippet") or ""

            if not self.is_internship(title, description):
                continue

            application_url = self._build_application_url(job)
            if not application_url:
                continue

            deadline = extract_application_deadline(
                job.get("description"),
                job.get("snippet"),
                *(job.get("extensions") or []),
                *(job.get("detected_extensions") or {}).values(),
            )

            job_id = job.get("job_id") or hash(f"{company}-{title}-{application_url}")

            jobs.append({
                "id": f"linkedin-serpapi-{job_id}",
                "company_name": company,
                "position_title": title,
                "description": description if description else f"Internship opportunity at {company}",
                "job_type": self.categorize_job_type(title),
                "location": job.get("location") or job.get("city") or "Various",
                "eligible_years": ["Sophomore", "Junior", "Senior", "Graduate"],
                "posted_date": self._normalize_posted_date(job),
                "application_deadline": deadline,
                "application_url": application_url,
                "is_active": True,
                "source": "LinkedIn (SerpApi)",
            })

        return jobs


def scrape_all_sources(keywords: str = "software engineering intern") -> List[Dict]:
    """Scrape all sources and combine results"""
    all_jobs = []

    scrapers = [
        # IndeedScraper(),
        LevelsFyiScraper(),
        SimplifyScraper(),
        SerpApiLinkedInScraper(),
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
