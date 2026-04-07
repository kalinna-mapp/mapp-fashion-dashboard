# mock_stream.py
# Synthetic event generator — mirrors the same output interface as kafka_consumer.py.
# Used when USE_MOCK=true in .env.
#
# SIMULATED — replace with kafka_consumer.py once Kafka credentials are available.
# See docs/SIMULATED.md for the full roadmap.

import asyncio
import random
from datetime import datetime, timezone

PRODUCTS = [
    {"name": "Summer Dress Lina",   "category": "Dresses",     "price": 79.99,  "emoji": "👗"},
    {"name": "Floral Midi Skirt",   "category": "Dresses",     "price": 59.99,  "emoji": "👗"},
    {"name": "Wrap Dress Sienna",   "category": "Dresses",     "price": 94.99,  "emoji": "👗"},
    {"name": "Linen Dress Mara",    "category": "Dresses",     "price": 69.99,  "emoji": "👗"},
    {"name": "Cloud Run Sneaker",   "category": "Shoes",       "price": 129.99, "emoji": "👟"},
    {"name": "Palma Sandal",        "category": "Shoes",       "price": 89.99,  "emoji": "👡"},
    {"name": "Satin Mule Nude",     "category": "Shoes",       "price": 74.99,  "emoji": "👡"},
    {"name": "Ecru Linen Blazer",   "category": "Jackets",     "price": 149.99, "emoji": "🧥"},
    {"name": "Washed Denim Jacket", "category": "Jackets",     "price": 119.99, "emoji": "🧥"},
    {"name": "Silk Scarf Tulum",    "category": "Accessories", "price": 39.99,  "emoji": "🧣"},
    {"name": "Straw Bag Ibiza",     "category": "Accessories", "price": 54.99,  "emoji": "👜"},
    {"name": "Riviera Sunglasses",  "category": "Accessories", "price": 44.99,  "emoji": "🕶️"},
    {"name": "Wide-Leg Jeans Maya", "category": "Trousers",    "price": 99.99,  "emoji": "👖"},
    {"name": "Linen Capri Pants",   "category": "Trousers",    "price": 79.99,  "emoji": "👖"},
    {"name": "Coral Bikini Set",    "category": "Swimwear",    "price": 69.99,  "emoji": "👙"},
    {"name": "Riviera Swimsuit",    "category": "Swimwear",    "price": 84.99,  "emoji": "🩱"},
]

INTERACTION_WEIGHTS = [("view", 60), ("cart", 28), ("buy", 12)]


def weighted_choice(weighted_list: list[tuple]) -> str:
    items, weights = zip(*weighted_list)
    return random.choices(items, weights=weights, k=1)[0]


def make_event() -> dict:
    interaction = weighted_choice(INTERACTION_WEIGHTS)
    product = random.choice(PRODUCTS)
    items = max(1, round(random.gauss(1.8, 0.6)))
    adjusted = round(product["price"] * items, 2)

    return {
        "interaction": interaction,
        "product": {
            "name":     product["name"],
            "category": product["category"],
            "price":    product["price"],
            "emoji":    product["emoji"],
        },
        "basketValue":  adjusted if interaction == "cart" else 0,
        "orderValue":   adjusted if interaction == "buy"  else 0,
        "basketItems":  items if interaction in ("cart", "buy") else 0,
        "adjustedPrice": adjusted,
        "cartItems":    items,
        # SIMULATED — sessionId and userId are fabricated
        "sessionId": f"mock-{random.randint(1000, 9999)}",
        "userId":    f"user-{random.randint(10000, 99999)}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "isMock": True,
    }


async def consume(queue: asyncio.Queue, interval_ms: int = 1000):
    """
    Async mock event generator.
    Puts synthetic events on `queue` at the configured interval.
    Mirrors the same interface as kafka_consumer.consume().
    """
    while True:
        await queue.put(make_event())
        # Occasional burst — 30% chance of a second event shortly after
        if random.random() < 0.30:
            await asyncio.sleep(interval_ms * 0.38 / 1000)
            await queue.put(make_event())
        await asyncio.sleep(interval_ms / 1000)
