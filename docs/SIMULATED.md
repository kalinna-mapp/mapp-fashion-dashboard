# Simulation Logic Documentation

All simulated data is clearly marked with **⚡ Sim** badges in the UI.
This document explains the strategy for each mocked element and the
roadmap to replace each simulation with real data.

---

## 1 · Visitor Segments

### Why Simulated
There is currently no real-time join between the Mapp Data Stream `userId`
field and the segment membership data in Mapp Intelligence. Such a join
would require one of:

- A pre-built lookup table populated from the Analytics API or MCP, refreshed periodically
- A dedicated segment-assignment microservice running alongside the Kafka consumer
- Custom event parameters added to the Mapp tracking pixel at collection time

### Simulation Strategy
Each incoming Kafka event is assigned a segment using weighted random selection:

| Segment | Weight | Behavioral Reasoning |
|---------|--------|----------------------|
| Non-Customer | 40% | Majority of fashion site visitors browse without buying |
| One-Time Buyer | 30% | Second-largest group in e-commerce |
| Loyal Customer | 18% | Smaller but highest-value group |
| Returner | 12% | Smallest group — return behaviour is specific and identifiable |

### Behavioral Multipliers
To make the simulation realistic, each segment has purchase-pattern adjustments:

| Segment | Buy Probability | Price Multiplier | Avg Cart Items |
|---------|----------------|-----------------|----------------|
| Non-Customer | 0.4× | 0.85× | 1.2 items |
| One-Time Buyer | 1.0× (baseline) | 1.0× | 1.8 items |
| Loyal Customer | 1.8× | 1.2× | 2.6 items |
| Returner | 0.7× | 0.95× | 2.1 items |

---

## 2 · Live Visitor Counts Per Segment

### Why Simulated
Computing live visitor counts per segment requires a stateful sliding-window
aggregation of active `sessionId`s joined against segment membership —
a complex operation not yet implemented.

### Simulation Strategy
An in-memory pool of 1,400 segment IDs is maintained. Every 2.4 seconds,
one random entry is replaced with a new weighted pick. Per-segment counts
are derived from this pool. Total size drifts by ±3 to simulate natural
traffic variation.

---

## 3 · Historical Traffic & E-Commerce Data

All historical data is served from static JSON in `backend/mock_data.py`.

### Available Datasets

| Dataset Key | Contents |
|-------------|----------|
| `historical_traffic` | 30 days of daily visits, page views, bounce rate, avg session duration |
| `historical_devices` | Desktop / mobile / tablet percentage split |
| `historical_geo` | Top 6 countries by visitor count |
| `historical_browsers` | Browser distribution (Chrome, Firefox, Safari, Edge, Other) |
| `historical_top_pages` | Top 10 pages by visits with page view counts |
| `ecommerce_daily` | 30 days of revenue, orders, AOV, conversion rate |
| `ecommerce_categories` | Revenue by product category (Dresses, Shoes, Jackets, etc.) |
| `season_fw_2025` | Feb–Jul 2025 traffic and revenue data |
| `season_hw_2024` | Aug–Jan 2024–2025 traffic and revenue data |

---

## 4 · Season Filters (FW / HW)

Fashion seasons are defined as fixed date ranges:

| Season | Date Range |
|--------|-----------|
| FW (Frühjahr/Sommer) | 1 February – 31 July |
| HW (Herbst/Winter) | 1 August – 31 January |

In production, these would be passed as `timeFilter` parameters to the
Mapp Analytics API. Currently they select from pre-built mock datasets.

---

## Roadmap — Removing Each Simulation

| Priority | What to Build | Removes Simulation For |
|----------|--------------|------------------------|
| **1** | Set `KAFKA_*` credentials in `.env`, `USE_MOCK=false` | Real product interactions on runway |
| **2** | Implement `mapp_analytics_client.py` + wire `GET /api/historical` | Historical traffic tab |
| **3** | Implement Analytics API for e-commerce endpoint | Historical e-commerce tab |
| **4** | Build segment lookup from MCP `GET /segments` (refresh every N minutes) | Partial segment assignment |
| **5** | Build userId → Segment join service (lookup table in Redis or similar) | Real segment dots on runway |
| **6** | Add custom return event to Mapp tracking pixel, or connect ERP/OMS | Real Returner segment identification |

---

## How to Replace a Simulation

1. Implement the real data source in the relevant backend file
2. Update the endpoint in `main.py` to use the real source
3. Add `# SIMULATED — REPLACED` comment to the old mock code (keep for reference)
4. Remove the `⚡ Sim` badge from the corresponding React component
5. Update `docs/DATA_SOURCES.md` to change ⚡ to ✅ or 🔵
