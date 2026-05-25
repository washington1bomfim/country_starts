from datetime import date

from app.db import TABLE_NAME, run_query


def top_artists(start_date: date, end_date: date, limit: int = 10) -> list[dict]:
    sql = f"""
        SELECT artist, COUNT(*)::INT AS plays
        FROM {TABLE_NAME}
        WHERE played_at::date BETWEEN %s AND %s
        GROUP BY artist
        ORDER BY plays DESC, artist ASC
        LIMIT %s;
    """
    return run_query(sql, (start_date, end_date, limit))


def songs_by_top_artists(
    start_date: date,
    end_date: date,
    artist_limit: int = 10,
    song_limit: int = 10,
) -> list[dict]:
    sql = f"""
        WITH top_artists AS (
            SELECT artist, COUNT(*) AS plays
            FROM {TABLE_NAME}
            WHERE played_at::date BETWEEN %s AND %s
            GROUP BY artist
            ORDER BY plays DESC
            LIMIT %s
        )
        SELECT p.artist, p.song, COUNT(*)::INT AS plays
        FROM {TABLE_NAME} p
        INNER JOIN top_artists ta ON ta.artist = p.artist
        WHERE p.played_at::date BETWEEN %s AND %s
        GROUP BY p.artist, p.song
        ORDER BY plays DESC, p.artist ASC, p.song ASC
        LIMIT %s;
    """
    return run_query(
        sql,
        (start_date, end_date, artist_limit, start_date, end_date, song_limit),
    )


def top_artist_on_date(ref_date: date) -> dict | None:
    sql = f"""
        SELECT artist, COUNT(*)::INT AS plays
        FROM {TABLE_NAME}
        WHERE played_at::date = %s
        GROUP BY artist
        ORDER BY plays DESC, artist ASC
        LIMIT 1;
    """
    rows = run_query(sql, (ref_date,))
    return rows[0] if rows else None


def top_song_on_date(ref_date: date) -> dict | None:
    sql = f"""
        SELECT song, artist, COUNT(*)::INT AS plays
        FROM {TABLE_NAME}
        WHERE played_at::date = %s
        GROUP BY song, artist
        ORDER BY plays DESC, song ASC
        LIMIT 1;
    """
    rows = run_query(sql, (ref_date,))
    return rows[0] if rows else None


def artist_on_date(artist: str, ref_date: date) -> dict:
    count_sql = f"""
        SELECT COUNT(*)::INT AS plays
        FROM {TABLE_NAME}
        WHERE artist = %s
        AND played_at::date = %s;
    """
    songs_sql = f"""
        SELECT song, COUNT(*)::INT AS plays
        FROM {TABLE_NAME}
        WHERE artist = %s
        AND played_at::date = %s
        GROUP BY song
        ORDER BY plays DESC, song ASC
        LIMIT 10;
    """
    total = run_query(count_sql, (artist, ref_date))
    songs = run_query(songs_sql, (artist, ref_date))

    return {
        "artist": artist,
        "date": ref_date.isoformat(),
        "plays": total[0]["plays"] if total else 0,
        "top_songs": songs,
    }
