import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.logging import request_id_var


class RequestIdMiddleware(BaseHTTPMiddleware):
    """
    Middleware injecting unique correlation IDs (X-Request-ID) into both logs
    and outbound HTTP response headers for transaction observability.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())

        # Set the request_id context variable for logging
        token = request_id_var.set(request_id)

        try:
            response: Response = await call_next(request)
        finally:
            # Revert context variable back to default to prevent context leaks
            request_id_var.reset(token)

        # Attach to outbound response header
        response.headers["X-Request-ID"] = request_id
        return response
