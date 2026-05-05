import { useContext } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'
import { fmtEurK } from '../constants.js'

export default function GlobalKpiStrip() {
  const { revenue, cartValue, orders, cartCount, cartItems, views, rateRevenue } = useContext(DashboardContext)

  const aov      = orders > 0 ? fmtEurK(revenue / orders) : '€0'
  const avgCart  = cartCount > 0 ? (cartItems / cartCount).toFixed(1) : '0'
  const conv     = views > 0 ? ((orders / views) * 100).toFixed(1) + '%' : '0.0%'
  const revRate  = fmtEurK(rateRevenue || 0) + ' / min'

  return (
    <div className="global-kpis">
      <div className="gkpi revenue">
        <div className="gkpi-label">Revenue</div>
        <div className="gkpi-value">{fmtEurK(revenue)}</div>
        <div className="gkpi-rate">{revRate}</div>
      </div>

      <div className="gkpi cart-val">
        <div className="gkpi-label">Cart Value</div>
        <div className="gkpi-value">{fmtEurK(cartValue)}</div>
        <div className="gkpi-rate">{cartCount} items in carts</div>
      </div>

      <div className="gkpi orders">
        <div className="gkpi-label">Orders</div>
        <div className="gkpi-value">{orders.toLocaleString('en-US')}</div>
        <div className="gkpi-sub">Ø {aov} / order</div>
      </div>

      <div className="gkpi cart-sz">
        <div className="gkpi-label">Avg Cart Size</div>
        <div className="gkpi-value">{avgCart}</div>
        <div className="gkpi-sub">items per cart</div>
      </div>

      <div className="gkpi views">
        <div className="gkpi-label">Page Views</div>
        <div className="gkpi-value">{views.toLocaleString('en-US')}</div>
        <div className="gkpi-sub">this session</div>
      </div>

      <div className="gkpi conv">
        <div className="gkpi-label">Conv. Rate</div>
        <div className="gkpi-value">{conv}</div>
        <div className="gkpi-sub">views → orders</div>
      </div>
    </div>
  )
}
