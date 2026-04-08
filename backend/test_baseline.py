import asyncio
from mapp_analytics_client import fetch_baseline

async def test():
    data = await fetch_baseline()

    print("Top 5 SKUs by return rate:")
    for r in data["by_sku"][:5]:
        print(f"  {r['key']:20}  return: {r['return_rate_qty']}%  revenue: {r['revenue']:,.0f}  orders: {r['orders']}")

    print()
    print("Categories:")
    for r in data["by_category"]:
        print(f"  {r['key']:30}  return: {r['return_rate_qty']}%  net_revenue: {r['net_revenue']:,.0f}")

    print()
    print("Occasions:")
    for r in data["by_occasion"][:5]:
        print(f"  {r['key']:30}  return: {r['return_rate_qty']}%")

    print()
    print("Summary:", data["summary"])

asyncio.run(test())
