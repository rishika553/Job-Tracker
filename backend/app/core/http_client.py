from typing import Optional
import httpx

_http_client: Optional[httpx.AsyncClient] = None


def get_http_client() -> httpx.AsyncClient:
    """Return shared long-lived httpx.AsyncClient pool instance to prevent socket exhaustion."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        limits = httpx.Limits(max_keepalive_connections=20, max_connections=100)
        _http_client = httpx.AsyncClient(limits=limits, timeout=10.0)
    return _http_client


async def close_http_client() -> None:
    """Close the global HTTP client pool during application shutdown."""
    global _http_client
    if _http_client is not None and not _http_client.is_closed:
        await _http_client.aclose()
        _http_client = None
