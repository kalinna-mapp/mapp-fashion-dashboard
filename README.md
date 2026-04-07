# Mapp Fashion · Live Analytics Dashboard

Real-time product interaction stream powered by **Mapp Intelligence Data Streams (Kafka)**.
Segments, historical data, and visitor counts are simulated until the corresponding
data connections are available.

---

## Quick Start — 3 Steps

### 1 · Configure environment

```bash
cp .env.example .env
# Edit .env — set USE_MOCK=true to run without Kafka credentials
```

### 2 · Start the backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3 · Start the frontend

```bash
cd frontend
npm install
npm run dev
# → Open http://localhost:5173
```

---

## Data Sources at a Glance

| Layer | Source | Status |
|-------|--------|--------|
| Product interactions (view / cart / buy) | ✅ Mapp Data Stream · Kafka | Ready — add credentials to `.env` |
| Revenue, cart value, orders (live) | ✅ Derived from Kafka events | Ready — add credentials to `.env` |
| Visitor segments (Non-Customer / One-Time / Loyal / Returner) | ⚡ Simulated | No real-time join available yet |
| Live visitor counts per segment | ⚡ Simulated | Sliding-window pool |
| Historical traffic & e-commerce | ⚡ Simulated | Wire Analytics API in next sprint |
| Season filter (FW / HW) | ⚡ Simulated | Static date ranges |

> **⚡ Simulated** badges appear in the UI wherever data is mocked —
> so it is always clear which numbers can be trusted.

See [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) for the full field-level mapping.

---

## Switching to Live Kafka

1. Set `USE_MOCK=false` in `.env`
2. Fill in the `KAFKA_*` values from **Mapp Intelligence → Data Streams → Connection Information**
3. Restart the backend — the frontend requires no changes
4. The LIVE pill in the header turns from amber (MOCK) to green (LIVE)

---

## Audio

Purchase events trigger a **vintage cash register sound** built with the Web Audio API —
no audio files, no external dependencies.

Click **🔔 Sound** in the header to toggle.
First click anywhere on the page unlocks the AudioContext (browser requirement).

---

## Colour System

Extracted from [mapp.com/de/mapp-fashion/](https://mapp.com/de/mapp-fashion/)

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#EDE8E0` | Page background (creamy off-white) |
| `--navy` | `#2D2A5E` | Header, primary dark |
| `--violet` | `#7B6FE8` | Primary accent — Mapp brand violet |
| `--pink` | `#EC4899` | Cart / secondary accent |
| `--green` | `#10B981` | Purchase / success |
| `--amber` | `#F59E0B` | Returner segment / simulated badge |

---

## Documentation

| File | Content |
|------|---------|
| [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) | Full data source mapping — what is real vs. simulated |
| [`docs/KAFKA_FIELDS.md`](docs/KAFKA_FIELDS.md) | Mapp Kafka event schema and field reference |
| [`docs/SIMULATED.md`](docs/SIMULATED.md) | Simulation logic, weights, and roadmap to production |
| [`docs/PROMPT.md`](docs/PROMPT.md) | Original development prompt used to build this dashboard |
