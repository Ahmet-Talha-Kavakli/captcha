"""
specter.client — legacy back-compat shim.

Re-exports everything from ``veylify.client`` so existing imports like
``from specter.client import flask_protect`` keep working. New code should use
``from veylify.client import flask_protect``.
"""

from veylify.client import (  # noqa: F401
    VeylifyClient,
    VeylifyError,
    SiteverifyResult,
    verify_webhook,
    construct_event,
    flask_protect,
    django_protect,
    DEFAULT_BASE_URL,
    SpecterClient,
    SpecterError,
)
