# Mapp Fashion · Live Analytics Dashboard

Real-time e-commerce analytics dashboard built with React + FastAPI, consuming a Mapp Intelligence Kafka data stream and the Mapp Analytics API.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, Recharts |
| Backend | Python 3.13, FastAPI, WebSocket |
| Data stream | Kafka via `kafka-python-ng` (NOT `kafka-python` — incompatible with Python 3.13) |
| Analytics API | Mapp Intelligence Analytics API (OAuth2, 6h cache) |
| AI chat | LiteLLM proxy → ChatDrawer component |

## Running locally

```bash
# Backend (always use python -m, uvicorn.exe is blocked by Windows Security)
cd backend
python -m uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm run dev   # http://localhost:5173
```

## Project structure

```
backend/
  main.py                   # FastAPI app, WebSocket /ws/stream, REST endpoints
  kafka_consumer.py         # Kafka consumer (lz4 compression, SASL_SSL)
  mock_stream.py            # Mock event generator (USE_MOCK=true)
  mapp_analytics_client.py  # MI Analytics API client (OAuth2, 6h cache)
  mapp_reports.yaml         # MI report IDs and field configuration
  config.py                 # Pydantic settings, reads from .env
  models/events.py          # Pydantic models

frontend/src/
  main.jsx                  # Entry point, wraps app in DashboardProvider
  App.jsx                   # Tab routing: stream / mi / forecast
  context/
    dashboardContext.js     # createContext (split out for Vite Fast Refresh)
    DashboardContext.jsx    # DashboardProvider — all state + WebSocket
    dashboardSnapshot.js    # getDashboardSnapshot() for AI chat context
  hooks/useStream.js        # WebSocket hook with exponential-backoff reconnect
  components/               # One file per UI component
  styles/index.css          # All styles (single file)
  audio/cashRegister.js     # Purchase/cart sound effects
```

## Environment (.env in backend/)

```
USE_MOCK=false              # true = mock stream, false = Kafka

KAFKA_BOOTSTRAP_SERVERS=...
KAFKA_USERNAME=...
KAFKA_PASSWORD=...
KAFKA_TOPIC=278095417112569.events.all.v1.json

MAPP_CLIENT_ID=...
MAPP_CLIENT_SECRET=...
MAPP_ACCOUNT_ID=...
MAPP_API_BASE_URL=https://intelligence.eu.mapp.com/analytics/api

LITELLM_API_KEY=...
LITELLM_BASE_URL=https://llm-proxy.labs.mapp.com
```

## WebSocket event format

The backend sends raw events with NO `type` wrapper. Detect event type by `msg.interaction`:

```json
{
  "interaction": "buy",
  "product": { "name": "...", "category": "...", "price": 79.99, "emoji": "👗" },
  "adjusted_price": 79.99,
  "cart_items": 1,
  "segment": "loyal",
  "segmentCounts": { "none": 0, "once": 0, "loyal": 0, "returner": 0 },
  "return_risk": { "level": "high", "rate": 0.28 },
  "timestamp": "2025-03-18T14:32:01Z"
}
```

Aggregate messages have `msg.type === 'aggregate'`. Mode is read from `GET /health` on mount (not via WebSocket).

## Segments

`none` · `once` · `loyal` · `returner` — currently **simulated** with weighted random assignment. Real segment lookup (userId → segment) is Phase 3.

## Key architectural decisions

- **Context split**: `DashboardContext.jsx` exports only `DashboardProvider` (component). `dashboardContext.js` holds the context object. This is required for Vite Fast Refresh to work without full page reloads.
- **useStream StrictMode fix**: `active.current = true` is reset at the start of each `useEffect` call to handle React StrictMode's double-mount behavior.
- **Mode indicator**: fetched from `GET /health` on mount — backend never pushes a mode WebSocket message.

## Simulated data (not yet live)

Segments, visitor pool, and historical/e-commerce tabs are simulated. See `docs/DATA_SOURCES.md` for the full breakdown and `docs/ROADMAP.md` for the plan to replace them.

## Known gotchas

- `kafka-python` crashes on Python 3.13 — use `kafka-python-ng`
- `uvicorn.exe` is blocked by Windows Security — always run as `python -m uvicorn`
- Forecast tab hardcodes €41K daily revenue / 167 orders as baseline until MI live data replaces it
