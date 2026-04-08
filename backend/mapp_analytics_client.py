# mapp_analytics_client.py
# Mapp Intelligence Analytics API client — korrekter Flow
# 1. Token   POST /oauth/token
# 2. Query   POST /report-query  (vollstaendiges configuration-Objekt)
# 3. Result  GET  /analysis-result/{calculationId}  (direkt, kein Polling noetig)

import httpx
import asyncio
import base64
import json
import time
from typing import Optional
from config import settings

BASE_URL = "https://intelligence.eu.mapp.com/analytics/api"

# ── Report configuration (exakt aus MI kopiert, Element-IDs aus Report 1176) ──
REPORT_CONFIG = {
    "configuration": {
        "id": 1176,
        "title": "Export for Realtime Dashboard",
        "description": "",
        "elements": [
            {
                "id": 259656,
                "type": "ANALYSIS",
                "config": {
                    "title": "Product SKUs",
                    "columns": [
                        {"name": "product", "scope": "OBJECT", "context": "ATOMIC", "variant": "NORMAL", "lowerLimit": 1, "upperLimit": 500},
                        {"name": "products_viewed_qty", "columnPeriod": "ANALYSIS", "sortDirection": "DESCENDING", "sortIndex": 1, "scope": "OBJECT", "context": "ATOMIC", "variant": "NORMAL"},
                        {"name": "products_purchased_qty", "columnPeriod": "ANALYSIS", "scope": "OBJECT", "context": "ATOMIC", "variant": "NORMAL"},
                        {"name": "products_purchased_value", "columnPeriod": "ANALYSIS", "scope": "OBJECT", "context": "ATOMIC", "variant": "NORMAL"},
                        {"name": "product_parameter_number_561_qty", "columnPeriod": "ANALYSIS", "scope": "OBJECT", "context": "ATOMIC"},
                        {"name": "product_parameter_number_561_sum", "columnPeriod": "ANALYSIS", "scope": "OBJECT", "context": "ATOMIC"}
                    ],
                    "variant": "LIST"
                }
            },
            {
                "id": 259658,
                "type": "ANALYSIS",
                "config": {
                    "title": "Product Category",
                    "columns": [
                        {"name": "product_category_text_2", "scope": "OBJECT", "context": "ATOMIC", "lowerLimit": 1, "upperLimit": 50},
                        {"name": "products_viewed_qty", "columnPeriod": "ANALYSIS", "sortDirection": "DESCENDING", "sortIndex": 1, "scope": "OBJECT", "context": "ATOMIC", "variant": "NORMAL"},
                        {"name": "products_purchased_qty", "columnPeriod": "ANALYSIS", "scope": "OBJECT", "context": "ATOMIC", "variant": "NORMAL"},
                        {"name": "products_purchased_value", "columnPeriod": "ANALYSIS", "scope": "OBJECT", "context": "ATOMIC", "variant": "NORMAL"},
                        {"name": "product_parameter_number_561_qty", "columnPeriod": "ANALYSIS", "scope": "OBJECT", "context": "ATOMIC"},
                        {"name": "product_parameter_number_561_sum", "columnPeriod": "ANALYSIS", "scope": "OBJECT", "context": "ATOMIC"}
                    ],
                    "variant": "LIST"
                }
            },
            {
                "id": 259660,
                "type": "ANALYSIS",
                "config": {
                    "title": "Product Context",
                    "columns": [
                        {"name": "product_category_text_12", "scope": "OBJECT", "context": "ATOMIC", "lowerLimit": 1, "upperLimit": 50},
                        {"name": "products_viewed_qty", "columnPeriod": "ANALYSIS", "sortDirection": "DESCENDING", "sortIndex": 1, "scope": "OBJECT", "context": "ATOMIC", "variant": "NORMAL"},
                        {"name": "products_purchased_qty", "columnPeriod": "ANALYSIS", "scope": "OBJECT", "context": "ATOMIC", "variant": "NORMAL"},
                        {"name": "products_purchased_value", "columnPeriod": "ANALYSIS", "scope": "OBJECT", "context": "ATOMIC", "variant": "NORMAL"},
                        {"name": "product_parameter_number_561_qty", "columnPeriod": "ANALYSIS", "scope": "OBJECT", "context": "ATOMIC"},
                        {"name": "product_parameter_number_561_sum", "columnPeriod": "ANALYSIS", "scope": "OBJECT", "context": "ATOMIC"}
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
            "caseSensitive": False
        }
    }
}

# ── Token Manager ──────────────────────────────────────────────────────────────

class TokenManager:
    def __init__(self):
        self._token: Optional[str] = None
        self._expires_at: float = 0

    def _credentials(self) -> str:
        return base64.b64encode(
            f"{settings.mapp_client_id}:{settings.mapp_client_secret}".encode()
        ).decode()

    async def get(self) -> str:
        if self._token and time.time() < self._expires_at - 60:
            return self._token
        print("[MI] Fetching token ...")
        async with httpx.AsyncClient() as c:
            r = await c.post(
                f"{BASE_URL}/oauth/token",
                params={"grant_type": "client_credentials", "scope": "mapp.intelligence-api"},
                headers={"Authorization": f"Basic {self._credentials()}", "Content-Type": "application/x-www-form-urlencoded"},
                timeout=15,
            )
            r.raise_for_status()
            data = r.json()
        self._token = data["access_token"]
        self._expires_at = time.time() + data.get("expires_in", 3600)
        print(f"[MI] Token OK (valid {data.get('expires_in',3600)//60} min)")
        return self._token


token_manager = TokenManager()


# ── Metric calculations ────────────────────────────────────────────────────────

def calc_metrics(views, orders, revenue, returns, return_value) -> dict:
    """Calculate all derived return rate metrics from raw MI values."""
    orders       = float(orders or 0)
    revenue      = float(revenue or 0)
    returns      = float(returns or 0)
    return_value = float(return_value or 0)
    views        = float(views or 0)

    if orders == 0:
        return None

    net_revenue  = round(revenue - return_value, 2)
    net_orders   = max(0, int(orders - returns))

    return {
        "views":              int(views),
        "orders":             int(orders),
        "revenue":            round(revenue, 2),
        "returns":            int(returns),
        "return_value":       round(return_value, 2),
        # Derived
        "return_rate_qty":    round(returns / orders * 100, 1) if orders > 0 else 0,
        "return_rate_value":  round(return_value / revenue * 100, 1) if revenue > 0 else 0,
        "net_revenue":        net_revenue,
        "net_orders":         net_orders,
        "avg_return_value":   round(return_value / returns, 2) if returns > 0 else 0,
        "aov_gross":          round(revenue / orders, 2) if orders > 0 else 0,
        "aov_net":            round(net_revenue / net_orders, 2) if net_orders > 0 else 0,
    }


def parse_rows(rows: list, key_index: int = 0) -> list[dict]:
    """Parse MI result rows into dicts with computed metrics."""
    result = []
    for row in rows:
        if not row or row[key_index] == "0000000000":
            continue  # skip total row
        key     = row[key_index]
        metrics = calc_metrics(
            views        = row[1] if len(row) > 1 else 0,
            orders       = row[2] if len(row) > 2 else 0,
            revenue      = row[3] if len(row) > 3 else 0,
            returns      = row[4] if len(row) > 4 else 0,
            return_value = row[5] if len(row) > 5 else 0,
        )
        if metrics:
            result.append({"key": key, **metrics})
    return sorted(result, key=lambda x: x["return_rate_qty"], reverse=True)


def risk_level(rate: float) -> str:
    if rate >= 25: return "high"
    if rate >= 15: return "medium"
    if rate >= 8:  return "low"
    return "minimal"


# ── Main fetch ─────────────────────────────────────────────────────────────────

async def fetch_baseline() -> dict:
    token = await token_manager.get()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    print("[MI] Starting report query ...")
    async with httpx.AsyncClient() as c:
        r = await c.post(
            f"{BASE_URL}/report-query",
            headers=headers,
            content=json.dumps(REPORT_CONFIG),
            timeout=30,
        )
        r.raise_for_status()
        report = r.json()

    print(f"[MI] Report status: {report['status']} — {len(report['queryStates'])} elements")

    # Fetch each element's result in parallel
    async def fetch_element(state: dict) -> list:
        result_url = state.get("resultUrl")
        if not result_url:
            # Poll if still running
            status_url = state.get("statusUrl", "")
            async with httpx.AsyncClient() as c:
                for _ in range(15):
                    await asyncio.sleep(2)
                    rs = await c.get(status_url, headers=headers, timeout=15)
                    s = rs.json()
                    if s.get("status") == "SUCCESS":
                        result_url = s.get("resultUrl", "")
                        break
        if not result_url:
            return []
        async with httpx.AsyncClient() as c:
            rr = await c.get(result_url, headers=headers, timeout=30)
            rr.raise_for_status()
            return rr.json().get("rows", [])

    results = await asyncio.gather(
        *[fetch_element(state) for state in report["queryStates"]],
        return_exceptions=True
    )

    sku_rows  = results[0] if not isinstance(results[0], Exception) else []
    cat_rows  = results[1] if len(results) > 1 and not isinstance(results[1], Exception) else []
    occ_rows  = results[2] if len(results) > 2 and not isinstance(results[2], Exception) else []

    by_sku      = parse_rows(sku_rows)
    by_category = parse_rows(cat_rows)
    by_occasion = parse_rows(occ_rows)

    # Lookup dicts for live event enrichment
    sku_lookup = {r["key"]: r["return_rate_qty"] for r in by_sku}
    cat_lookup = {r["key"]: r["return_rate_qty"] for r in by_category}
    occ_lookup = {r["key"]: r["return_rate_qty"] for r in by_occasion}

    all_rates = [r["return_rate_qty"] for r in by_category if r["return_rate_qty"] > 0]
    avg_rate  = round(sum(all_rates) / len(all_rates), 1) if all_rates else 0

    print(f"[MI] Baseline ready: {len(by_sku)} SKUs · {len(by_category)} categories · {len(by_occasion)} occasions · avg return rate {avg_rate}%")

    return {
        "by_sku":       by_sku[:200],
        "by_category":  by_category,
        "by_occasion":  by_occasion,
        "sku_lookup":   sku_lookup,
        "cat_lookup":   cat_lookup,
        "occ_lookup":   occ_lookup,
        "summary": {
            "avg_return_rate":   avg_rate,
            "top_risk_category": by_category[0]["key"] if by_category else "",
            "top_risk_occasion": by_occasion[0]["key"] if by_occasion else "",
            "total_skus":        len(by_sku),
        }
    }


# ── Cache ──────────────────────────────────────────────────────────────────────

class BaselineCache:
    def __init__(self, ttl: int = 21600):  # 6h default
        self._data: Optional[dict] = None
        self._fetched_at: float = 0
        self._ttl = ttl
        self._lock = asyncio.Lock()

    async def get(self) -> dict:
        async with self._lock:
            if self._data and time.time() < self._fetched_at + self._ttl:
                return self._data
            self._data = await fetch_baseline()
            self._fetched_at = time.time()
            return self._data

    def invalidate(self):
        self._fetched_at = 0


baseline_cache = BaselineCache()


# ── Live event enrichment ──────────────────────────────────────────────────────

async def enrich_event_with_risk(event: dict, baseline: dict) -> dict:
    """Add MI return risk data to a live Kafka event."""
    product  = event.get("product", {})
    sku      = product.get("name", "")
    category = product.get("category", "")

    sku_rate = baseline["sku_lookup"].get(sku)
    cat_rate = baseline["cat_lookup"].get(category)
    rate     = sku_rate if sku_rate is not None else (cat_rate or 0)

    event["returnRisk"] = {
        "rate":    rate,
        "level":   risk_level(rate),
        "skuRate": sku_rate,
        "catRate": cat_rate,
        "avgRate": baseline["summary"]["avg_return_rate"],
    }
    return event