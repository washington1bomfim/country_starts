from collections.abc import Iterable
from datetime import datetime

import psycopg
from psycopg.rows import dict_row

from app.config import settings

TABLE_NAME = "country_starts_plays"


def get_conn() -> psycopg.Connection:
    return psycopg.connect(settings.postgres_url, autocommit=True)


def init_schema() -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
                    artist TEXT NOT NULL,
                    song TEXT NOT NULL,
                    played_at TIMESTAMPTZ NOT NULL,
                    PRIMARY KEY (artist, song, played_at)
                );
                """
            )
            cur.execute(
                f"CREATE INDEX IF NOT EXISTS idx_{TABLE_NAME}_played_at ON {TABLE_NAME} (played_at DESC);"
            )
            cur.execute(
                f"CREATE INDEX IF NOT EXISTS idx_{TABLE_NAME}_artist_played_at ON {TABLE_NAME} (artist, played_at DESC);"
            )
            cur.execute(
                f"CREATE INDEX IF NOT EXISTS idx_{TABLE_NAME}_song_played_at ON {TABLE_NAME} (song, played_at DESC);"
            )



def insert_plays(rows: Iterable[tuple[str, str, datetime]]) -> int:
    rows_list = list(rows)
    if not rows_list:
        return 0

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.executemany(
                f"""
                INSERT INTO {TABLE_NAME} (artist, song, played_at)
                VALUES (%s, %s, %s)
                ON CONFLICT DO NOTHING;
                """,
                rows_list,
            )
            return max(cur.rowcount, 0)


def run_query(sql: str, params: tuple | list | None = None) -> list[dict]:
    with get_conn() as conn:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute(sql, params or ())
            return list(cur.fetchall())
