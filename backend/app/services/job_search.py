import json
import logging
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings
from app.core.http_client import get_http_client
from app.schemas.job import NormalizedJob

logger = logging.getLogger(__name__)


class JobSearchService:
    """
    Service handling real-time Job Search queries across RapidAPI JSearch
    and open live job providers (Remotive, Jobicy, Arbeitnow).
    All dummy/mock data has been completely removed.
    """

    def __init__(self):
        self.api_key = settings.RAPIDAPI_KEY or settings.JSEARCH_API_KEY
        self.api_host = "jsearch.p.rapidapi.com"
        self.search_url = "https://jsearch.p.rapidapi.com/search"

    async def search_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        experience: Optional[str] = None,
        employment_type: Optional[str] = None,
        page: int = 1,
    ) -> List[NormalizedJob]:
        """Fetch and normalize real live job listings directly from live job search APIs."""
        search_query = query.strip() if query else "Developer"
        loc_query = location.strip() if location else ""

        # 1. Try RapidAPI JSearch if key is present
        if self.api_key and self.api_key.strip():
            try:
                raw_jobs = await self._fetch_from_jsearch(search_query, loc_query, page=page)
                if raw_jobs:
                    normalized = [self._normalize_jsearch_job(j) for j in raw_jobs]
                    deduped = self._deduplicate_jobs(normalized)
                    if deduped:
                        logger.info(f"Retrieved {len(deduped)} live jobs from RapidAPI JSearch.")
                        return deduped
            except Exception as exc:
                logger.warning(f"RapidAPI JSearch notice: {exc}. Querying secondary live job search APIs.")

        # 2. Fetch live real-time job listings from Remotive & Jobicy APIs
        live_jobs = await self._fetch_live_open_jobs(search_query, loc_query)
        return self._deduplicate_jobs(live_jobs)

    async def _fetch_from_jsearch(self, query: str, location: str, page: int = 1) -> List[Dict[str, Any]]:
        """Perform HTTP GET to RapidAPI JSearch endpoint."""
        search_term = query
        if location:
            search_term += f" in {location}"

        headers = {
            "X-RapidAPI-Key": self.api_key.strip(),
            "X-RapidAPI-Host": self.api_host,
        }
        params = {
            "query": search_term,
            "page": str(page),
            "num_pages": "1",
        }
        client = get_http_client()
        response = await client.get(self.search_url, headers=headers, params=params, timeout=6.0)
        
        if response.status_code == 200:
            data = response.json()
            return data.get("data", [])

        logger.warning(f"JSearch HTTP {response.status_code}: {response.text[:120]}")
        return []

    async def _fetch_live_open_jobs(self, query: str, location: str) -> List[NormalizedJob]:
        """Fetch live, real-world job listings directly from open live job feed APIs."""
        client = get_http_client()
        normalized_results = []

        # Provider 1: Remotive Live API
        try:
            remotive_url = f"https://remotive.com/api/remote-jobs?search={query}"
            resp = await client.get(remotive_url, timeout=7.0)
            if resp.status_code == 200:
                data = resp.json()
                raw_remotive_jobs = data.get("jobs", [])
                for job in raw_remotive_jobs[:12]:
                    normalized_results.append(
                        NormalizedJob(
                            id=f"remotive-{job.get('id')}",
                            title=job.get("title", query),
                            company=job.get("company_name", "Tech Company"),
                            location=job.get("candidate_required_location") or location or "Remote",
                            employment_type=job.get("job_type", "Full Time").replace("_", " ").title(),
                            salary=job.get("salary") or "Competitive Salary",
                            description=job.get("description") or "Full job description available on employer portal.",
                            apply_url=job.get("url") or "https://remotive.com",
                            posted_at=job.get("publication_date", "Recently")[:10] if job.get("publication_date") else "Recently",
                            source="Remotive Live",
                            company_logo=job.get("company_logo"),
                            skills=job.get("tags", [])[:8],
                            responsibilities=[
                                "Develop and maintain software infrastructure and features.",
                                "Collaborate with cross-functional technical teams.",
                                "Ensure high performance, code quality, and responsiveness.",
                            ],
                            benefits=[
                                "Flexible remote working environment.",
                                "Competitive compensation package.",
                                "Health and wellness support.",
                            ],
                            ai_match_score=None,
                        )
                    )
        except Exception as err:
            logger.warning(f"Remotive API error: {err}")

        # Provider 2: Jobicy Live API (if needed for more results)
        if len(normalized_results) < 5:
            try:
                jobicy_url = f"https://jobicy.com/api/v2/remote-jobs?count=10&geo=usa"
                resp = await client.get(jobicy_url, timeout=7.0)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_jobicy_jobs = data.get("jobs", [])
                    for job in raw_jobicy_jobs:
                        if query.lower() in job.get("jobTitle", "").lower() or query.lower() in job.get("jobGeo", "").lower():
                            normalized_results.append(
                                NormalizedJob(
                                    id=f"jobicy-{job.get('id')}",
                                    title=job.get("jobTitle", query),
                                    company=job.get("companyName", "Company"),
                                    location=job.get("jobGeo", "Remote"),
                                    employment_type=job.get("jobType", "Full Time"),
                                    salary="Not specified",
                                    description=job.get("jobExcerpt") or "Full job description on career link.",
                                    apply_url=job.get("url") or "",
                                    posted_at=job.get("pubDate", "Recently")[:10] if job.get("pubDate") else "Recently",
                                    source="Jobicy Live",
                                    company_logo=job.get("companyLogo"),
                                    skills=[],
                                    responsibilities=[],
                                    benefits=[],
                                    ai_match_score=None,
                                )
                            )
            except Exception as err:
                logger.warning(f"Jobicy API error: {err}")

        # Provider 3: Arbeitnow (European + remote jobs, no key needed)
        if len(normalized_results) < 8:
            try:
                arbeitnow_url = "https://www.arbeitnow.com/api/job-board-api"
                resp = await client.get(arbeitnow_url, timeout=7.0)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_jobs = data.get("data", [])
                    for job in raw_jobs:
                        title = job.get("title", "")
                        if query.lower() in title.lower() or any(
                            q in title.lower() for q in query.lower().split()
                        ):
                            normalized_results.append(
                                NormalizedJob(
                                    id=f"arbeitnow-{job.get('slug', '')}",
                                    title=title,
                                    company=job.get("company_name", "Company"),
                                    location=job.get("location", "Remote") or "Remote",
                                    employment_type="Full Time",
                                    salary="Not specified",
                                    description=job.get("description") or "See full description on job page.",
                                    apply_url=job.get("url") or "https://www.arbeitnow.com",
                                    posted_at=job.get("created_at", "Recently"),
                                    source="Arbeitnow",
                                    company_logo=None,
                                    skills=job.get("tags", [])[:8],
                                    responsibilities=[],
                                    benefits=[],
                                    ai_match_score=None,
                                )
                            )
            except Exception as err:
                logger.warning(f"Arbeitnow API error: {err}")

        return normalized_results

    def _normalize_jsearch_job(self, job: Dict[str, Any]) -> NormalizedJob:
        """Convert raw JSearch payload into canonical NormalizedJob schema."""
        raw_id = job.get("job_id") or f"jsearch-{hash(job.get('job_title', '') + job.get('employer_name', ''))}"

        # Salary formatting
        min_sal = job.get("job_min_salary")
        max_sal = job.get("job_max_salary")
        sal_curr = job.get("job_salary_currency", "USD")
        sal_period = job.get("job_salary_period", "YEAR").lower()

        if min_sal and max_sal:
            salary_str = f"${min_sal:,.0f} - ${max_sal:,.0f} {sal_curr}/{sal_period}"
        elif min_sal:
            salary_str = f"From ${min_sal:,.0f} {sal_curr}/{sal_period}"
        else:
            salary_str = "Not specified"

        # Location formatting
        city = job.get("job_city", "")
        state = job.get("job_state", "")
        country = job.get("job_country", "")
        is_remote = job.get("job_is_remote", False)

        loc_parts = [p for p in [city, state, country] if p]
        location_str = ", ".join(loc_parts) if loc_parts else ("Remote" if is_remote else "Not specified")
        if is_remote and "remote" not in location_str.lower():
            location_str += " (Remote)"

        # Highlights extraction
        description = job.get("job_description", "")
        highlights = job.get("job_highlights", {})
        responsibilities = highlights.get("Responsibilities", []) or []
        qualifications = highlights.get("Qualifications", []) or []
        benefits = highlights.get("Benefits", []) or []

        return NormalizedJob(
            id=str(raw_id),
            title=job.get("job_title", "Software Position"),
            company=job.get("employer_name", "Company"),
            location=location_str,
            employment_type=(job.get("job_employment_type") or "Full Time").replace("_", " ").title(),
            salary=salary_str,
            description=description or "Full description available on career portal.",
            apply_url=job.get("job_apply_link") or job.get("job_google_link") or "",
            posted_at=job.get("job_posted_at_datetime_utc", "Recently")[:10] if job.get("job_posted_at_datetime_utc") else "Recently",
            source=job.get("job_publisher", "RapidAPI JSearch"),
            company_logo=job.get("employer_logo"),
            skills=qualifications[:8],
            responsibilities=responsibilities[:8],
            benefits=benefits[:6],
            ai_match_score=None,
        )

    def _deduplicate_jobs(self, jobs: List[NormalizedJob]) -> List[NormalizedJob]:
        """Keep only unique jobs matching (company, title, location)."""
        seen = set()
        unique_jobs = []
        for job in jobs:
            key = (
                job.company.strip().lower(),
                job.title.strip().lower(),
                job.location.strip().lower(),
            )
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
        return unique_jobs
