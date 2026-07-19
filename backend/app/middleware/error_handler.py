import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Catch-all middleware that intercepts unhandled runtime exceptions.
    Logs them via the logging subsystem and returns a sanitized JSON response.
    """

    async def dispatch(self, request: Request, call_next) -> JSONResponse:
        try:
            return await call_next(request)
        except Exception as exc:
            # Log with full stack trace context
            logger.error(
                f"Unhandled Exception on {request.method} {request.url.path}",
                exc_info=exc,
            )

            # Mask internal database or execution details from public consumption
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error. Please contact support."},
            )
