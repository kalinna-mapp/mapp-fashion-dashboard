# Roadmap — Mock → Production

## Phase 1 · Now (current state)
- [x] Full UI prototype in HTML
- [x] React + FastAPI project structure
- [x] Real Kafka consumer wired (USE_MOCK=false ready)
- [x] All Kafka event fields mapped and normalised
- [x] Segment assignment simulated with realistic weights

## Phase 2 · Connect Kafka (next step)
- [ ] Obtain Kafka credentials from Mapp Intelligence
  - Data Streams → your stream → Connection Information
- [ ] Set USE_MOCK=false in .env
- [ ] Verify field names match actual stream schema
  - Check: productName, productCategory, basketValue, orderValue, basketItems
- [ ] Test with real events — all live KPIs should update automatically

## Phase 3 · Real Segments
**Requirement:** Join between live Kafka `userId` / `customerId` and
Mapp Intelligence segment membership.

Options (choose one):
- **Option A — Mapp MCP:** Use Mapp Intelligence MCP `GET /segments`
  to load segment definitions, then match userId at event processing time.
  Requires: segment membership list available via MCP.
- **Option B — Analytics API:** Query segment membership via
  `GET intelligence.eu.mapp.com/analytics/api/segments` periodically
  and maintain a local lookup cache.
- **Option C — CRM / OMS feed:** If purchase history lives in an
  external system, build a webhook or nightly sync to populate a
  userId → segment map in Redis or a lightweight DB.

When implemented: remove ⚡ Simulated badges from segment cards.

## Phase 4 · Real Historical Data
- [ ] Wire Analytics API client (`mapp_analytics_client.py`)
- [ ] Replace mock JSON in `GET /api/historical` and `GET /api/ecommerce`
  with real API calls using the Analytics API credentials
- [ ] Implement season date range logic (FW: Feb–Jul, HW: Aug–Jan)

## Phase 5 · Returner Segment
Returner data is not a standard Mapp Intelligence event.
Options:
- Track return events as custom Mapp tracking events (requires tagging work)
- Feed return data from OMS/ERP via webhook into a side channel
