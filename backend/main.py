# main.py — FastAPI application
# Provides:
#   WS  /ws/stream        Real-time event push (from Kafka or mock) + MI return risk
#   GET /api/baseline     MI return rate baseline (by SKU, category, occasion)
#   GET /api/historical   Simulated historical traffic
#   GET /api/ecommerce    Simulated e-commerce metrics
#   GET /api/segments     Simulated segment visitor counts
#   GET /health           Shows MOCK or LIVE mode + baseline status

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

# ── Event queue ────────────────────────────────────────────────────────────────
event_queue: asyncio.Queue = asyncio.Queue()

# ── Simulated visitor pool ─────────────────────────────────────────────────────
POOL_SIZE   = 1400
SEG_WEIGHTS = {"none": 40, "once": 30, "loyal": 18, "returner": 12}

def random_seg() -> str:
    segs, weights = zip(*SEG_WEIGHTS.items())
    return random.choices(segs, weights=weights, k=1)[0]

visitor_pool = [random_seg() for _ in range(POOL_SIZE)]

def seg_counts() -> dict:
    counts = {k: 0 for k in SEG_WEIGHTS}
    for s in visitor_pool:
        counts[s] += 1
    return counts


# ── Startup ────────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    # 1. Start Kafka or mock stream
    if settings.use_mock:
        from mock_stream import consume
        asyncio.create_task(consume(event_queue))
    else:
        from kafka_consumer import consume
        asyncio.create_task(consume(event_queue))

    # 2. Load MI baseline (only if credentials are configured)
    if settings.mapp_client_id and settings.mapp_client_secret:
        asyncio.create_task(_load_baseline())
    else:
        print("[MI] No Analytics API credentials — baseline disabled")

    # 3. Visitor pool drift
    asyncio.create_task(drift_pool())


async def _load_baseline():
    """Load MI baseline on startup — runs in background, non-blocking."""
    try:
        from mapp_analytics_client import baseline_cache
        await baseline_cache.get()
        print("[MI] Baseline ready ✓")
    except Exception as e:
        print(f"[MI] Baseline load failed: {e} — dashboard continues without it")


async def drift_pool():
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

            # Assign simulated segment
            event["segment"]       = random_seg()
            event["segmentCounts"] = seg_counts()

            # Enrich with MI return risk if baseline available
            if settings.mapp_client_id and settings.mapp_client_secret:
                try:
                    from mapp_analytics_client import baseline_cache, enrich_event_with_risk
                    baseline = await baseline_cache.get()
                    event    = await enrich_event_with_risk(event, baseline)
                except Exception:
                    pass  # baseline unavailable — send event without risk data

            await ws.send_text(json.dumps(event))
    except WebSocketDisconnect:
        connected_clients.remove(ws)


# ── REST Endpoints ─────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    baseline_status = "disabled"
    if settings.mapp_client_id and settings.mapp_client_secret:
        try:
            from mapp_analytics_client import baseline_cache
            if baseline_cache._data:
                baseline_status = "loaded"
                summary = baseline_cache._data.get("summary", {})
            else:
                baseline_status = "loading"
                summary = {}
        except Exception:
            baseline_status = "error"
            summary = {}
    else:
        summary = {}

    return {
        "status":    "ok",
        "mode":      "MOCK" if settings.use_mock else "LIVE",
        "baseline":  baseline_status,
        "summary":   summary,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/baseline")
async def get_baseline():
    """Return the full MI baseline data for the dashboard's MI layer."""
    if not (settings.mapp_client_id and settings.mapp_client_secret):
        return {"error": "MI Analytics API not configured", "data": None}
    try:
        from mapp_analytics_client import baseline_cache
        data = await baseline_cache.get()
        return {
            "by_category": data["by_category"],
            "by_occasion": data["by_occasion"],
            "by_sku":      data["by_sku"][:50],  # top 50 for UI
            "summary":     data["summary"],
        }
    except Exception as e:
        return {"error": str(e), "data": None}


@app.post("/api/baseline/refresh")
async def refresh_baseline():
    """Force-refresh the MI baseline cache."""
    try:
        from mapp_analytics_client import baseline_cache
        baseline_cache.invalidate()
        data = await baseline_cache.get()
        return {"status": "ok", "summary": data["summary"]}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/api/historical")
def historical(timeFilter: str = "last7days", season: str = None):
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
    return {
        "daily":      ECOMMERCE_DAILY,
        "categories": ECOMMERCE_CATEGORIES,
        "segments":   USER_SEGMENTS_ECOMMERCE,
        "seasonFw":   SEASON_FW_2025,
        "seasonHw":   SEASON_HW_2024,
    }


@app.get("/api/segments")
def segments():
    return seg_counts()
