# main.py — FastAPI application
# Provides:
#   WS  /ws/stream      Real-time event push (from Kafka or mock)
#   GET /api/historical  Simulated historical traffic
#   GET /api/ecommerce   Simulated e-commerce metrics
#   GET /api/segments    Simulated segment visitor counts
#   GET /health          Shows MOCK or LIVE mode

import asyncio
import json
import random
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from mock_data import (
    HISTORICAL_TRAFFIC, HISTORICAL_DEVICES, HISTORICAL_GEO,
    HISTORICAL_BROWSERS, HISTORICAL_TOP_PAGES,
    ECOMMERCE_DAILY, ECOMMERCE_CATEGORIES,
    SEASON_FW_2025, SEASON_HW_2024, USER_SEGMENTS_ECOMMERCE,
)

app = FastAPI(title="Mapp Fashion Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Event queue shared between producer and WebSocket broadcaster ──────────────
event_queue: asyncio.Queue = asyncio.Queue()

# ── Simulated visitor pool ─────────────────────────────────────────────────────
# SIMULATED — replace with real session × segment join when available
POOL_SIZE = 1400
SEG_WEIGHTS = {"party": 20, "beach": 20, "casual": 20, "work": 20, "date": 20}

def random_seg() -> str:
    segs, weights = zip(*SEG_WEIGHTS.items())
    return random.choices(segs, weights=weights, k=1)[0]

visitor_pool = [random_seg() for _ in range(POOL_SIZE)]

def seg_counts() -> dict:
    counts = {k: 0 for k in SEG_WEIGHTS}
    for s in visitor_pool:
        counts[s] += 1
    return counts


@app.on_event("startup")
async def startup():
    # Start whichever stream source is configured
    if settings.use_mock:
        from mock_stream import consume
        asyncio.create_task(consume(event_queue))
    else:
        from kafka_consumer import consume
        asyncio.create_task(consume(event_queue))

    # Pool drift task — SIMULATED
    asyncio.create_task(drift_pool())


async def drift_pool():
    # SIMULATED — slowly change segment distribution to simulate traffic flow
    while True:
        i = random.randint(0, POOL_SIZE - 1)
        visitor_pool[i] = random_seg()
        await asyncio.sleep(2.4)


# ── WebSocket ──────────────────────────────────────────────────────────────────
connected_clients: list[WebSocket] = []


@app.websocket("/ws/stream")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_clients.append(ws)
    try:
        while True:
            event = await event_queue.get()

            # SIMULATED — segment assigned randomly here, not from real data
            event["segment"] = random_seg()
            event["segmentCounts"] = seg_counts()

            await ws.send_text(json.dumps(event))
    except WebSocketDisconnect:
        connected_clients.remove(ws)


# ── REST Endpoints ─────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "mode": "MOCK" if settings.use_mock else "LIVE",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/historical")
def historical(timeFilter: str = "last7days", season: str = None):
    # SIMULATED — replace with Mapp Analytics API call
    # Endpoint: POST https://intelligence.eu.mapp.com/analytics/api/analysis
    if season == "fw":
        return {"season": SEASON_FW_2025, "traffic": HISTORICAL_TRAFFIC[-28:]}
    if season == "hw":
        return {"season": SEASON_HW_2024, "traffic": HISTORICAL_TRAFFIC[-28:]}
    return {
        "traffic":  HISTORICAL_TRAFFIC,
        "devices":  HISTORICAL_DEVICES,
        "geo":      HISTORICAL_GEO,
        "browsers": HISTORICAL_BROWSERS,
        "topPages": HISTORICAL_TOP_PAGES,
    }


@app.get("/api/ecommerce")
def ecommerce(timeFilter: str = "last30days", season: str = None):
    # SIMULATED — replace with Mapp Analytics API call
    return {
        "daily":      ECOMMERCE_DAILY,
        "categories": ECOMMERCE_CATEGORIES,
        "segments":   USER_SEGMENTS_ECOMMERCE,
        "seasonFw":   SEASON_FW_2025,
        "seasonHw":   SEASON_HW_2024,
    }


@app.get("/api/segments")
def segments():
    # SIMULATED — replace with Mapp MCP GET /segments + visitor join
    return seg_counts()
