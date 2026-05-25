from contextlib import asynccontextmanager
from datetime import date

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.config import settings
from app.db import init_schema
from app.ingest import fetch_and_store, fetch_yesterday_and_store
from app.queries import (
    artist_on_date,
    songs_by_top_artists,
    top_artist_on_date,
    top_artists,
    top_song_on_date,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_schema()
    yield


app = FastAPI(title="country_starts", version="1.0.0", lifespan=lifespan)
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")


def _check_cron_auth(request: Request) -> None:
    secret = settings.cron_secret
    if not secret:
        return

    auth_header = request.headers.get("authorization", "")
    token = request.query_params.get("token")

    if auth_header == f"Bearer {secret}" or token == secret:
        return

    raise HTTPException(status_code=401, detail="Unauthorized cron execution")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/ingest/yesterday")
async def ingest_yesterday():
    return await fetch_yesterday_and_store()


@app.post("/api/ingest/date/{target_date}")
async def ingest_date(target_date: date):
    return await fetch_and_store(target_date)


@app.get("/api/cron/fetch")
async def cron_fetch(request: Request):
    _check_cron_auth(request)
    return await fetch_yesterday_and_store()


@app.get("/api/stats/top-artists")
async def api_top_artists(
    start_date: date = Query(...),
    end_date: date = Query(...),
    limit: int = Query(default=10, ge=1, le=100),
):
    return top_artists(start_date, end_date, limit)


@app.get("/api/stats/top-songs-by-top-artists")
async def api_top_songs_by_artists(
    start_date: date = Query(...),
    end_date: date = Query(...),
    artist_limit: int = Query(default=5, ge=1, le=50),
    song_limit: int = Query(default=20, ge=1, le=200),
):
    return songs_by_top_artists(start_date, end_date, artist_limit, song_limit)


@app.get("/api/stats/top-artist-on-date")
async def api_top_artist_on_date(ref_date: date = Query(...)):
    result = top_artist_on_date(ref_date)
    return result or {}


@app.get("/api/stats/top-song-on-date")
async def api_top_song_on_date(ref_date: date = Query(...)):
    result = top_song_on_date(ref_date)
    return result or {}


@app.get("/api/stats/artist-on-date")
async def api_artist_on_date(artist: str = Query(..., min_length=1), ref_date: date = Query(...)):
    return artist_on_date(artist.strip(), ref_date)
