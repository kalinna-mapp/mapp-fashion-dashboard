# kafka_consumer.py — Mapp Data Stream consumer v3
# Fixed field mapping based on real observed events

import json
import asyncio
from kafka import KafkaConsumer
from kafka.errors import NoBrokersAvailable
from config import settings

EMOJI_MAP = {
    "tops": "👕", "shirt": "👔", "dress": "👗", "skirt": "👗",
    "shoes": "👟", "boots": "👢", "sandal": "👡", "sneaker": "👟",
    "jacket": "🧥", "coat": "🧥", "blazer": "🧥",
    "trouser": "👖", "jeans": "👖", "pant": "👖",
    "bag": "👜", "scarf": "🧣", "accessories": "👜",
    "swimwear": "👙", "swimsuit": "🩱",
    "technology": "📺", "electronics": "🔌", "soundbar": "🔊",
}

def get_emoji(text: str) -> str:
    t = text.lower()
    for key, emoji in EMOJI_MAP.items():
        if key in t:
            return emoji
    return "🛍"

def extract_cats(categories: dict) -> dict:
    """Extract textValues from a Mapp categories object into flat dict."""
    result = {}
    for key, obj in categories.get("textValues", {}).items():
        result[key] = obj.get("value", "")
    return result

def product_name_from_page(raw: dict) -> str:
    """Extract readable product name from page.name (URL path)."""
    page = raw.get("page") or {}
    name = page.get("name", "")
    if "/" in name:
        # Take last URL segment, remove extension, replace hyphens
        slug = name.rstrip("/").split("/")[-1]
        slug = slug.replace(".html", "").replace("-", " ").replace("_", " ")
        return slug.title()
    return name or "Unknown Product"

def parse_event(raw: dict) -> dict | None:
    basket = raw.get("basket") or {}
    order  = raw.get("order")
    items  = basket.get("items") or []

    # ── Helper: build product dict from basket item ───────────────────
    def make_product(item: dict, fallback_name: str) -> dict:
        prod  = item.get("product") or {}
        cats  = extract_cats(prod.get("categories") or {})
        # Key mapping from observed real data:
        # "2"=type/garment-group, "3"=product-name, "4"=style, "12"=occasion
        # "18"=garment, "23"=line, "21"=fabric
        ptype = cats.get("2", cats.get("18", ""))
        pname = cats.get("3") or prod.get("name") or fallback_name
        return {
            "name":     pname,
            "category": ptype or cats.get("18", "Other"),
            "price":    float(item.get("price", 0)),
            "emoji":    get_emoji(ptype or pname),
            "style":    cats.get("4", ""),
            "occasion": cats.get("12", ""),
            "fabric":   cats.get("21", ""),
            "line":     cats.get("23", ""),
        }

    def make_meta(raw: dict, price: float, qty: int) -> dict:
        return {
            "adjustedPrice": round(price * qty, 2),
            "cartItems":     qty,
            "sessionId":     (raw.get("session") or {}).get("id", ""),
            "userId":        (raw.get("user") or {}).get("id", ""),
            "country":       (raw.get("location") or {}).get("countryCode", ""),
            "device":        (raw.get("device") or {}).get("deviceClass", "Desktop"),
            "browser":       (raw.get("browser") or {}).get("name", ""),
            "timestamp":     raw.get("timestamp", ""),
        }

    # ── Purchase ──────────────────────────────────────────────────────
    if order:
        order_items = order.get("items") or []
        if not order_items and items:
            order_items = items  # fallback to basket items
        if order_items:
            item = order_items[0]
            qty  = int(item.get("quantity", 1))
            prod = make_product(item, product_name_from_page(raw))
            return {"interaction": "buy", "product": prod, **make_meta(raw, prod["price"], qty)}

    # ── Add to Cart ───────────────────────────────────────────────────
    status = basket.get("status", "").lower()
    if status in ("add", "conf", "basket") and items:
        item = items[0]
        qty  = int(item.get("quantity", 1))
        prod = make_product(item, product_name_from_page(raw))
        return {"interaction": "cart", "product": prod, **make_meta(raw, prod["price"], qty)}

    # ── Product View (page with basket item in "View" status) ─────────
    if items and status in ("view", ""):
        item = items[0]
        prod = make_product(item, product_name_from_page(raw))
        return {"interaction": "view", "product": prod, **make_meta(raw, prod["price"], 1)}

    return None  # no relevant product data


async def consume(queue: asyncio.Queue):
    print(f"[Kafka] Connecting to {settings.kafka_bootstrap_servers} ...")
    loop = asyncio.get_event_loop()

    def _connect():
        return KafkaConsumer(
            settings.kafka_topic,
            bootstrap_servers=settings.kafka_bootstrap_servers,
            group_id=settings.kafka_group_id,
            auto_offset_reset="latest",
            enable_auto_commit=True,
            security_protocol="SASL_SSL",
            sasl_mechanism="SCRAM-SHA-256",
            sasl_plain_username=settings.kafka_username,
            sasl_plain_password=settings.kafka_password,
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        )

    try:
        consumer = await loop.run_in_executor(None, _connect)
        print(f"[Kafka] Connected ✓  topic={settings.kafka_topic}")
    except NoBrokersAvailable as e:
        print(f"[Kafka] ✗ Cannot reach broker: {e}")
        raise

    total = relevant = 0
    while True:
        records = await loop.run_in_executor(
            None, lambda: consumer.poll(timeout_ms=1000)
        )
        for tp, messages in records.items():
            for msg in messages:
                try:
                    total += 1
                    event = parse_event(msg.value)
                    if event:
                        relevant += 1
                        await queue.put(event)
                        if relevant % 20 == 0:
                            print(f"[Kafka] {relevant} relevant / {total} total")
                except Exception as e:
                    print(f"[Kafka] Parse error: {e}")
