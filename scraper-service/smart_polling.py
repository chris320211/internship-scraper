"""
Smart polling manager with conditional requests, adaptive scheduling, and delta detection
"""
import hashlib
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import requests
from dataclasses import dataclass


@dataclass
class PollingMetadata:
    """Metadata for a polling source"""
    source_url: str
    source_name: str
    etag: Optional[str] = None
    last_modified: Optional[str] = None
    last_poll_at: Optional[datetime] = None
    last_change_at: Optional[datetime] = None
    consecutive_unchanged_polls: int = 0
    total_polls: int = 0
    total_changes: int = 0
    current_poll_interval_minutes: int = 30
    min_poll_interval_minutes: int = 5
    max_poll_interval_minutes: int = 360
    last_status_code: Optional[int] = None
    last_response_time_ms: Optional[int] = None
    content_hash: Optional[str] = None
    last_job_count: int = 0


class SmartPollingManager:
    """
    Manages smart polling with:
    - Conditional requests (ETag/Last-Modified)
    - Adaptive polling intervals
    - Delta detection via content hashing
    """

    def __init__(self, db_connection=None):
        """
        Initialize smart polling manager

        Args:
            db_connection: Optional database connection for persisting metadata
        """
        self.db = db_connection
        self.cache: Dict[str, PollingMetadata] = {}

    def _compute_content_hash(self, content: str) -> str:
        """Compute SHA256 hash of normalized content"""
        # Normalize content (remove whitespace variations)
        normalized = ''.join(content.split())
        return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

    def _compute_jobs_hash(self, jobs: List[Dict]) -> str:
        """Compute hash of job listings for delta detection"""
        # Sort jobs by ID and serialize to ensure consistent hashing
        sorted_jobs = sorted(jobs, key=lambda j: j.get('id', ''))
        # Only hash relevant fields that indicate actual changes
        job_fingerprints = [
            {
                'id': j.get('id'),
                'title': j.get('position_title'),
                'company': j.get('company_name'),
                'url': j.get('application_url'),
                'updated_at': j.get('updated_at'),  # For sources that provide this
            }
            for j in sorted_jobs
        ]
        content = json.dumps(job_fingerprints, sort_keys=True)
        return hashlib.sha256(content.encode('utf-8')).hexdigest()

    def should_poll_source(self, source_url: str, source_name: str) -> bool:
        """
        Determine if a source should be polled now based on adaptive schedule

        Returns:
            True if source should be polled, False otherwise
        """
        metadata = self._get_metadata(source_url, source_name)

        if not metadata.last_poll_at:
            # Never polled before, should poll
            return True

        # Calculate time since last poll
        time_since_poll = datetime.utcnow() - metadata.last_poll_at
        poll_interval = timedelta(minutes=metadata.current_poll_interval_minutes)

        return time_since_poll >= poll_interval

    def fetch_with_conditional_request(
        self,
        source_url: str,
        source_name: str,
        timeout: int = 30
    ) -> Tuple[Optional[str], int, Dict]:
        """
        Fetch URL with conditional request headers (ETag/Last-Modified)

        Args:
            source_url: URL to fetch
            source_name: Name of the source
            timeout: Request timeout in seconds

        Returns:
            Tuple of (content, status_code, headers)
            - content is None if 304 Not Modified
            - status_code is HTTP status
            - headers contains response headers
        """
        metadata = self._get_metadata(source_url, source_name)

        # Build conditional request headers
        headers = {
            'User-Agent': 'Mozilla/5.0 (compatible; InternshipScraper/1.0)',
        }

        if metadata.etag:
            headers['If-None-Match'] = metadata.etag

        if metadata.last_modified:
            headers['If-Modified-Since'] = metadata.last_modified

        # Make request and track timing
        start_time = time.time()
        try:
            response = requests.get(source_url, headers=headers, timeout=timeout)
            response_time_ms = int((time.time() - start_time) * 1000)

            # Extract caching headers
            new_etag = response.headers.get('ETag')
            new_last_modified = response.headers.get('Last-Modified')

            # Update metadata
            self._update_poll_metadata(
                source_url,
                source_name,
                status_code=response.status_code,
                response_time_ms=response_time_ms,
                etag=new_etag,
                last_modified=new_last_modified,
                content_changed=(response.status_code != 304)
            )

            if response.status_code == 304:
                # Not modified, return None content
                print(f"  ✓ {source_name}: 304 Not Modified (cached)")
                return None, 304, dict(response.headers)

            response.raise_for_status()
            return response.text, response.status_code, dict(response.headers)

        except requests.RequestException as e:
            response_time_ms = int((time.time() - start_time) * 1000)
            print(f"  ✗ {source_name}: Request failed - {e}")
            self._update_poll_metadata(
                source_url,
                source_name,
                status_code=0,
                response_time_ms=response_time_ms,
                content_changed=False
            )
            raise

    def detect_content_delta(
        self,
        source_url: str,
        source_name: str,
        jobs: List[Dict]
    ) -> bool:
        """
        Detect if job listings have changed since last poll using content hashing

        Args:
            source_url: Source URL
            source_name: Source name
            jobs: List of job dictionaries

        Returns:
            True if content changed, False otherwise
        """
        metadata = self._get_metadata(source_url, source_name)

        # Compute current hash
        current_hash = self._compute_jobs_hash(jobs)

        # Compare with previous hash
        if metadata.content_hash is None:
            # First time, consider it changed
            has_changed = True
        else:
            has_changed = (current_hash != metadata.content_hash)

        # Update metadata with new hash
        metadata.content_hash = current_hash
        metadata.last_job_count = len(jobs)

        if has_changed:
            metadata.last_change_at = datetime.utcnow()
            metadata.total_changes += 1
            metadata.consecutive_unchanged_polls = 0
            print(f"  ✓ {source_name}: Content changed ({len(jobs)} jobs)")
        else:
            metadata.consecutive_unchanged_polls += 1
            print(f"  → {source_name}: No content changes ({metadata.consecutive_unchanged_polls} unchanged polls)")

        self._save_metadata(metadata)
        return has_changed

    def adjust_polling_interval(
        self,
        source_url: str,
        source_name: str,
        content_changed: bool
    ) -> int:
        """
        Adjust polling interval based on change frequency (adaptive schedule)

        Strategy:
        - If content changed: decrease interval (poll more frequently)
        - If unchanged for 3+ polls: increase interval (backoff)
        - Respect min/max bounds

        Args:
            source_url: Source URL
            source_name: Source name
            content_changed: Whether content changed in last poll

        Returns:
            New polling interval in minutes
        """
        metadata = self._get_metadata(source_url, source_name)

        current_interval = metadata.current_poll_interval_minutes

        if content_changed:
            # Content changed - poll more frequently
            # Decrease interval by 50%, but respect minimum
            new_interval = max(
                metadata.min_poll_interval_minutes,
                int(current_interval * 0.5)
            )
            if new_interval != current_interval:
                print(f"  ↓ {source_name}: Increasing poll frequency to every {new_interval} min")
        else:
            # No change - consider backing off
            if metadata.consecutive_unchanged_polls >= 3:
                # Increase interval by 50%, but respect maximum
                new_interval = min(
                    metadata.max_poll_interval_minutes,
                    int(current_interval * 1.5)
                )
                if new_interval != current_interval:
                    print(f"  ↑ {source_name}: Decreasing poll frequency to every {new_interval} min")
            else:
                new_interval = current_interval

        metadata.current_poll_interval_minutes = new_interval
        self._save_metadata(metadata)

        return new_interval

    def get_polling_stats(self, source_url: str, source_name: str) -> Dict:
        """Get polling statistics for a source"""
        metadata = self._get_metadata(source_url, source_name)

        return {
            'source_name': source_name,
            'source_url': source_url,
            'total_polls': metadata.total_polls,
            'total_changes': metadata.total_changes,
            'change_rate': (
                metadata.total_changes / metadata.total_polls
                if metadata.total_polls > 0 else 0
            ),
            'consecutive_unchanged_polls': metadata.consecutive_unchanged_polls,
            'current_poll_interval_minutes': metadata.current_poll_interval_minutes,
            'last_poll_at': metadata.last_poll_at.isoformat() if metadata.last_poll_at else None,
            'last_change_at': metadata.last_change_at.isoformat() if metadata.last_change_at else None,
            'last_job_count': metadata.last_job_count,
            'last_status_code': metadata.last_status_code,
            'last_response_time_ms': metadata.last_response_time_ms,
        }

    def _get_metadata(self, source_url: str, source_name: str) -> PollingMetadata:
        """Get or create metadata for a source"""
        if source_url in self.cache:
            return self.cache[source_url]

        # Try to load from database if available
        if self.db:
            metadata = self._load_from_db(source_url, source_name)
            if metadata:
                self.cache[source_url] = metadata
                return metadata

        # Create new metadata
        metadata = PollingMetadata(
            source_url=source_url,
            source_name=source_name
        )
        self.cache[source_url] = metadata
        return metadata

    def _update_poll_metadata(
        self,
        source_url: str,
        source_name: str,
        status_code: int,
        response_time_ms: int,
        etag: Optional[str] = None,
        last_modified: Optional[str] = None,
        content_changed: bool = True
    ):
        """Update polling metadata after a poll"""
        metadata = self._get_metadata(source_url, source_name)

        metadata.last_poll_at = datetime.utcnow()
        metadata.total_polls += 1
        metadata.last_status_code = status_code
        metadata.last_response_time_ms = response_time_ms

        if etag:
            metadata.etag = etag
        if last_modified:
            metadata.last_modified = last_modified

        self._save_metadata(metadata)

    def _save_metadata(self, metadata: PollingMetadata):
        """Persist metadata to database if available"""
        self.cache[metadata.source_url] = metadata

        if not self.db:
            return

        # TODO: Save to database
        # This will be implemented when we integrate with the database connection
        pass

    def _load_from_db(self, source_url: str, source_name: str) -> Optional[PollingMetadata]:
        """Load metadata from database"""
        if not self.db:
            return None

        # TODO: Load from database
        # This will be implemented when we integrate with the database connection
        return None


# Example usage:
if __name__ == '__main__':
    manager = SmartPollingManager()

    # Example: Fetch with conditional request
    source_url = "https://www.levels.fyi/internships/"
    source_name = "Levels.fyi"

    if manager.should_poll_source(source_url, source_name):
        try:
            content, status, headers = manager.fetch_with_conditional_request(
                source_url,
                source_name
            )

            if status == 304:
                print("Content not modified, skipping processing")
            else:
                print(f"Got {len(content)} bytes of content")
                # Process content here...

                # After processing, detect delta
                jobs = []  # Your parsed jobs
                has_changed = manager.detect_content_delta(source_url, source_name, jobs)

                # Adjust polling interval
                new_interval = manager.adjust_polling_interval(source_url, source_name, has_changed)

        except Exception as e:
            print(f"Error: {e}")

    # Get stats
    stats = manager.get_polling_stats(source_url, source_name)
    print(json.dumps(stats, indent=2))
