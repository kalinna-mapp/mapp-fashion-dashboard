# Mapp Fashion · Live Analytics Dashboard
## Development Prompt — v1.0

---

## Context & Goal

Build a production-ready **single-page analytics dashboard** for a fashion e-commerce brand
powered by **Mapp Intelligence**. The dashboard visualises real-time product interactions
from the **Mapp Data Stream (Kafka)** and simulates all other data (segments, historical
metrics, visitor counts) until the corresponding data connections are available.

The prototype HTML file `mapp-product-stream.html` already exists and defines the complete
UI, colour system, animations, audio, and component structure. This prompt describes how to
**re-implement it as a proper React + FastAPI project** in VS Code with real Data Stream
wiring and clean mock layers for everything else.

---

## Colour System (Mapp Fashion — extracted from mapp.com/de/mapp-fashion/)

```css
:root {
  --bg:            #EDE8E0;   /* page background — creamy off-white          */
  --bg-card:       #FFFFFF;   /* card surface                                 */
  --navy:          #2D2A5E;   /* header, primary dark colour                  */
  --violet:        #7B6FE8;   /* primary accent — Mapp brand violet           */
  --violet-light:  #A89DF0;
  --violet-pale:   #ECE8FD;   /* violet tint for backgrounds / badges         */
  --pink:          #EC4899;   /* secondary accent — cart / energy             */
  --pink-pale:     #FCE7F3;
  --green:         #10B981;   /* purchase / success                           */
  --green-pale:    #D1FAE5;
  --amber:         #F59E0B;   /* returner segment / warning                   */
  --amber-pale:    #FEF3C7;
  --text-dark:     #1A1820;
  --text-mid:      #4A4560;
  --text-muted:    #8B87A0;
  --text-on-dark:  #F5F2FF;
  --border:        rgba(123,111,232,0.13);

  /* Segment colours */
  --seg-none:      #8B87A0;   /* Non-Customer  */
  --seg-once:      #7B6FE8;   /* One-Time Buyer */
  --seg-loyal:     #10B981;   /* Loyal Customer */
  --seg-returner:  #F59E0B;   /* Returner       */
}
```

Background decoration: diagonal pink stripe pattern (repeating-linear-gradient at -18°,
`rgba(236,72,153,0.06)`) fixed to the right side of the viewport.

Fonts: `DM Serif Display` (headings / large numbers) + `DM Sans` (body).
Load from Google Fonts.

---

## Tech Stack

```
/mapp-fashion-dashboard
  /backend
    main.py                   # FastAPI — WebSocket + REST endpoints
    kafka_consumer.py         # Confluent Kafka consumer (real Data Stream)
    mock_stream.py            # Mock event generator (USE_MOCK=true)
    mock_data.py              # Static mock data for segments & historical
    config.py                 # Pydantic settings — all env vars
    requirements.txt
  /frontend
    /src
      /components
        Header.jsx
        SegmentCards.jsx       # 4 clickable segment filter cards
        GlobalKpiStrip.jsx     # 6 KPI tiles at the top
        FilterBar.jsx          # Active segment pills + Show All
        InteractionCounters.jsx
        RunwayLanes.jsx        # Animated product stream (3 lanes)
        RevenueTable.jsx       # Revenue & Cart by Segment incl. % of all
        CartDistribution.jsx   # Avg cart value bars per segment
        EventLog.jsx           # Timestamped event feed
        CategoryHeatmap.jsx
      /hooks
        useStream.js           # WebSocket hook with auto-reconnect
      /audio
        cashRegister.js        # Web Audio API — vintage register sound
      App.jsx
      main.jsx
      index.css
    package.json
    vite.config.js
  .env.example
  README.md
```

---

## Data Sources — What Is Real vs. Simulated

### ✅ REAL — Mapp Data Stream (Kafka / AVRO or JSON)

These fields come directly from the live Data Stream and must NOT be mocked
once the Kafka connection is active:

| Dashboard Element              | Kafka Event Type          | Field(s)                                      |
|-------------------------------|---------------------------|-----------------------------------------------|
| Product View (runway lane)    | `eventType = "page"`      | `productName`, `productCategory`, `productCost`, `contentGroup` |
| Add to Cart (runway lane)     | `eventType = "basket"`, `basketStatus = "add"` | `productName`, `productCategory`, `basketValue`, `basketItems`, `productQuantity` |
| Purchase (runway lane + sound)| `eventType = "order"`, `orderStatus = "conf"` | `productName`, `productCategory`, `orderValue`, `basketItems` |
| Total Revenue (live)          | order events aggregated   | `orderValue` (running sum)                   |
| Open Cart Value               | basket-add minus orders   | `basketValue` (running sum)                  |
| Orders count                  | order events counted      | count of confirmed order events              |
| Avg Cart Size (items)         | basket events             | `basketItems` average                        |
| Product Views count           | page events counted       | count of product page hits                   |
| Revenue / min rate            | order events              | rolling 60s window sum of `orderValue`       |
| Category Heatmap              | all events                | `productCategory` grouped by event type      |

**Kafka connection config** (from Mapp Intelligence → Data Streams → Connection Information):
```python
kafka_config = {
    'bootstrap.servers': 'YOUR_KAFKA_HOST:PORT',
    'group.id':          'fashion-dashboard-consumer',
    'auto.offset.reset': 'latest',
    'security.protocol': 'SASL_SSL',
    'sasl.mechanism':    'SCRAM-SHA-256',
    'sasl.username':     'YOUR_USERNAME',
    'sasl.password':     'YOUR_PASSWORD',
}
```

### 🟡 SIMULATED — All Other Data

These are simulated until the corresponding data connections are built.
Each simulation must be **clearly flagged in the UI** with a small
`⚡ Simulated` badge visible on the relevant component.

| Dashboard Element                      | Why Simulated                                                        | Simulation Strategy                                                                                    |
|---------------------------------------|----------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------|
| **Segment assignment per event**      | No real-time join between Data Stream userId and Mapp segment data  | Randomly assign segments using weighted probabilities per event (see weights below)                   |
| **Live visitor count per segment**    | Needs sliding-window join of active sessionIds + segment lookup      | Maintain a simulated visitor pool of ~1,400 users; drift it slowly every 2–3 s                       |
| **Non-Customer** (0 orders)           | Purchase history not in Data Stream                                  | Weight: 40% of events                                                                                 |
| **One-Time Buyer** (1 order)          | Purchase history not in Data Stream                                  | Weight: 30% of events                                                                                 |
| **Loyal Customer** (3+ orders)        | Purchase history not in Data Stream                                  | Weight: 18% of events                                                                                 |
| **Returner** (has return history)     | Return events not standard in Mapp Intelligence Data Stream          | Weight: 12% of events                                                                                 |
| **Segment behavioral multipliers**    | —                                                                    | Loyal → 1.8× buy prob, 1.2× price, 2.6 items/cart. Returner → 0.7× buy, 1.4× cart. Non-Customer → 0.4× buy. One-Time → baseline |
| **Historical traffic data**           | Analytics API not yet wired                                          | Static JSON: 30 days of daily visits, page views, bounce rate, device split, geo, browser            |
| **Historical e-commerce data**        | Analytics API not yet wired                                          | Static JSON: daily revenue, orders, AOV, conversion, product category breakdown                       |
| **FW/HW season comparison**           | Requires two Analytics API calls with date ranges                    | Two static JSON datasets: FW 2025 (Feb–Jul) and HW 2024 (Aug–Jan)                                    |
| **User segments in E-Commerce tab**   | Requires CRM / segment join                                          | Fixed percentage split: Loyal 47%, New 31%, Reactivated 14%, Returner 8%                             |

---

## Backend: FastAPI

### Endpoints

```
WS  /ws/stream          Real-time push — aggregated Kafka events every 2 s
GET /api/historical     Mock historical traffic (time filter param)
GET /api/ecommerce      Mock e-commerce metrics (time filter + season param)
GET /api/segments       Mock segment visitor counts
GET /health             Status — shows MOCK or LIVE mode
```

### WebSocket Message Schema

Every 2 seconds the backend pushes one JSON message:

```json
{
  "type": "event",
  "interaction": "buy",          // "view" | "cart" | "buy"
  "product": {
    "name": "Summer Dress Lina",
    "category": "Dresses",
    "price": 94.99,
    "emoji": "👗"
  },
  "segment": "loyal",            // SIMULATED — randomly assigned
  "adjustedPrice": 113.99,       // price × segment multiplier × cart items
  "cartItems": 2,
  "timestamp": "2025-03-18T14:32:01Z"
}
```

And a separate aggregate message every 5 s:

```json
{
  "type": "aggregate",
  "revenue":    4280.50,
  "cartValue":  1840.20,
  "orders":     47,
  "cartCount":  38,
  "cartItems":  81,
  "views":      1240,
  "rateRevenue": 340.00,
  "segmentCounts": {
    "none": 562, "once": 421, "loyal": 252, "returner": 165
  }
}
```

### Mock Event Generator (`mock_stream.py`)

When `USE_MOCK=true`, the backend generates synthetic events that match
the Kafka schema exactly. Products are drawn from the fashion catalogue
below. Event types follow the same weighted probabilities as the real stream
processing (view 60%, cart 28%, buy 12%).

Segments are **always simulated** (even in LIVE mode) until a real join
is implemented — this must be clearly stated in the code comments.

---

## Frontend: React Components

### 1. Header

Fixed top bar, navy background. Contains:
- Logo: "Mapp Fashion · Live Product Stream" (DM Serif Display)
- Speed control: Slow / Normal / Fast buttons
- Pause button
- 🔔 / 🔕 Sound toggle (see Audio section)
- LIVE pill (green, pulsing dot)

### 2. Global KPI Strip (`GlobalKpiStrip.jsx`)

6 cards in a grid row. Updates from WebSocket aggregate messages.

| KPI             | Colour     | Sub-line                        |
|----------------|------------|--------------------------------|
| Total Revenue  | green      | `€/min` rate from 60s window   |
| Cart Value     | pink       | `N items in carts`             |
| Orders         | violet     | `Ø €X / order`                 |
| Avg Cart Size  | amber      | `items per cart`               |
| Product Views  | violet-light | `N / min`                   |
| Conversion Rate| navy       | `views → purchase, live`       |

Each card has a 3px top border in its colour. Large number in DM Serif Display.

### 3. Segment Cards (`SegmentCards.jsx`)

4 clickable cards in a grid row. Each card:
- Top border 3px in segment colour
- Segment icon + checkmark (filled when active, outline when inactive)
- Large visitor count (DM Serif Display, segment colour)
- % share of total visitors
- 3-metric grid: **Revenue / Cart Value / Avg Order** — each with value + sub-line
- Mini 8-bar sparkline (last 8 updates)
- `⚡ Simulated` badge on visitor count and segment metrics (since segment assignment is mocked)

Segment definitions:
```js
const SEGS = [
  { id:'none',     label:'Non-Customer',   icon:'👤', color:'#8B87A0', weight:40,
    buyMulti:0.4, cartMulti:0.6, cartItems:1.2 },
  { id:'once',     label:'One-Time Buyer', icon:'🛍', color:'#7B6FE8', weight:30,
    buyMulti:1.0, cartMulti:1.0, cartItems:1.8 },
  { id:'loyal',    label:'Loyal Customer', icon:'⭐', color:'#10B981', weight:18,
    buyMulti:1.8, cartMulti:0.7, cartItems:2.6 },
  { id:'returner', label:'Returner',       icon:'↩️', color:'#F59E0B', weight:12,
    buyMulti:0.7, cartMulti:1.4, cartItems:2.1 },
];
```

Clicking a card toggles it in/out of the active filter set.
At least 1 segment must always remain active.
Inactive cards dim to 35% opacity.

### 4. Filter Status Bar (`FilterBar.jsx`)

Slim bar below segment cards. Shows coloured pills for each active segment.
"Show All" button resets filter to all 4 segments.

### 5. Interaction Counters (`InteractionCounters.jsx`)

4 small cards: Viewed / Added to Cart / Purchased / Total Events.
Each shows cumulative count + rolling 60s rate.
Counts reset when filter changes.

### 6. Runway Lanes (`RunwayLanes.jsx`)

3 horizontal lanes (Viewed / Cart / Purchased).

Each lane:
- Left label column (118px wide, sticky)
- Dashed track line
- Fade edges (gradient left + right)

Product cards animate left → right using CSS `animation: ride linear forwards`.
Each card contains:
- Product emoji
- Product name + category
- Segment colour dot (9px circle, white ring — segment is simulated)
- Interaction type tag (coloured pill)
- Price in matching colour (green for buy, pink for cart, muted for view)
- Price shows adjusted total: `€113.99 ×2` when cartItems > 1

Animation durations: Slow = 14s, Normal = 9s, Fast = 5s.
Purchase cards also trigger `buyFlash` keyframe (green glow pulse).

Card colours:
- view: violet-pale background, violet border
- cart: pink-pale background, pink border
- buy:  green-pale background, green border

### 7. Revenue & Cart Value by Segment (`RevenueTable.jsx`)

Table with columns: [icon] [Segment / visitors online] [Revenue + % of all] [Cart Value + % of all] [Orders + % of all]

Row layout per metric cell:
```
€ 312          ← large value, segment colour
  37%          ← % of all, small, dimmed
```

First row: **🌐 All Visitors** — always shows 100% for each metric,
navy colour, gradient bar, slight dark background.

Then one row per active segment, with coloured horizontal bar below
(width = segment revenue / total revenue × 100%).

All % values calculated against **all 4 segments combined**,
even when filter is active — this keeps the context visible.

### 8. Cart Distribution (`CartDistribution.jsx`)

Horizontal bar chart: one bar per active segment showing average cart value.
Bar label: segment icon + name | bar | €value | N items.
Max bar = 100% width (relative to highest avg cart value).

### 9. Event Log (`EventLog.jsx`)

Scrolling log, max 10 rows visible (overflow hidden, prepend + trim).
Columns: time | emoji | product name | segment badge | interaction type | price.
New rows animate in from the left (`slideIn` keyframe).
Hover highlights row in violet-pale.

### 10. Category Heatmap (`CategoryHeatmap.jsx`)

6 cells in a 3×2 grid (Dresses, Shoes, Jackets, Accessories, Trousers, Swimwear).
Each cell: category name | total interaction count | 3-segment mini-bar (violet/pink/green).
Cell background intensity scales with activity relative to most-active category.
Brief scale pulse on update (scale 1.04 → 1 over 280ms).

---

## Audio: Vintage Cash Register (`cashRegister.js`)

Implemented with the **Web Audio API** — no audio files, no external dependencies.

### Purchase Sound — full 5-layer sequence:

```
t+0.000s  Mechanical key thud    — bandpass noise burst (220Hz + 480Hz)
t+0.045s  Latch click            — sharper click (900Hz + 1600Hz)
t+0.100s  Drawer thud            — low impact (140Hz + 300Hz)
t+0.140s  Cha-ching bell ring    — 3 detuned triangle waves (E6, F6, G6) + shimmer
t+0.220s  Coin shimmer tail      — highpass noise (>4kHz) fading to 0.6s
```

### Cart Add Sound:
Single soft mechanical click — two bandpass noise bursts (320Hz, 700Hz), very quiet.

### Sound Toggle Button (🔔 / 🔕):
- Mounted in the Header, right of Pause
- Active state: green pill style (`rgba(16,185,129,0.18)` bg, `#6EE7B7` text)
- Muted state: dimmed white, 55% opacity
- On unmute: plays buy sound as preview
- `AudioContext` is created and resumed on first user click anywhere on page
  (required by browser autoplay policy)

---

## Simulation Details

### Mock Product Catalogue

```js
const PRODUCTS = [
  { name:'Summer Dress Lina',   cat:'Dresses',     price:79.99,  emoji:'👗' },
  { name:'Floral Midi Skirt',   cat:'Dresses',     price:59.99,  emoji:'👗' },
  { name:'Wrap Dress Sienna',   cat:'Dresses',     price:94.99,  emoji:'👗' },
  { name:'Linen Dress Mara',    cat:'Dresses',     price:69.99,  emoji:'👗' },
  { name:'Cloud Run Sneaker',   cat:'Shoes',       price:129.99, emoji:'👟' },
  { name:'Palma Sandal',        cat:'Shoes',       price:89.99,  emoji:'👡' },
  { name:'Satin Mule Nude',     cat:'Shoes',       price:74.99,  emoji:'👡' },
  { name:'Ecru Linen Blazer',   cat:'Jackets',     price:149.99, emoji:'🧥' },
  { name:'Washed Denim Jacket', cat:'Jackets',     price:119.99, emoji:'🧥' },
  { name:'Silk Scarf Tulum',    cat:'Accessories', price:39.99,  emoji:'🧣' },
  { name:'Straw Bag Ibiza',     cat:'Accessories', price:54.99,  emoji:'👜' },
  { name:'Riviera Sunglasses',  cat:'Accessories', price:44.99,  emoji:'🕶️' },
  { name:'Wide-Leg Jeans Maya', cat:'Trousers',    price:99.99,  emoji:'👖' },
  { name:'Linen Capri Pants',   cat:'Trousers',    price:79.99,  emoji:'👖' },
  { name:'Coral Bikini Set',    cat:'Swimwear',    price:69.99,  emoji:'👙' },
  { name:'Riviera Swimsuit',    cat:'Swimwear',    price:84.99,  emoji:'🩱' },
];
```

### Adjusted Price per Segment

```js
function adjPrice(basePrice, segId, intType) {
  const priceMulti = { none:0.85, once:1.0, loyal:1.2, returner:0.95 }[segId];
  const seg = SEGS.find(s => s.id === segId);
  const items = Math.max(1, Math.round(seg.cartItems + (Math.random() - 0.5)));
  const price = basePrice * priceMulti * (intType === 'view' ? 1 : items);
  return { price: +price.toFixed(2), items };
}
```

### Visitor Pool Drift

Maintain an array of 1,400 segment IDs. Every 2.4 seconds, randomly
replace one entry with a new weighted segment pick. Rebuild per-segment
counts from the pool. Push counts in the aggregate WebSocket message.

### Event Spawn Rate

| Speed  | Backend push interval | Frontend card duration |
|--------|----------------------|----------------------|
| Slow   | 2000ms               | 14s                  |
| Normal | 1000ms               | 9s                   |
| Fast   | 500ms               | 5s                   |

30% chance of a second event 380ms after the first (burst simulation).

---

## Environment Variables (`.env.example`)

```env
# ── Data Stream (Mapp Intelligence → Data Streams → Connection Info)
KAFKA_BOOTSTRAP_SERVERS=your-kafka-host:9093
KAFKA_USERNAME=your-username
KAFKA_PASSWORD=your-password
KAFKA_TOPIC=your-topic-name
KAFKA_GROUP_ID=fashion-dashboard-consumer

# ── Mapp Analytics API (for future historical data)
MAPP_CLIENT_ID=your-client-id
MAPP_CLIENT_SECRET=your-client-secret
MAPP_API_BASE_URL=https://intelligence.eu.mapp.com/analytics/api

# ── Mode
USE_MOCK=true        # true = use mock_stream.py, false = use real Kafka
CORS_ORIGINS=http://localhost:5173
```

When `USE_MOCK=true`:
- `kafka_consumer.py` is bypassed entirely
- `mock_stream.py` generates events at the configured interval
- All Kafka fields are populated with data from the mock catalogue
- The `/health` endpoint returns `{ "mode": "MOCK" }`
- The LIVE pill in the header changes to "MOCK" in amber colour

When `USE_MOCK=false`:
- Real Kafka consumer runs
- Segment assignment is still simulated (no real join available)
- All segment-related UI elements keep the `⚡ Simulated` badge

---

## Simulated vs. Real — UI Labelling Rules

1. Any metric derived **entirely from the Data Stream** → no badge
2. Any metric that is **simulated or partially mocked** → show `⚡ Sim` badge
   (11px amber text, amber-pale background, positioned top-right of the value)
3. The runway lanes themselves show real product data (name, category, price)
   from the stream but the **segment dot** is simulated → tooltip on the dot:
   `"Segment assignment is simulated"`
4. In MOCK mode: header LIVE pill becomes **"MOCK"** in amber

---

## Output — Deliver in This Order

1. Full project folder structure with **all files** — no TODOs, no placeholders
2. `requirements.txt` + `package.json` with pinned dependencies
3. `kafka_consumer.py` — parses AVRO or JSON Mapp events, emits normalised dicts
4. `mock_stream.py` — mirrors the same output interface as `kafka_consumer.py`
5. `main.py` — FastAPI with WebSocket + REST, switches between real/mock via env var
6. All React components — pixel-faithful to the prototype colour system above
7. `cashRegister.js` — exact Web Audio implementation as specified
8. `README.md` — setup in 3 steps: install → set `.env` → run

---

## Code Quality Rules

- No `# TODO`, no placeholder comments, no stub functions
- All async/await throughout the backend
- Kafka credentials only via environment variables, never hardcoded
- All simulated data clearly marked in code comments:
  `# SIMULATED — replace with real data source: [description]`
- TypeScript optional, plain JSX is fine
- No UI library required; Tailwind CSS allowed for layout utilities
- Chart library: Recharts or Chart.js (CDN via cdnjs.cloudflare.com)
- Audio: Web Audio API only — no audio files, no external audio libraries
