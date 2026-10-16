"""Normalize DATABASE_URL for host vs Docker Compose."""

from __future__ import annotations

import logging
import os
import socket
from urllib.parse import urlparse, urlunparse

logger = logging.getLogger(__name__)


def resolve_database_url(url: str, *, host_port: int | None = None) -> str:
    """Rewrite Compose hostname ``db`` → ``localhost`` when running on the host.

    Root ``.env`` often uses ``@db:5432`` (Compose service name). That host does
    not resolve outside Docker → ``socket.gaierror: nodename nor servname provided``.
    """
    parsed = urlparse(url)
    if parsed.hostname != "db":
        return url

    port = parsed.port or 5432
    try:
        socket.getaddrinfo(parsed.hostname, port)
        return url
    except OSError:
        if host_port is not None:
            local_port = host_port
        else:
            local_port = int(os.environ.get("POSTGRES_PORT", str(port)))
        username = parsed.username or ""
        password = parsed.password or ""
        if username and password:
            netloc = f"{username}:{password}@localhost:{local_port}"
        elif username:
            netloc = f"{username}@localhost:{local_port}"
        else:
            netloc = f"localhost:{local_port}"

        rewritten = urlunparse(parsed._replace(netloc=netloc))
        logger.warning(
            "DATABASE_URL host 'db' is not resolvable here (Compose network). "
            "Using localhost:%s instead.",
            local_port,
        )
        return rewritten
