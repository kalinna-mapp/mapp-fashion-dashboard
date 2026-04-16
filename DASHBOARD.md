# Mapp Fashion · Live Analytics Dashboard

> **Zweck dieser Datei:** Zentrales Konfigurations- und Referenzdokument für das Projekt.  
> Alle relevanten Einstellungen, API-Details, Strukturen und Entscheidungen an einem Ort.

---

## Projekt-Übersicht

| | |
|---|---|
| **GitHub** | https://github.com/kalinna-mapp/mapp-fashion-dashboard |
| **Lokal** | `C:\Dev\Projekte\mapp-fashion-dashboard\` |
| **Stack** | Python 3.13 · FastAPI · Kafka · Mapp Intelligence Analytics API · React 18 · Recharts · Vite |

### Start

```bash
# Backend
python -m uvicorn main:app --reload --port 8000

# Frontend
npm run dev   →   http://localhost:5173
```

> ⚠️ `uvicorn.exe` wird von Windows Security blockiert → immer `python -m uvicorn` verwenden

---

## Projektstruktur

```
backend/
  main.py                  # FastAPI, WebSocket, REST
  kafka_consumer.py        # Kafka Consumer (lz4)
  mapp_analytics_client.py # MI API Client (OAuth2, 6h Cache)
  mock_stream.py           # Fallback wenn kein Kafka
  mock_data.py             # Statische Mock-Daten (Historical, E-Commerce)
  mapp_reports.yaml        # MI Report-Konfiguration (IDs, Felder)
  config.py                # Einstellungen / Env-Vars
  models/
    events.py              # Pydantic-Modelle (InteractionEvent, SegmentCounts …)
  routers/                 # FastAPI Router (modular)
  test_baseline.py         # Smoke-Test für MI Baseline-Abruf

frontend/
  index.html               # HTML-Shell
  vite.config.js
  src/
    main.jsx               # React Entry Point
    App.jsx                # Root-Komponente, Tab-Routing
    index.css
    components/            # CartDistribution · CategoryHeatmap · EventLog
                           # FilterBar · GlobalKpiStrip · Header
                           # InteractionCounters · RevenueTable
                           # RunwayLanes · SegmentCards
    context/
      DashboardContext.jsx  # Globaler State (Stream, KPIs, Filter)
    hooks/
      useStream.js          # WebSocket-Hook
    audio/
      cashRegister.js       # Sound-Feedback bei Kauf-Events
    styles/

docs/                      # Technische Detaildokumentation
  DATA_SOURCES.md
  KAFKA_FIELDS.md
  ROADMAP.md               # Phase 1–5 Migration Mock → Produktion
  SIMULATED.md
  PROMPT.md

prototype/
  mapp-product-stream.html  # Ursprünglicher HTML-Prototyp

DASHBOARD.md               # ← diese Datei
```

---

## Dashboard Tabs

| Tab | Datenquelle | Status |
|-----|-------------|--------|
| ⬤ Live Stream | Kafka (Echtzeit-Events) | ✅ Live |
| 📈 Historical | Mock JSON | ⚡ Simuliert → Backlog #2 |
| 🛍 E-Commerce | Mock JSON | ⚡ Simuliert → Backlog #2 |
| ✦ MI Baseline | MI Analytics API (Report) | ✅ Live |
| ◎ Forecast | Live Session + MI Baseline | ✅ Live |

---

## Design / Farben

```css
--bg:     #EDE8E0   /* Hintergrund (Warmweiß) */
--navy:   #2D2A5E   /* Primär (Dunkelblau) */
--violet: #7B6FE8   /* Akzent (Violett) */
--pink:   #EC4899   /* Highlight (Pink) */
--green:  #10B981   /* Positiv (Grün) */
```

---

## Return Risk System

Jedes Kafka-Event wird **backend-seitig** mit `returnRisk` angereichert.

| Level | Schwellenwert | Farbe |
|-------|--------------|-------|
| High | ≥ 25% | 🔴 Rot |
| Medium | ≥ 15% | 🟡 Gelb |
| Low | ≥ 8% | 🔵 Blau |
| Minimal | < 8% | ⚪ Grau |

**Baseline-Werte (aus MI Report):**
- Ø Return Rate: **13.6%**
- Top-Kategorie: **Outerwear 14.1%**

---

## Kafka

| Einstellung | Wert |
|---|---|
| Topic | `278095417112569.events.all.v1.json` |
| Compression | `lz4` |
| Library | `kafka-python-ng` (nicht `kafka-python`, inkompatibel mit Python 3.13) |
| Fallback | `mock_stream.py` wenn kein Kafka erreichbar |

---

## Mapp Intelligence API

### Authentication

```
POST https://intelligence.eu.mapp.com/analytics/api/oauth/token
  ?grant_type=client_credentials&scope=mapp.intelligence-api

Auth: Basic base64(CLIENT_ID:CLIENT_SECRET)

→ { "access_token": "...", ... }   (gültig ~12h)
```

### Konzept: Report vs. Analyse

#### Report (`POST /report-query`)
- In der MI-UI vorkonfiguriert mit fester **Report-ID**
- JSON-Konfiguration kommt direkt aus der UI (Export-Funktion)
- Zur Laufzeit anpassbar: **nur der Zeitraum** (`timeFilter`)
- Ideal für stabile, wiederkehrende Datenabfragen
- Aktuell genutzt für: **MI Baseline Tab**

#### Analyse (`POST /analysis-query`)
- Keine Vorarbeit in der UI nötig — Query wird **on the fly im Code** gebaut
- Flexibel: beliebige Metriken, Dimensionen, Filter
- Ideal für dynamische Abfragen
- Geplant für: **Historical Tab, E-Commerce Tab** (Backlog #2)

---

### Report-Query (aktuell im Einsatz)

**Endpoint:** `POST /analytics/api/report-query`

**Report-ID:** `1176`

**Element-IDs:**

| Element ID | Inhalt | Dimension (`name`) |
|---|---|---|
| `259656` | Produkt SKUs | `product` |
| `259658` | Kategorien | `product_category_text_2` |
| `259660` | Occasions | `product_category_text_12` |

**Request Body (Beispiel für Element 259656):**

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

**Response-Verhalten:**
- Status ist meistens sofort `DONE` → kein Polling nötig
- `resultUrl` direkt im initialen Response verfügbar
- Kein `statusUrl` bei sofortigem `DONE`

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

**Ergebnis abrufen:**

```
GET {resultUrl}
Authorization: Bearer {access_token}

→ { "rows": [...], "headers": [...] }
```

---

### Analysis-Query (für dynamische Abfragen)

**Endpoint:** `POST /analytics/api/analysis-query`

**Request Body (Basis-Schema LIST):**

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

> ⚠️ Unterschied zu report-query: `lowerLimit`/`upperLimit` sind hier **Strings**, nicht Integers.  
> Zeitfilter sitzt in `queryObject.predefinedContainer.filters[]`, nicht auf Top-Level.

**Response:**
- `200` → sofort fertig: `{ "calculationId": "...", "resultUrl": "..." }`
- `201` → async: `{ "correlationId": "...", "statusUrl": "..." }` → pollen bis `SUCCESS`

**Verfügbare `variant`-Werte:** `LIST` · `PIVOT` · `PIVOT_AS_LIST` · `COMPARISON`

**Verfügbare `context`-Werte:** `VISITOR` · `SESSION` · `PAGE` · `ACTION` · `ATOMIC` · `NONE`

**Zeitfilter `value1` Optionen (Auswahl):**

```
last_7_days · last_14_days · last_28_days
last_14_days_previous_year
```

Für festen Zeitraum: `"name": "time_range"`, `"filterPredicate": "BETWEEN"`,  
`"value1": "2025-01-01 00:00:00"`, `"value2": "2025-01-31 00:00:00"`

---

### Metriken & Dimensionen (Projekt-relevant)

| Interner Name | Bedeutung | Typ |
|---|---|---|
| `product` | Produkt-SKU | Dimension |
| `product_category_text_2` | Produktkategorie | Dimension |
| `product_category_text_12` | Occasion | Dimension |
| `products_viewed_qty` | Anzahl Views | Metrik |
| `products_purchased_qty` | Anzahl Käufe | Metrik |
| `products_purchased_value` | Umsatz (€) | Metrik |
| `product_parameter_number_561_qty` | Anzahl Rücksendungen | Metrik |
| `product_parameter_number_561_sum` | Rücksendewert (€) | Metrik |

---

### Caching

- Token-Cache: ~12h (Token-Gültigkeit)
- Report-Daten-Cache: **6h** (konfiguriert in `mapp_analytics_client.py`)

---

## Bekannte Probleme & Workarounds

| Problem | Lösung |
|---|---|
| `kafka-python` inkompatibel mit Python 3.13 | `kafka-python-ng` verwenden |
| `uvicorn.exe` von Windows Security blockiert | `python -m uvicorn main:app ...` |

---

## Backlog / Roadmap

Detaillierte Phasen: [docs/ROADMAP.md](docs/ROADMAP.md)

| Phase | Aufgabe | Status |
|---|---|---|
| 1 | React + FastAPI Grundstruktur, Kafka-Consumer, Segment-Simulation | ✅ Done |
| 2 | Kafka-Credentials einbinden, `USE_MOCK=false`, Feldnamen prüfen | ⬜ Next |
| 3 | Echte Segmente via Mapp MCP oder Analytics API (userId-Lookup) | ⬜ Backlog |
| 4 | Historical & E-Commerce mit echter MI API (`analysis-query`) | ⬜ Backlog |
| 5 | Returner-Segment (Custom Tracking Events oder OMS/ERP-Feed) | ⬜ Backlog |
| – | Forecast-Persistenz (localStorage) | ⬜ Backlog |
| – | Hardcoded €41K / 167 Orders durch Live-Daten ersetzen | ⬜ Backlog |
| – | Docker-Setup für stabiles Deployment | ⬜ Backlog |

---

*Zuletzt aktualisiert: 2026-04-16*
