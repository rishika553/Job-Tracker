from datetime import datetime, timezone


def format_datetime_iso(dt: datetime) -> str:
    """Format a datetime object to standard ISO 8601 UTC string format."""
    if not dt.tzinfo:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def normalize_email(email: str) -> str:
    """Normalize email addresses to lowercase and strip trailing spaces."""
    return email.strip().lower()
