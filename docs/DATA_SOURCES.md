# Data Sources

Full mapping of every dashboard metric to its data source.

## Legend

| Badge | Meaning |
|-------|---------|
| ✅ Kafka Stream | Real-time from Mapp Data Stream — available now |
| ✅ Analytics API | Mapp Analytics API — available now |
| ⚡ Simulated | Mocked until real connection is built |

---

## Live Product Stream (Runway)

| Metric | Source | Kafka Field(s) |
|--------|--------|----------------|
| Product View event | ✅ Kafka | `eventType="page"` |
| Add to Cart event | ✅ Kafka | `eventType="basket"`, `basketStatus="add"` |
| Purchase event | ✅ Kafka | `eventType="order"`, `orderStatus="conf"` |
| Product Name | ✅ Kafka | `productName` |
| Product Category | ✅ Kafka | `productCategory` / `contentGroup` |
| Product Price | ✅ Kafka | `productCost` / `basketValue` / `orderValue` |
| Cart Item Count | ✅ Kafka | `basketItems` / `productQuantity` |

## Global KPIs

| Metric | Source | Notes |
|--------|--------|-------|
| Total Revenue (live) | ✅ Kafka | Running sum of `orderValue` |
| Open Cart Value | ✅ Kafka | Running sum of `basketValue` |
| Orders | ✅ Kafka | Count of confirmed order events |
| Avg Cart Size | ✅ Kafka | Mean `basketItems` per basket event |
| Product Views | ✅ Kafka | Count of product page events |
| Conversion Rate | ✅ Kafka | Derived: orders ÷ views |
| Revenue / min | ✅ Kafka | Rolling 60s window sum |

## Visitor Segments

| Metric | Source | Notes |
|--------|--------|-------|
| Segment per event | ⚡ Simulated | Random weighted assignment — no UserId→Segment join yet |
| Live visitors per segment | ⚡ Simulated | Visitor pool drift (~1,400 pool, slow drift every 2.4s) |
| Non-Customer (0 orders) | ⚡ Simulated | Weight: 40% |
| One-Time Buyer (1 order) | ⚡ Simulated | Weight: 30% |
| Loyal Customer (3+ orders) | ⚡ Simulated | Weight: 18% |
| Returner (has returns) | ⚡ Simulated | Weight: 12% |
| Revenue per segment | ⚡ Simulated | Derived from simulated segment assignment |
| Cart Value per segment | ⚡ Simulated | Derived from simulated segment assignment |

## Historical Data

| Metric | Source | Notes |
|--------|--------|-------|
| Visits / Sessions | ⚡ Simulated | Replace: Analytics API `metric: "Visits"` |
| Page Impressions | ⚡ Simulated | Replace: Analytics API `metric: "Page Impressions"` |
| Bounce Rate | ⚡ Simulated | Replace: Analytics API `metric: "Bounce Rate"` |
| Device breakdown | ⚡ Simulated | Replace: Analytics API `dimension: "Device Type"` |
| Country / Geo | ⚡ Simulated | Replace: Analytics API `dimension: "Country"` |
| Revenue (historical) | ⚡ Simulated | Replace: Analytics API `metric: "Revenue"` |
| Orders (historical) | ⚡ Simulated | Replace: Analytics API `metric: "Orders"` |
| Product Categories | ⚡ Simulated | Replace: Analytics API `dimension: "Product Category"` |
| Season filter (FW/HW) | ⚡ Simulated | Replace: Analytics API custom date range |
