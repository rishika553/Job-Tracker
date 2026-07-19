import logging
import sys
from contextvars import ContextVar

# ContextVar to store request/correlation ID across asynchronous contexts
request_id_var: ContextVar[str] = ContextVar("request_id", default="-")


class RequestIdFilter(logging.Filter):
    """Logging filter to inject request_id context variable into logs."""

    def filter(self, record):
        record.request_id = request_id_var.get()
        return True


def setup_logging():
    """Configures structured logs with request tracking for the application."""
    log_format = (
        "%(asctime)s [%(levelname)s] [%(name)s] "
        "[req_id=%(request_id)s] %(message)s"
    )

    root_logger = logging.getLogger()

    # Clear existing handlers to prevent duplicate outputs
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(logging.Formatter(log_format))
    console_handler.addFilter(RequestIdFilter())

    root_logger.addHandler(console_handler)
    root_logger.setLevel(logging.INFO)

    # Adjust verbosity of heavy SQL or connection loggers in production
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
