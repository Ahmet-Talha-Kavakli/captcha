"""
veylify.client — core client + webhook verification.

Zero third-party dependencies: uses only the standard library
(urllib, hmac, hashlib, json, time). Works on Python 3.8+.

Back-compat: ``SpecterClient`` / ``SpecterError`` are aliases of
``VeylifyClient`` / ``VeylifyError`` so existing integrations keep working.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

DEFAULT_BASE_URL = "https://api.veylify.com"


class VeylifyError(Exception):
    """Raised for SDK-level errors (network, missing input, bad signature)."""

    def __init__(self, message: str, code: str = "veylify_error") -> None:
        super().__init__(message)
        self.code = code


@dataclass
class SiteverifyResult:
    """Result of a POST /api/v1/siteverify call."""

    success: bool
    challenge_ts: Optional[str] = None
    hostname: Optional[str] = None
    score: Optional[float] = None
    cid: Optional[str] = None
    error_codes: List[str] = field(default_factory=list)
    raw: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_json(cls, data: Dict[str, Any]) -> "SiteverifyResult":
        return cls(
            success=bool(data.get("success")),
            challenge_ts=data.get("challenge_ts"),
            hostname=data.get("hostname"),
            score=data.get("score"),
            cid=data.get("cid"),
            # The API returns hyphenated "error-codes".
            error_codes=list(data.get("error-codes", []) or []),
            raw=data,
        )


def verify_webhook(
    body: Any,
    header: Optional[str],
    secret: str,
    tolerance_seconds: int = 300,
) -> bool:
    """
    Verify the signature of an inbound Veylify webhook.

    Header format (Stripe-style): ``t=<unix-seconds>,v1=<hmac-sha256-hex>``
    where ``hmac = HMAC_SHA256(f"{t}.{raw_body}", secret)``.

    IMPORTANT: ``body`` must be the RAW request body (str or bytes), not a
    re-serialized dict, so the signed bytes match exactly.

    Uses ``hmac.compare_digest`` for a timing-safe comparison.
    """
    if not header or not secret:
        return False

    raw = body.decode("utf-8") if isinstance(body, (bytes, bytearray)) else str(body)

    parts: Dict[str, str] = {}
    for piece in header.split(","):
        if "=" not in piece:
            continue
        key, _, value = piece.partition("=")
        parts[key.strip()] = value.strip()

    ts_raw = parts.get("t")
    v1 = parts.get("v1")
    if not ts_raw or not v1:
        return False
    try:
        ts = int(ts_raw)
    except ValueError:
        return False

    # Reject stale / future timestamps (replay protection).
    if abs(time.time() - ts) > tolerance_seconds:
        return False

    expected = hmac.new(
        secret.encode("utf-8"),
        f"{ts}.{raw}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return hmac.compare_digest(expected, v1)


def construct_event(
    body: Any,
    header: Optional[str],
    secret: str,
    tolerance_seconds: int = 300,
) -> Dict[str, Any]:
    """
    Verify + parse an inbound webhook. Raises VeylifyError on invalid signature.
    Returns the decoded event: {type, id, created, data}.
    """
    if not verify_webhook(body, header, secret, tolerance_seconds):
        raise VeylifyError("Invalid webhook signature", "invalid-signature")
    raw = body.decode("utf-8") if isinstance(body, (bytes, bytearray)) else str(body)
    return json.loads(raw)


class VeylifyClient:
    """Server-side Veylify client."""

    def __init__(
        self,
        secret: Optional[str] = None,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = 8.0,
    ) -> None:
        self.secret = (
            secret
            or os.environ.get("VEYLIFY_SECRET_KEY")
            or os.environ.get("SPECTER_SECRET_KEY", "")  # back-compat env
        )
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def siteverify(
        self,
        response: str,
        secret: Optional[str] = None,
    ) -> SiteverifyResult:
        """
        Confirm a widget verification token. Calls POST /api/v1/siteverify.

        :param response: The verification token returned by the widget.
        :param secret:   Secret key; falls back to the client default.
        """
        secret = secret or self.secret
        if not secret:
            raise VeylifyError("Missing secret key", "missing-secret")
        if not response:
            raise VeylifyError("Missing response token", "missing-input")

        payload = json.dumps({"secret": secret, "response": response}).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/api/v1/siteverify",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            # The API returns 200 for logical failures; a real HTTPError means
            # a transport-level problem. Still try to parse the body.
            try:
                data = json.loads(exc.read().decode("utf-8"))
            except Exception:
                raise VeylifyError(f"HTTP {exc.code}", "http-error") from exc
        except urllib.error.URLError as exc:
            raise VeylifyError(f"Network error: {exc.reason}", "network-error") from exc

        return SiteverifyResult.from_json(data)

    def verify_webhook(
        self,
        body: Any,
        header: Optional[str],
        secret: str,
        tolerance_seconds: int = 300,
    ) -> bool:
        """Instance wrapper around the module-level verify_webhook."""
        return verify_webhook(body, header, secret, tolerance_seconds)

    def construct_event(
        self,
        body: Any,
        header: Optional[str],
        secret: str,
        tolerance_seconds: int = 300,
    ) -> Dict[str, Any]:
        """Verify + parse a webhook. Raises VeylifyError on invalid signature."""
        return construct_event(body, header, secret, tolerance_seconds)


# ---------------------------------------------------------------------------
# Framework helpers (optional imports — only used if you call them).
# ---------------------------------------------------------------------------


def flask_protect(
    client: "VeylifyClient",
    field_name: str = "veylify-token",
    min_score: float = 0.0,
) -> Callable:
    """
    Flask decorator: verifies the Veylify token on the incoming request before
    the view runs. On failure returns 403. Attaches the result to ``flask.g.veylify``.

        from flask import Flask, g
        from veylify import VeylifyClient
        from veylify.client import flask_protect

        app = Flask(__name__)
        veylify = VeylifyClient(secret="sk_live_...")

        @app.post("/signup")
        @flask_protect(veylify, min_score=0.5)
        def signup():
            return {"ok": True, "score": g.veylify.score}
    """
    from functools import wraps

    def decorator(view: Callable) -> Callable:
        @wraps(view)
        def wrapper(*args: Any, **kwargs: Any):
            from flask import request, g, jsonify

            token = (
                (request.form or {}).get(field_name)
                or (request.get_json(silent=True) or {}).get(field_name)
                or ""
            )
            result = client.siteverify(token)
            g.veylify = result
            g.specter = result  # back-compat alias
            score_ok = result.score is None or result.score >= min_score
            if result.success and score_ok:
                return view(*args, **kwargs)
            return (
                jsonify(
                    error="veylify_verification_failed",
                    codes=result.error_codes,
                ),
                403,
            )

        return wrapper

    return decorator


def django_protect(
    client: "VeylifyClient",
    field_name: str = "veylify-token",
    min_score: float = 0.0,
) -> Callable:
    """
    Django view decorator. Same behavior as ``flask_protect`` but reads from
    ``request.POST`` and returns a ``JsonResponse``. Attaches ``request.veylify``.

        from veylify import VeylifyClient
        from veylify.client import django_protect

        veylify = VeylifyClient(secret="sk_live_...")

        @django_protect(veylify, min_score=0.5)
        def signup(request):
            return JsonResponse({"ok": True, "score": request.veylify.score})
    """
    from functools import wraps

    def decorator(view: Callable) -> Callable:
        @wraps(view)
        def wrapper(request, *args: Any, **kwargs: Any):
            from django.http import JsonResponse

            token = request.POST.get(field_name, "")
            result = client.siteverify(token)
            request.veylify = result
            request.specter = result  # back-compat alias
            score_ok = result.score is None or result.score >= min_score
            if result.success and score_ok:
                return view(request, *args, **kwargs)
            return JsonResponse(
                {"error": "veylify_verification_failed", "codes": result.error_codes},
                status=403,
            )

        return wrapper

    return decorator


# ---------------------------------------------------------------------------
# Back-compat aliases — old names keep working.
# ---------------------------------------------------------------------------
SpecterClient = VeylifyClient
SpecterError = VeylifyError
