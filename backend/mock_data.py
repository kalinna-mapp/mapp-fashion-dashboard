# mock_data.py
# Static mock datasets for historical traffic and e-commerce tabs.
# SIMULATED — replace each dataset with a real Analytics API call.
# See docs/SIMULATED.md for the replacement roadmap.

HISTORICAL_TRAFFIC = [
    {"date": f"2025-02-{d:02d}", "visits": 3200 + d * 80 + (d % 3) * 120,
     "pageViews": 9800 + d * 200, "bounceRate": 28.4 - d * 0.1,
     "avgDuration": "3:42"} for d in range(1, 29)
]

HISTORICAL_DEVICES = {
    "desktop": 54, "mobile": 38, "tablet": 8
}

HISTORICAL_GEO = [
    {"country": "Germany",     "flag": "🇩🇪", "visitors": 61200},
    {"country": "Austria",     "flag": "🇦🇹", "visitors": 18900},
    {"country": "Switzerland", "flag": "🇨🇭", "visitors": 14500},
    {"country": "Netherlands", "flag": "🇳🇱", "visitors": 9800},
    {"country": "France",      "flag": "🇫🇷", "visitors": 7400},
    {"country": "Other",       "flag": "🌍",  "visitors": 16600},
]

HISTORICAL_BROWSERS = {
    "Chrome": 47, "Firefox": 19, "Safari": 18, "Edge": 12, "Other": 4
}

HISTORICAL_TOP_PAGES = [
    {"page": "/damen/kleider",    "visits": 8240},
    {"page": "/sale/sommer",      "visits": 6180},
    {"page": "/schuhe/sneaker",   "visits": 4920},
    {"page": "/herren/jacken",    "visits": 3760},
    {"page": "/accessoires",      "visits": 2890},
    {"page": "/bademode",         "visits": 2340},
    {"page": "/neue-kollektion",  "visits": 1980},
    {"page": "/sale",             "visits": 1760},
    {"page": "/marken",           "visits": 1540},
    {"page": "/",                 "visits": 1320},
]

ECOMMERCE_DAILY = [
    {"date": f"2025-02-{d:02d}",
     "revenue": 18400 + d * 620 + (d % 5) * 800,
     "orders": 210 + d * 7,
     "aov": 65.50 + d * 0.3,
     "conversionRate": 3.2 + d * 0.02} for d in range(1, 29)
]

ECOMMERCE_CATEGORIES = [
    {"category": "Dresses",     "revenue": 248000, "change": 18},
    {"category": "Shoes",       "revenue": 189000, "change": 12},
    {"category": "Jackets",     "revenue": 144000, "change": -4},
    {"category": "Accessories", "revenue": 117000, "change": 21},
    {"category": "Trousers",    "revenue": 91000,  "change": 7},
    {"category": "Swimwear",    "revenue": 53000,  "change": -2},
]

# FW = Frühjahr/Sommer (Feb–Jul), HW = Herbst/Winter (Aug–Jan)
SEASON_FW_2025 = {
    "label": "FW 2025", "dateRange": "Feb – Jul 2025",
    "visits": 284712, "pageViews": 1240000,
    "revenue": 842000, "orders": 12847, "conversionRate": 3.82,
}
SEASON_HW_2024 = {
    "label": "HW 2024", "dateRange": "Aug 2024 – Jan 2025",
    "visits": 262800, "pageViews": 1115000,
    "revenue": 734000, "orders": 11750, "conversionRate": 3.42,
}

USER_SEGMENTS_ECOMMERCE = {
    "party":  {"label": "Party / Night Out",   "pct": 20},
    "beach":  {"label": "Beach / Holiday",     "pct": 20},
    "casual": {"label": "Casual / Everyday",   "pct": 20},
    "work":   {"label": "Work / Office",       "pct": 20},
    "date":   {"label": "Date Night",          "pct": 20},
}
