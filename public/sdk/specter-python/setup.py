"""
Legacy setup.py for environments without PEP 517 support.
Canonical metadata lives in pyproject.toml.
"""

from setuptools import setup, find_packages

setup(
    name="veylify",
    version="1.0.0",
    description=(
        "Official Veylify SDK for Python — server-side siteverify and webhook "
        "signature verification for ghost-font CAPTCHA / AI-bot protection."
    ),
    author="Veylify",
    url="https://veylify.com/docs/sdk/python",
    license="MIT",
    # Ships the canonical `veylify` package plus the `specter` back-compat shim.
    packages=find_packages(),
    python_requires=">=3.8",
    install_requires=[],
    extras_require={
        "flask": ["Flask>=2.0"],
        "django": ["Django>=3.2"],
    },
    keywords=["veylify", "captcha", "bot-protection", "ai-bot", "webhook"],
)
