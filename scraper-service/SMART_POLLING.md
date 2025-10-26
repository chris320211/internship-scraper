# Smart Polling System

## Overview

The smart polling system implements efficient, adaptive scraping with:

1. **Conditional Requests** (ETag/Last-Modified headers)
2. **Adaptive Polling Intervals** based on change frequency
3. **Delta Detection** for API sources with timestamps
4. **Content Hashing** for HTML sources

This reduces bandwidth, API costs, and processing time while keeping data fresh.

---

## Architecture

### 1. Conditional Requests (Pull Optimization)

For HTTP/HTML sources that don't expose webhooks:

```python
# Before: Always fetch full content
response = requests.get(url)

# After: Use conditional requests
headers = {}
if etag:
    headers['If-None-Match'] = etag
if last_modified:
    headers['If-Modified-Since'] = last_modified

response = requests.get(url, headers=headers)

if response.status_code == 304:
    # Not modified, skip processing
    return cached_content
```

**Benefits:**
- 304 responses are tiny (no body)
- Server doesn't process unchanged content
- Saves bandwidth and processing time

**Implementation:** [`smart_polling.py::fetch_with_conditional_request()`](./smart_polling.py)

---

### 2. Adaptive Polling Schedule

Automatically adjusts polling frequency based on observed change patterns:

```
High-churn sources (e.g., Greenhouse):
  - Detect change → poll every 5-10 min for next hour
  - 3+ unchanged polls → backoff to 60-90 min

Low-churn sources (e.g., static HTML):
  - No changes for 3 polls → increase interval by 50%
  - Content changed → decrease interval by 50%

Bounds:
  - Minimum: 5 minutes (high activity)
  - Maximum: 360 minutes / 6 hours (low activity)
```

**Example timeline:**

```
Poll 1: Content changed → interval = 15 min
Poll 2: Content changed → interval = 8 min (decreased)
Poll 3: No change → interval = 8 min (wait)
Poll 4: No change → interval = 8 min (wait)
Poll 5: No change → interval = 12 min (increased - backoff)
Poll 6: No change → interval = 18 min (increased - backoff)
...
Poll N: Content changed → interval = 9 min (decreased - ramp up)
```

**Implementation:** [`smart_polling.py::adjust_polling_interval()`](./smart_polling.py)

---

### 3. Delta-Friendly Sources

#### a) Greenhouse

Greenhouse APIs provide `updated_at` timestamps per job:

```python
# Fetch only jobs updated in last 7 days
since = datetime.utcnow() - timedelta(days=7)
jobs = greenhouse_scraper.fetch_jobs('meta', since=since)

# Only upsert changed rows in database
for job in jobs:
    if job['updated_at'] > last_sync:
        upsert_job(job)
```

**Configured companies:** Meta, Stripe, Airbnb, Reddit, Ramp, Figma

**Implementation:** [`delta_scrapers.py::GreenhouseScraper`](./delta_scrapers.py)

#### b) Lever

Lever APIs include `createdAt` and `updatedAt` timestamps:

```python
# Fetch jobs with delta filter
since = datetime.utcnow() - timedelta(days=7)
jobs = lever_scraper.fetch_jobs('netflix', since=since)
```

**Configured companies:** Netflix, Twitch, Robinhood, Plaid, Scale

**Implementation:** [`delta_scrapers.py::LeverScraper`](./delta_scrapers.py)

#### c) HTML Sources (Workday, SmartRecruiters)

For sources without timestamps, use content hashing:

```python
# Compute hash of normalized job listings
current_hash = sha256(json.dumps(sorted(jobs), sort_keys=True))

# Compare with previous hash
if current_hash != previous_hash:
    # Content changed, process updates
    process_jobs(jobs)
    save_hash(current_hash)
else:
    # Skip identical content
    pass
```

**Implementation:** [`delta_scrapers.py::WorkdayScraper`](./delta_scrapers.py)

---

## Database Schema

### Polling Metadata Table

Tracks caching headers and polling statistics:

```sql
CREATE TABLE source_polling_metadata (
    id SERIAL PRIMARY KEY,
    source_url TEXT NOT NULL UNIQUE,
    source_name TEXT NOT NULL,

    -- HTTP caching headers
    etag TEXT,
    last_modified TEXT,

    -- Polling statistics
    last_poll_at TIMESTAMP WITH TIME ZONE,
    last_change_at TIMESTAMP WITH TIME ZONE,
    consecutive_unchanged_polls INTEGER DEFAULT 0,
    total_polls INTEGER DEFAULT 0,
    total_changes INTEGER DEFAULT 0,

    -- Adaptive polling schedule
    current_poll_interval_minutes INTEGER DEFAULT 30,
    min_poll_interval_minutes INTEGER DEFAULT 5,
    max_poll_interval_minutes INTEGER DEFAULT 360,

    -- Response metadata
    last_status_code INTEGER,
    last_response_time_ms INTEGER,

    -- Content tracking
    content_hash TEXT,
    last_job_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Schema file:** [`database/schema.sql`](../database/schema.sql)

---

## Usage Examples

### Example 1: Basic Smart Polling

```python
from smart_polling import SmartPollingManager

manager = SmartPollingManager()
source_url = "https://www.levels.fyi/internships/"
source_name = "Levels.fyi"

# Check if we should poll
if manager.should_poll_source(source_url, source_name):
    # Fetch with conditional request
    content, status, headers = manager.fetch_with_conditional_request(
        source_url, source_name
    )

    if status == 304:
        print("Not modified, using cache")
    else:
        # Process content
        jobs = parse_jobs(content)

        # Detect changes
        has_changed = manager.detect_content_delta(
            source_url, source_name, jobs
        )

        # Adjust interval
        new_interval = manager.adjust_polling_interval(
            source_url, source_name, has_changed
        )
```

### Example 2: Delta-Friendly API (Greenhouse)

```python
from delta_scrapers import GreenhouseScraper
from datetime import datetime, timedelta

scraper = GreenhouseScraper(['meta', 'stripe', 'airbnb'])

# Only fetch jobs updated in last 7 days
since = datetime.utcnow() - timedelta(days=7)
jobs = scraper.scrape_all_boards(since=since)

print(f"Found {len(jobs)} updated internships")
```

### Example 3: Integrated Scraping

```python
from scrapers import scrape_all_sources

# This automatically uses:
# - Conditional requests for Levels.fyi
# - Delta detection for Greenhouse & Lever
# - Adaptive intervals for all sources
jobs = scrape_all_sources()
```

---

## Performance Benefits

### Before (Naive Polling)

```
Every scrape:
- Fetch full HTML/JSON (100KB - 5MB)
- Parse entire response
- Compare all jobs
- Update database

Cost per hour (polling every 30 min):
- Bandwidth: ~10MB
- CPU: ~5 seconds parsing
- Database writes: 1000+ rows
```

### After (Smart Polling)

```
First scrape:
- Fetch full content
- Save ETag/Last-Modified
- Compute content hash

Subsequent scrapes (304 Not Modified):
- Fetch: 200 bytes (304 response)
- Parsing: 0 seconds (skip)
- Database: 0 writes

Changed content:
- Fetch: Full content (rare)
- Parse: Only changed jobs
- Database: Only upsert changed rows

Cost per hour (adaptive):
- Bandwidth: ~500KB (95% reduction)
- CPU: ~0.5 seconds (90% reduction)
- Database writes: ~50 rows (95% reduction)
```

---

## Configuration

### Environment Variables

```bash
# Polling intervals (minutes)
POLLING_MIN_INTERVAL=5
POLLING_DEFAULT_INTERVAL=30
POLLING_MAX_INTERVAL=360

# Backoff threshold (consecutive unchanged polls before increasing interval)
POLLING_BACKOFF_THRESHOLD=3

# Delta window (days to look back for Greenhouse/Lever)
DELTA_WINDOW_DAYS=7
```

### Source-Specific Settings

Configure polling intervals per source in the database:

```sql
UPDATE source_polling_metadata
SET min_poll_interval_minutes = 10,
    max_poll_interval_minutes = 180
WHERE source_name = 'Levels.fyi';
```

---

## Monitoring

### Polling Statistics

```python
stats = manager.get_polling_stats(source_url, source_name)
print(f"""
Source: {stats['source_name']}
Total polls: {stats['total_polls']}
Changes detected: {stats['total_changes']}
Change rate: {stats['change_rate']:.2%}
Current interval: {stats['current_poll_interval_minutes']} min
Last poll: {stats['last_poll_at']}
Last change: {stats['last_change_at']}
""")
```

### Dashboard Metrics

Track these metrics:

- **304 rate:** % of requests returning 304 Not Modified
- **Change detection rate:** % of polls detecting changes
- **Average interval:** Mean polling interval across sources
- **Bandwidth savings:** Bytes saved via 304 responses
- **Processing time savings:** Seconds saved by skipping parsing

---

## GitHub Webhook Integration (Future)

For GitHub-based sources, replace polling with webhooks:

```python
# Instead of polling GitHub repos every 30 min
# Set up webhook to notify on new commits to README

@app.route('/webhook/github', methods=['POST'])
def github_webhook():
    # Verify signature
    # Parse push event
    # Trigger immediate scrape of changed repo
    pass
```

**Benefits:**
- Near-instant updates (seconds vs minutes)
- Zero polling overhead
- No missed changes

---

## Best Practices

1. **Set appropriate bounds:** Don't poll too frequently (respect rate limits) or too infrequently (stale data)

2. **Monitor 304 rates:** High 304 rates indicate stable sources that can have longer intervals

3. **Use delta APIs when available:** Always prefer `updated_at` filtering over full fetches

4. **Hash content strategically:** Only hash fields that matter (title, company, URL) not metadata (timestamps)

5. **Combine with webhooks:** Use webhooks where available, fall back to smart polling

6. **Graceful degradation:** If conditional requests fail, fall back to regular fetch

---

## Troubleshooting

### High bandwidth despite smart polling

**Check:**
- Are ETag/Last-Modified headers being saved?
- Is content hash working correctly?
- Are intervals too short?

### Stale data

**Check:**
- Are 304 responses being incorrectly cached?
- Is the interval too long?
- Is the backoff too aggressive?

### Excessive database writes

**Check:**
- Is delta detection working?
- Are jobs being compared correctly?
- Is the updated_at field being used?

---

## References

- [HTTP Conditional Requests (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Conditional_requests)
- [Greenhouse API Docs](https://developers.greenhouse.io/job-board.html)
- [Lever API Docs](https://github.com/lever/postings-api)
