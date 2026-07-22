import json
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Protocol

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.http_client import get_http_client
from app.models.email import EmailMessage
from app.repositories.email import EmailMessageRepository
from app.schemas.parser import ExtractedEmailData

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert AI parser for job application tracking.
Your task is to extract structured JSON data from a raw email.

Extract the following JSON fields:
- company: String or null (Name of the company hiring)
- role: String or null (Job title/role)
- platform: String or null (Platform used, e.g., LinkedIn, Indeed, Greenhouse, Lever)
- application_status: String or null (Status, e.g., applied, interviewing, offered, rejected, assessment)
- salary: String or null (Salary range or compensation details if mentioned)
- location: String or null (Job location or Remote status)
- recruiter: String or null (Name or email of recruiter if mentioned)
- interview_date: ISO 8601 string or null (e.g., "2026-07-25T14:00:00Z")
- assessment_date: ISO 8601 string or null (e.g., "2026-07-22T00:00:00Z")
- offer: Boolean (true if email extends an offer, else false)
- rejection: Boolean (true if email is an application rejection, else false)
- confidence_score: Float between 0.0 and 1.0 indicating extraction accuracy

IMPORTANT: Return ONLY valid raw JSON. Do not include markdown tags (no ```json), backticks, or any conversational text."""


def clean_json_response(raw_text: str) -> str:
    """
    Sanitize LLM output to handle markdown wrappers and common JSON syntax quirks.
    Strips code block fences and trailing commas before object/array closures.
    """
    cleaned = raw_text.strip()

    # 1. Strip ```json ... ``` or ``` ... ``` blocks
    code_block_match = re.search(
        r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE
    )
    if code_block_match:
        cleaned = code_block_match.group(1).strip()

    # 2. Remove trailing commas before closing braces/brackets
    cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)

    return cleaned


class BaseLLMClient(Protocol):
    """Protocol defining the interface for LLM extraction clients (SOLID - DIP)."""

    async def generate_json(
        self, prompt: str, system_instruction: Optional[str] = None
    ) -> str: ...


class GeminiLLMClient(BaseLLMClient):
    """Google Gemini API client for structured JSON generation."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or getattr(settings, "GEMINI_API_KEY", None)
        self.endpoint = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            "gemini-1.5-flash:generateContent"
        )

    async def generate_json(
        self, prompt: str, system_instruction: Optional[str] = None
    ) -> str:
        """Query Gemini API and request JSON output."""
        if not self.api_key:
            logger.warning("No GEMINI_API_KEY configured.")
            raise ValueError("GEMINI_API_KEY is missing.")

        url = f"{self.endpoint}?key={self.api_key}"
        contents = []
        if system_instruction:
            contents.append(
                {"role": "user", "parts": [{"text": f"SYSTEM: {system_instruction}"}]}
            )
        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            },
        }

        client = get_http_client()
        response = await client.post(url, json=payload, timeout=10.0)
        if response.status_code != 200:
            logger.error(f"Gemini API request failed: {response.text}")
            response.raise_for_status()

        data = response.json()
        try:
            candidates = data.get("candidates", [])
            parts = candidates[0].get("content", {}).get("parts", [])
            return parts[0].get("text", "")
        except (IndexError, KeyError) as exc:
            logger.error(f"Malformed Gemini API response payload: {data}")
            raise ValueError("Unable to extract text from Gemini response.") from exc


def heuristic_parse_email(subject: str, sender: str, body: str) -> ExtractedEmailData:
    """Heuristic fallback extraction when LLM API key is missing or call fails."""
    company = ""
    match_sender = re.search(r'^(.*?)(?:\s*<([^>]+)>)?$', sender)
    if match_sender:
        clean_name = match_sender.group(1).strip('"\' ')
        if clean_name and "donotreply" not in clean_name.lower():
            company = clean_name.split("|")[0].split("-")[0].strip()
        elif match_sender.group(2):
            email_addr = match_sender.group(2)
            if "@" in email_addr:
                domain = email_addr.split("@")[1].split(".")[0]
                company = domain.capitalize()

    role = subject
    if " at " in subject:
        parts = subject.split(" at ")
        role = parts[0].strip()
        if not company or company.lower() in ["indeed", "jobrapido", "gmail", "inbox"]:
            company = parts[1].split(".")[0].split("-")[0].strip()
    elif " for " in subject:
        parts = subject.split(" for ")
        role = parts[0].strip()
        if not company:
            company = parts[1].strip()

    if not company or company.lower() in ["indeed", "jobrapido", "gmail"]:
        company = "Hiring Team"

    status_str = "applied"
    subj_lower = subject.lower()
    if "interview" in subj_lower or "schedule" in subj_lower:
        status_str = "interviewing"
    elif "offer" in subj_lower:
        status_str = "offered"
    elif "reject" in subj_lower or "regret" in subj_lower:
        status_str = "rejected"

    platform = "Gmail Sync"
    if "indeed" in sender.lower() or "indeed" in subj_lower:
        platform = "Indeed"
    elif "linkedin" in sender.lower() or "linkedin" in subj_lower:
        platform = "LinkedIn"
    location = None
    full_text = f"{subject} {snippet}".lower()
    if "remote" in full_text:
        location = "Remote"
    elif "hybrid" in full_text:
        location = "Hybrid"
    else:
        cities = ["Bangalore", "Bengaluru", "Mumbai", "Delhi", "Gurgaon", "Noida", "Hyderabad", "Pune", "Chennai", "Kolkata", "Ahmedabad", "San Francisco", "New York", "London"]
        for city in cities:
            if city.lower() in full_text:
                location = city
                break

    return ExtractedEmailData(
        company=company,
        role=role[:80] if len(role) > 80 else role,
        platform=platform,
        application_status=status_str,
        location=location,
        confidence_score=0.85
    )


class AIEmailParserService:
    """Isolated service parsing raw emails via LLM and saving JSON results in PostgreSQL."""

    def __init__(
        self,
        db: AsyncSession,
        llm_client: Optional[BaseLLMClient] = None,
    ):
        self.db = db
        self.email_repo = EmailMessageRepository(db)
        self.llm_client = llm_client or GeminiLLMClient()

    def build_prompt(self, subject: str, sender: str, body: str) -> str:
        """Construct prompt combining email details."""
        return (
            f"EMAIL SENDER: {sender}\n"
            f"EMAIL SUBJECT: {subject}\n"
            f"EMAIL BODY:\n{body}\n"
        )

    async def parse_email_message(
        self, email_message_id: uuid.UUID, max_retries: int = 3
    ) -> Optional[ExtractedEmailData]:
        """
        Loads an EmailMessage from PostgreSQL, invokes the LLM client, cleans & validates
        the resulting JSON response with fallback to heuristics, and saves output in PostgreSQL.
        """
        email_record = await self.email_repo.get(email_message_id)
        if not email_record:
            logger.error(f"EmailMessage record {email_message_id} not found.")
            return None

        # Build prompt from available email text or snippet
        subject = email_record.subject or ""
        sender = email_record.sender or ""
        body = email_record.body_text or email_record.snippet or ""
        prompt = self.build_prompt(subject, sender, body)

        for attempt in range(1, max_retries + 1):
            try:
                # 1. Query LLM
                raw_response = await self.llm_client.generate_json(
                    prompt=prompt, system_instruction=SYSTEM_PROMPT
                )

                # 2. Clean malformed JSON output
                cleaned_json = clean_json_response(raw_response)

                # 3. Validate against Pydantic schema
                data_dict = json.loads(cleaned_json)
                validated_data = ExtractedEmailData.model_validate(data_dict)

                # 4. Save to PostgreSQL as JSONB dict
                serialized_dict = validated_data.model_dump(mode="json")
                await self.email_repo.update_ai_extraction(
                    email_id=email_message_id,
                    extracted_data=serialized_dict,
                    status="success",
                )
                return validated_data

            except Exception as exc:
                logger.warning(
                    f"AI parsing attempt {attempt}/{max_retries} failed for email {email_message_id}: {exc}"
                )

        # Fallback to heuristic parser if AI calls fail or GEMINI_API_KEY is not configured
        fallback_data = heuristic_parse_email(subject, sender, body)
        serialized_dict = fallback_data.model_dump(mode="json")
        await self.email_repo.update_ai_extraction(
            email_id=email_message_id,
            extracted_data=serialized_dict,
            status="heuristic_fallback",
        )
        return fallback_data
