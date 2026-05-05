# Mapp Fashion · Live Analytics Dashboard

> **Purpose of this file:** Central configuration and reference document for the project.
> All relevant settings, API details, structures, and decisions in one place.

---

## Project Overview

| | |
|---|---|
| **GitHub** | https://github.com/kalinna-mapp/mapp-fashion-dashboard |
| **Local** | `C:\Dev\Projekte\mapp-fashion-dashboard\` |
| **Stack** | Python 3.13 · FastAPI · Kafka · Mapp Intelligence Analytics API · React 18 · Recharts · Vite |

### Start

```bash
# Backend
python -m uvicorn main:app --reload --port 8000

# Frontend
npm run dev   →   http://localhost:5173
```

> ⚠️ `uvicorn.exe` is blocked by Windows Security → always use `python -m uvicorn`

---

## Project Structure

```
backend/
  main.py                  # FastAPI, WebSocket, REST
  kafka_consumer.py        # Kafka Consumer (lz4)
  mapp_analytics_client.py # MI API Client (OAuth2, 6h Cache)
  mock_stream.py           # Fallback when no Kafka
  mock_data.py             # Static mock data (Historical, E-Commerce)
  mapp_reports.yaml        # MI report configuration (IDs, fields)
  config.py                # Settings / env vars
  models/
    events.py              # Pydantic models (InteractionEvent, SegmentCounts …)
  routers/                 # FastAPI routers (modular)
  test_baseline.py         # Smoke test for MI baseline fetch

frontend/
  index.html               # HTML shell
  vite.config.js
  src/
    main.jsx               # React entry point
    App.jsx                # Root component, tab routing
    components/            # CartDistribution · CategoryHeatmap · EventLog
                           # FilterBar · GlobalKpiStrip · Header
                           # InteractionCounters · RevenueTable
                           # RunwayLanes · SegmentCards
    context/
      DashboardContext.jsx  # Global state (stream, KPIs, filters)
    hooks/
      useStream.js          # WebSocket hook
    audio/
      cashRegister.js       # Sound feedback on purchase events
    styles/

docs/                      # Technical reference documentation
  DASHBOARD.md             # ← this file
  DATA_SOURCES.md
  KAFKA_FIELDS.md
  ROADMAP.md               # Phase 1–5 migration mock → production
  SIMULATED.md
  PROMPT.md
```

---

## Dashboard Tabs

| Tab | Data Source | Status |
|-----|-------------|--------|
| ⬤ Live Stream | Kafka (real-time events) | ✅ Live |
| 📈 Historical | Mock JSON | ⚡ Simulated → Backlog #2 |
| 🛍 E-Commerce | Mock JSON | ⚡ Simulated → Backlog #2 |
| ✦ MI Baseline | MI Analytics API (report) | ✅ Live |
| ◎ Forecast | Live session + MI Baseline | ✅ Live |

---

## Design / Colors

```css
--bg:     #EDE8E0   /* Background (warm white) */
--navy:   #2D2A5E   /* Primary (dark blue) */
--violet: #7B6FE8   /* Accent (violet) */
--pink:   #EC4899   /* Highlight (pink) */
--green:  #10B981   /* Positive (green) */
```

---

## Return Risk System

Each Kafka event is enriched **backend-side** with `returnRisk`.

| Level | Threshold | Color |
|-------|-----------|-------|
| High | ≥ 25% | 🔴 Red |
| Medium | ≥ 15% | 🟡 Yellow |
| Low | ≥ 8% | 🔵 Blue |
| Minimal | < 8% | ⚪ Grey |

**Baseline values (from MI report):**
- Avg. return rate: **13.6%**
- Top category: **Outerwear 14.1%**

---

## Kafka

| Setting | Value |
|---|---|
| Topic | `278095417112569.events.all.v1.json` |
| Compression | `lz4` |
| Library | `kafka-python-ng` (not `kafka-python` — incompatible with Python 3.13) |
| Fallback | `mock_stream.py` when Kafka is not reachable |

---

## Mapp Intelligence API

### Authentication

```
POST https://intelligence.eu.mapp.com/analytics/api/oauth/token
  ?grant_type=client_credentials&scope=mapp.intelligence-api

Auth: Basic base64(CLIENT_ID:CLIENT_SECRET)

→ { "access_token": "...", ... }   (valid ~12h)
```

### Concept: Report vs. Analysis

#### Report (`POST /report-query`)
- Pre-configured in the MI UI with a fixed **report ID**
- JSON configuration comes directly from the UI (export function)
- Only the **time range** (`timeFilter`) can be adjusted at runtime
- Ideal for stable, recurring data queries
- Currently used for: **MI Baseline Tab**

#### Analysis (`POST /analysis-query`)
- No setup in the UI required — query is built **on the fly in code**
- Flexible: any metrics, dimensions, filters
- Ideal for dynamic queries
- Planned for: **Historical Tab, E-Commerce Tab** (Backlog #2)

---

### Report Query (currently in use)

**Endpoint:** `POST /analytics/api/report-query`

**Report ID:** `1176`

**Element IDs:**

| Element ID | Content | Dimension (`name`) |
|---|---|---|
| `259656` | Product SKUs | `product` |
| `259658` | Categories | `product_category_text_2` |
| `259660` | Occasions | `product_category_text_12` |

**Request body (example for element 259656):**

```json
{
  "reportId": 1176,
  "queryStates": [
    {
      "calculationId": 259656,
      "configuration": {
        "columns": [
          {
            "name": "product",
            "scope": "OBJECT",
            "context": "ATOMIC",
            "variant": "NORMAL",
            "lowerLimit": 1,
            "upperLimit": 200
          },
          {
            "name": "products_viewed_qty",
            "columnPeriod": "ANALYSIS",
            "sortDirection": "DESCENDING",
            "sortIndex": 1,
            "scope": "OBJECT",
            "context": "ATOMIC",
            "variant": "NORMAL"
          },
          {
            "name": "products_purchased_qty",
            "columnPeriod": "ANALYSIS",
            "scope": "OBJECT",
            "context": "ATOMIC",
            "variant": "NORMAL"
          },
          {
            "name": "products_purchased_value",
            "columnPeriod": "ANALYSIS",
            "scope": "OBJECT",
            "context": "ATOMIC",
            "variant": "NORMAL"
          },
          {
            "name": "product_parameter_number_561_qty",
            "columnPeriod": "ANALYSIS",
            "scope": "OBJECT",
            "context": "ATOMIC"
          },
          {
            "name": "product_parameter_number_561_sum",
            "columnPeriod": "ANALYSIS",
            "scope": "OBJECT",
            "context": "ATOMIC"
          }
        ],
        "variant": "LIST"
      }
    }
  ],
  "timeFilter": {
    "name": "time_dynamic",
    "connector": "AND",
    "filterPredicate": "LIKE",
    "value1": "last_28_days",
    "value2": "",
    "context": "NONE",
    "caseSensitive": false
  }
}
```

**Response behaviour:**
- Status is usually immediately `DONE` → no polling needed
- `resultUrl` is available directly in the initial response
- No `statusUrl` when immediately `DONE`

```json
{
  "status": "DONE",
  "queryStates": [
    {
      "calculationId": 259656,
      "status": "DONE",
      "resultUrl": "https://intelligence.eu.mapp.com/analytics/api/analysis-result/..."
    }
  ]
}
```

**Fetching the result:**

```
GET {resultUrl}
Authorization: Bearer {access_token}

→ { "rows": [...], "headers": [...] }
```

---

### Analysis Query (for dynamic queries)

**Endpoint:** `POST /analytics/api/analysis-query`

**Request body (base schema LIST):**

```json
{
  "resultType": "DATA_ONLY",
  "queryObject": {
    "columns": [
      {
        "name": "product",
        "scope": "OBJECT",
        "context": "ATOMIC",
        "variant": "NORMAL",
        "lowerLimit": "1",
        "upperLimit": "200"
      },
      {
        "name": "products_purchased_qty",
        "columnPeriod": "ANALYSIS",
        "sortDirection": "DESCENDING",
        "sortIndex": 0,
        "scope": "OBJECT",
        "context": "ATOMIC",
        "variant": "NORMAL"
      }
    ],
    "variant": "LIST",
    "predefinedContainer": {
      "filters": [
        {
          "name": "time_dynamic",
          "filterPredicate": "LIKE",
          "connector": "AND",
          "caseSensitive": false,
          "context": "NONE",
          "value1": "last_28_days",
          "value2": ""
        }
      ],
      "containers": []
    }
  }
}
```

> ⚠️ Difference from report-query: `lowerLimit`/`upperLimit` are **strings** here, not integers.
> Time filter lives in `queryObject.predefinedContainer.filters[]`, not at the top level.

**Response:**
- `200` → immediately done: `{ "calculationId": "...", "resultUrl": "..." }`
- `201` → async: `{ "correlationId": "...", "statusUrl": "..." }` → poll until `SUCCESS`

**Available `variant` values:** `LIST` · `PIVOT` · `PIVOT_AS_LIST` · `COMPARISON`

**Available `context` values:** `VISITOR` · `SESSION` · `PAGE` · `ACTION` · `ATOMIC` · `NONE`

**Time filter `value1` options (selection):**

```
last_7_days · last_14_days · last_28_days
last_14_days_previous_year
```

For a fixed date range: `"name": "time_range"`, `"filterPredicate": "BETWEEN"`,
`"value1": "2025-01-01 00:00:00"`, `"value2": "2025-01-31 00:00:00"`

---

### Metrics & Dimensions (project-relevant)

| Internal name | Meaning | Type |
|---|---|---|
| `product` | Product SKU | Dimension |
| `product_category_text_2` | Product category | Dimension |
| `product_category_text_12` | Occasion | Dimension |
| `products_viewed_qty` | Number of views | Metric |
| `products_purchased_qty` | Number of purchases | Metric |
| `products_purchased_value` | Revenue (€) | Metric |
| `product_parameter_number_561_qty` | Number of returns | Metric |
| `product_parameter_number_561_sum` | Return value (€) | Metric |

---

### Caching

- Token cache: ~12h (token validity)
- Report data cache: **6h** (configured in `mapp_analytics_client.py`)

---

## Known Issues & Workarounds

| Problem | Solution |
|---|---|
| `kafka-python` incompatible with Python 3.13 | Use `kafka-python-ng` |
| `uvicorn.exe` blocked by Windows Security | Use `python -m uvicorn main:app ...` |

---

## Backlog / Roadmap

Detailed phases: [ROADMAP.md](ROADMAP.md)

| Phase | Task | Status |
|---|---|---|
| 1 | React + FastAPI base structure, Kafka consumer, segment simulation | ✅ Done |
| 2 | Wire Kafka credentials, `USE_MOCK=false`, verify field names | ⬜ Next |
| 3 | Real segments via Mapp MCP or Analytics API (userId lookup) | ⬜ Backlog |
| 4 | Historical & E-Commerce with real MI API (`analysis-query`) | ⬜ Backlog |
| 5 | Returner segment (custom tracking events or OMS/ERP feed) | ⬜ Backlog |
| – | Forecast persistence (localStorage) | ⬜ Backlog |
| – | Replace hardcoded €41K / 167 orders with live data | ⬜ Backlog |
| – | Docker setup for stable deployment | ⬜ Backlog |

---

*Last updated: 2026-04-16*
