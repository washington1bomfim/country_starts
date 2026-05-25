import json
from datetime import date, datetime, timedelta, timezone

import httpx

from app.db import insert_plays

URL_PATTERNS = [
    "https://globalnewselection.s3.amazonaws.com/fm-playlist/results/CKDKFM_pl_{day}.js",
    "https://globalnewselection.s3.amazonaws.com/fm-playlist/results/CKRYFM_pl_.{day}.js",
]


def _unwrap_callback(payload_text: str) -> dict:
    text = payload_text.strip()
    if not text.startswith("plCallback(") or not text.endswith(")"):
        raise ValueError("Formato inesperado da playlist")

    json_blob = text[text.find("(") + 1 : text.rfind(")")]
    return json.loads(json_blob)


def _parse_played_at(target_date: date, hour_text: str) -> datetime:
    cleaned = hour_text.strip()
    # Normaliza '00:XX AM' para '12:XX AM' (meia-noite)
    if cleaned.startswith("00:"):
        cleaned = "12:" + cleaned[3:]
    parsed_time = datetime.strptime(cleaned, "%I:%M%p").time()
    return datetime.combine(target_date, parsed_time, tzinfo=timezone.utc)


async def fetch_day_plays(target_date: date) -> list[tuple[str, str, datetime]]:
    day_ref = target_date.isoformat()
    plays: list[tuple[str, str, datetime]] = []
    source_success = 0

    async with httpx.AsyncClient(timeout=30.0) as client:
        for pattern in URL_PATTERNS:
            url = pattern.format(day=day_ref)
            try:
                response = await client.get(url)
                response.raise_for_status()
                payload = _unwrap_callback(response.text)
            except (httpx.HTTPError, ValueError, json.JSONDecodeError):
                continue

            source_success += 1

            for item in payload.get("songs", []):
                artist = (item.get("artist") or "").strip()
                song = (item.get("song") or "").strip()
                hour_text = (item.get("date") or "").strip()
                if not artist or not song or not hour_text:
                    continue

                played_at = _parse_played_at(target_date, hour_text)
                plays.append((artist, song, played_at))

    if source_success == 0:
        raise RuntimeError("Nenhuma fonte de playlist respondeu com sucesso")

    return plays


async def fetch_yesterday_and_store() -> dict:
    target_date = date.today() - timedelta(days=1)
    return await fetch_and_store(target_date)


async def fetch_and_store(target_date: date) -> dict:
    rows = await fetch_day_plays(target_date)
    inserted = insert_plays(rows)
    return {
        "date": target_date.isoformat(),
        "total_fetched": len(rows),
        "total_inserted": inserted,
    }
