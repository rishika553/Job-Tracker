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
            "indeed.com",
            "jobalert.indeed.com",
            "jobrapido.com",
            "jobrapidoalert.com",
            "linkedin.com",
            "naukri.com",
            "naukrigulf.com",
            "wellfound.com",
            "angel.co",
            "glassdoor.com",
            "simplyhired.com",
            "monster.com",
            "ziprecruiter.com",
            "dice.com",
            "hire.withgoogle.com",
        }

        # Specific phrases confirming an ACTUAL submitted job application or interview/offer
        self.application_confirmation_keywords = re.compile(
            r"\b(successfully applied|applied to|applied for|thank you for applying|thank you for your application|application received|application submitted|application confirmation|interview invitation|schedule an interview|interview scheduled|offer letter|job offer|application status|assessment invitation|regret to inform)\b",
            re.IGNORECASE,
        )

        # Subject/Snippet keywords indicating job alerts, digests, newsletters, or non-application emails
        self.non_job_keywords = re.compile(
            r"\b(job alert|jobs alert|recommended jobs|new jobs|jobs matching|jobs for you|top picks|daily digest|weekly digest|newsletter|receipt|invoice|billing|password reset|verify your email|shipping confirmation|order confirmation|login alert|security alert|marketing|community digest|unsubscribe)\b",
            re.IGNORECASE,
        )

    def _extract_domain(self, sender: str) -> str:
        """Extract the raw email domain from the sender string (e.g. 'Stripe <recruiting@stripe.com>')."""
        match = re.search(r"@([\w.-]+)", sender)
        return match.group(1).lower() if match else ""

    def classify(
        self, subject: str, sender: str, body_snippet: str, labels: Optional[List[str]] = None
    ) -> Tuple[ClassificationResult, float]:
        combined_text = f"{subject} {body_snippet}"

        # Rule 1: Check for clear job alerts, newsletters, or non-job transactional indicators (Ignore)
        if self.non_job_keywords.search(combined_text):
            return ClassificationResult.IGNORE, 0.95

        # Rule 2: Require explicit application confirmation phrases (e.g. "successfully applied", "thank you for applying")
        if self.application_confirmation_keywords.search(combined_text):
            return ClassificationResult.JOB_EMAIL, 1.0

        # Rule 3: Check Gmail labels if provided (e.g. "Jobs", "Applications") ONLY if combined_text has application keywords
        if labels:
            for label in labels:
                if ("application" in label.lower() or "interview" in label.lower()) and "alert" not in combined_text.lower():
                    return ClassificationResult.JOB_EMAIL, 0.90

        # Default: Ignore generic emails that do not confirm an actual applied application
        return ClassificationResult.IGNORE, 0.90


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
