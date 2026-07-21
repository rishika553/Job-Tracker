from enum import Enum
import logging
import re
from typing import Dict, List, Optional, Protocol, Tuple

logger = logging.getLogger(__name__)


class ClassificationResult(str, Enum):
    """Enumeration of possible email classification categories."""

    JOB_EMAIL = "Job Email"
    UNKNOWN = "Unknown"
    IGNORE = "Ignore"


class BaseEmailClassifier(Protocol):
    """Interface defining the contract for email classification strategies (SOLID - DIP/OCP)."""

    def classify(
        self, subject: str, sender: str, body_snippet: str, labels: Optional[List[str]] = None
    ) -> Tuple[ClassificationResult, float]: ...


class RuleBasedClassifier(BaseEmailClassifier):
    """
    Deterministic classifier using sender domains, subject keywords, and labels.
    Provides fast, zero-latency categorization for standard recruiting emails.
    """

    def __init__(self):
        # Whitelisted Applicant Tracking Systems (ATS) and job portal domains
        self.job_domains = {
            "greenhouse.io",
            "greenhouse-mail.io",
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
            r"\b(application|interview|resume|job offer|rejection|onboarding|phone screen|hiring|career|recruiting|hiring process|application status|assessment)\b",
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

    def classify(
        self, subject: str, sender: str, body_snippet: str, labels: Optional[List[str]] = None
    ) -> Tuple[ClassificationResult, float]:
        domain = self._extract_domain(sender)
        combined_text = f"{subject} {body_snippet}"

        # Rule 1: Check ATS domains (highest confidence score: 1.0)
        if domain in self.job_domains:
            return ClassificationResult.JOB_EMAIL, 1.0

        # Rule 2: Check Gmail labels if provided (e.g. "Jobs", "Applications")
        if labels:
            for label in labels:
                if "job" in label.lower() or "application" in label.lower() or "interview" in label.lower():
                    return ClassificationResult.JOB_EMAIL, 0.95

        # Rule 3: Check for clear non-job transactional indicators (Ignore, confidence: 0.90)
        if self.non_job_keywords.search(combined_text):
            return ClassificationResult.IGNORE, 0.90

        # Rule 4: Check for recruiting lifecycle keywords in subject or body snippet (confidence: 0.85)
        if self.job_keywords.search(combined_text):
            return ClassificationResult.JOB_EMAIL, 0.85

        # Rule 5: Heuristics failed to classify with high confidence (confidence: 0.0)
        return ClassificationResult.UNKNOWN, 0.0


class EmailClassificationService:
    """Orchestrator combining heuristic rule classifiers with AI/LLM fallback hooks (SOLID - OCP)."""

    def __init__(self, classifiers: Optional[List[BaseEmailClassifier]] = None):
        # Default to the rule-based strategy
        self.classifiers = classifiers or [RuleBasedClassifier()]

    async def classify_email(
        self, subject: str, sender: str, body_snippet: str, labels: Optional[List[str]] = None
    ) -> ClassificationResult:
        """Categorize an email. Runs rule heuristics first, falling back to AI if unknown."""
        result, confidence = await self.classify_with_confidence(subject, sender, body_snippet, labels)
        return result

    async def classify_with_confidence(
        self, subject: str, sender: str, body_snippet: str, labels: Optional[List[str]] = None
    ) -> Tuple[ClassificationResult, float]:
        """Categorize an email and return both category and numerical confidence score."""
        # 1. Run all registered rule-based or heuristic classifiers
        for classifier in self.classifiers:
            result, confidence = classifier.classify(subject, sender, body_snippet, labels)
            if result != ClassificationResult.UNKNOWN:
                return result, confidence

        # 2. Heuristics are uncertain -> Fall back to AI integration hook
        logger.info(f"Rules uncertain for email '{subject}'. Forwarding to AI hook.")
        return await self._classify_with_ai(subject, sender, body_snippet, labels)

    async def _classify_with_ai(
        self, subject: str, sender: str, body_snippet: str, labels: Optional[List[str]] = None
    ) -> Tuple[ClassificationResult, float]:
        """
        Hook placeholder for future AI/LLM-based classification integration.
        Currently bypassed to return UNKNOWN without invoking AI models.
        """
        # Placeholder: This is where LLM prompts (Gemini / OpenAI) will be injected.
        return ClassificationResult.UNKNOWN, 0.0
