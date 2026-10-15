from app.core.database_url import resolve_database_url


def test_resolve_database_url_keeps_localhost():
    url = "postgresql+asyncpg://postgres:postgres@localhost:5432/salondesk"
    assert resolve_database_url(url) == url


def test_resolve_database_url_rewrites_unresolvable_db(monkeypatch):
    monkeypatch.setenv("POSTGRES_PORT", "5433")
    url = "postgresql+asyncpg://postgres:postgres@db:5432/salondesk"
    assert resolve_database_url(url, host_port=5433) == (
        "postgresql+asyncpg://postgres:postgres@localhost:5433/salondesk"
    )
