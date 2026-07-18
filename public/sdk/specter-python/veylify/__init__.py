"""
veylify — Official Veylify SDK for Python.

Server-side client for Veylify (AI-bot / ghost-font CAPTCHA protection).

Public API:
    from veylify import VeylifyClient, VeylifyError, verify_webhook

    client = VeylifyClient(secret="sk_live_...")
    result = client.siteverify(token)          # POST /api/v1/siteverify
    ok = client.verify_webhook(body, header, secret)   # HMAC-SHA256 check

Back-compat: ``SpecterClient`` / ``SpecterError`` remain importable as aliases.
"""

from .client import (
    VeylifyClient,
    VeylifyError,
    SiteverifyResult,
    verify_webhook,
    construct_event,
    DEFAULT_BASE_URL,
    # Back-compat aliases.
    SpecterClient,
    SpecterError,
)

__all__ = [
    "VeylifyClient",
    "VeylifyError",
    "SiteverifyResult",
    "verify_webhook",
    "construct_event",
    "DEFAULT_BASE_URL",
    # Back-compat aliases.
    "SpecterClient",
    "SpecterError",
]

__version__ = "1.0.0"
