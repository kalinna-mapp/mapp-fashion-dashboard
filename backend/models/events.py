from pydantic import BaseModel
from typing import Literal
from datetime import datetime

class Product(BaseModel):
    name: str
    category: str
    price: float
    emoji: str

class InteractionEvent(BaseModel):
    type: Literal["event"] = "event"
    interaction: Literal["view", "cart", "buy"]
    product: Product
    segment: Literal["party", "beach", "casual", "work", "date"]  # SIMULATED — Occasion category
    adjusted_price: float
    cart_items: int
    timestamp: datetime

class SegmentCounts(BaseModel):
    party: int
    beach: int
    casual: int
    work: int
    date: int

class AggregateMessage(BaseModel):
    type: Literal["aggregate"] = "aggregate"
    revenue: float
    cart_value: float
    orders: int
    cart_count: int
    cart_items: int
    views: int
    rate_revenue: float
    segment_counts: SegmentCounts
