from enum import Enum
from typing import List, Optional, Protocol
import re
import logging

logger = logging.getLogger(__name__)


class ClassificationResult(str, Enum):
    """Enumeration of possible email classification categories."""

    JOB_EMAIL = "Job Email"
    NOT_JOB_EMAIL = "Not Job Email"
    UNKNOWN = "Unknown"


class BaseEmailClassifier(Protocol):
    """Interface defining the contract for email classification strategies (SOLID - DIP/OCP)."""

    def classify(self, subject: str, sender: str, body_snippet: str) -> ClassificationResult: ...


class RuleBasedClassifier(BaseEmailClassifier):
    """
    Deterministic classifier using sender domains and subject keywords.
    Provides fast, low-cost categorization for standard transactional recruiting emails.
    """

    def __init__(self):
        # Whitelisted Applicant Tracking Systems (ATS) and job portal domains
        self.job_domains = {
            "greenhouse.io",
            "lever.co",
            "workday.com",
            "myworkdayjobs.com",
            "ashbyhq.com",
            "ashby.co",
            "smartrecruiters.com",
            "taleo.net",
            "bamboohr.com",
            "rippling.com",
        }

        # Subject/Snippet keywords indicating a job application lifecycle stage
        self.job_keywords = re.compile(
            r"\b(application|interview|resume|job offer|rejection|onboarding|phone screen|hiring|career|recruiting|hiring process|application status)\b",
            re.IGNORECASE,
        )

        # Subject/Snippet keywords indicating standard promotional or transactional spam
        self.non_job_keywords = re.compile(
            r"\b(receipt|invoice|billing|password reset|verify your email|newsletter|weekly digest|shipping confirmation|order confirmation|promo|discount)\b",
            re.IGNORECASE,
        )

    def _extract_domain(self, sender: str) -> str:
        """Extract the raw email domain from the sender string (e.g. 'Stripe <recruiting@stripe.com>')."""
        match = re.search(r"@([\w.-]+)", sender)
        return match.group(1).lower() if match else ""

    def classify(self, subject: str, sender: str, body_snippet: str) -> ClassificationResult:
        domain = self._extract_domain(sender)
        combined_text = f"{subject} {body_snippet}"

        # Rule 1: Check ATS domains (highest confidence indicator)
        if domain in self.job_domains:
            return ClassificationResult.JOB_EMAIL

        # Rule 2: Check for clear non-job transactional indicators
        if self.non_job_keywords.search(combined_text):
            return ClassificationResult.NOT_JOB_EMAIL

        # Rule 3: Check for recruiting lifecycle keywords in subject or body snippet
        if self.job_keywords.search(combined_text):
            return ClassificationResult.JOB_EMAIL

        # Rule 4: Heuristics failed to classify with high confidence
        return ClassificationResult.UNKNOWN


class EmailClassificationService:
    """Orchestrator combining heuristic rule classifiers with AI/LLM fallback hooks (SOLID - OCP)."""

    def __init__(self, classifiers: Optional[List[BaseEmailClassifier]] = None):
        # Default to the rule-based strategy
        self.classifiers = classifiers or [RuleBasedClassifier()]

    async def classify_email(
        self, subject: str, sender: str, body_snippet: str
    ) -> ClassificationResult:
        """Categorize an email. Runs rule heuristics first, falling back to AI if unknown."""
        # 1. Run all registered rule-based or heuristic classifiers
        for classifier in self.classifiers:
            result = classifier.classify(subject, sender, body_snippet)
            if result != ClassificationResult.UNKNOWN:
                return result

        # 2. Heuristics are uncertain -> Fall back to AI integration hook
        logger.info(f"Rules uncertain for email '{subject}'. Forwarding to AI hook.")
        return await self._classify_with_ai(subject, sender, body_snippet)

    async def _classify_with_ai(
        self, subject: str, sender: str, body_snippet: str
    ) -> ClassificationResult:
        """
        Hook placeholder for future AI/LLM-based classification integration.
        Currently bypassed/unimplemented to return UNKNOWN without loading AI models.
        """
        # Placeholder: This is where we will inject prompts to OpenAI, Gemini, or local models.
        return ClassificationResult.UNKNOWN
