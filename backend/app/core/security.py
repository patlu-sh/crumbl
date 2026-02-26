import re
from urllib.parse import urlparse
from typing import Optional


# Allow http and https only; reject javascript:, data:, etc.
ALLOWED_SCHEMES = frozenset({"http", "https"})
# Basic host allowlist: no localhost / private IPs if you want to prevent open redirect to internal services
# For a shortener we only validate scheme and structure; redirect target is user-supplied.
def validate_url(url: str) -> tuple[bool, Optional[str]]:
    """
    Validate URL for shortening. Returns (ok, error_message).
    Ensures scheme is http/https and URL is well-formed.
    """
    if not url or not isinstance(url, str):
        return False, "URL is required"
    s = url.strip()
    if len(s) > 2048:
        return False, "URL too long"
    try:
        parsed = urlparse(s)
    except Exception:
        return False, "Invalid URL"
    if not parsed.scheme:
        return False, "URL must include scheme (http or https)"
    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        return False, "Only http and https URLs are allowed"
    if not parsed.netloc:
        return False, "URL must have a host"
    # Basic sanity: netloc should look like a hostname (no embedded auth for display)
    if " " in s or "\n" in s or "\r" in s:
        return False, "URL contains invalid characters"
    return True, None


def sanitize_alias(alias: str) -> Optional[str]:
    """Allow only [a-zA-Z0-9] for alias; length 6."""
    if not alias or len(alias) != 6:
        return None
    if re.match(r"^[a-zA-Z0-9]{6}$", alias):
        return alias
    return None
