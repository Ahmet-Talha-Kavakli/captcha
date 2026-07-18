"""
specter — legacy back-compat shim for the Veylify Python SDK.

The SDK package is now ``veylify``. This package re-exports it so existing code
doing ``from specter import SpecterClient`` keeps working unchanged.

New code should use ``from veylify import VeylifyClient``.
"""

from veylify import (  # noqa: F401
    VeylifyClient,
    VeylifyError,
    SiteverifyResult,
    verify_webhook,
    construct_event,
    DEFAULT_BASE_URL,
    SpecterClient,
    SpecterError,
)
from veylify import __version__  # noqa: F401

__all__ = [
    "SpecterClient",
    "SpecterError",
    "VeylifyClient",
    "VeylifyError",
    "SiteverifyResult",
    "verify_webhook",
    "construct_event",
    "DEFAULT_BASE_URL",
]
