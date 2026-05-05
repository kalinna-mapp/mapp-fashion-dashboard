import { useContext } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'
import { SEGS, fmtEurK } from '../constants.js'

export default function SegmentCards() {
  const { segmentCounts, segFinance, activeSegments, segHist, toggleSeg } = useContext(DashboardContext)

  const total = Object.values(segmentCounts).reduce((s, v) => s + v, 0) || 1

  return (
    <div className="seg-grid">
      {SEGS.map(seg => {
        const isActive = activeSegments.has(seg.id)
        const count    = segmentCounts[seg.id] ?? 0
        const pct      = Math.round((count / total) * 100)
        const f        = segFinance[seg.id] ?? {}
        const hist     = segHist[seg.id] ?? []
        const maxH     = Math.max(...hist, 1)
        const aov      = f.orders > 0 ? fmtEurK(f.revenue / f.orders) : '—'
        const avgCart  = f.cartCount > 0 ? (f.cartItems / f.cartCount).toFixed(1) : '—'

        return (
          <div
            key={seg.id}
            className={`seg-card ${seg.id}${isActive ? ' active' : ' inactive'}`}
            onClick={() => toggleSeg(seg.id)}
          >
            <div className="seg-top">
              <div className="seg-icon">{seg.icon}</div>
              <div className="seg-check">✓</div>
            </div>

            <div className="seg-name">{seg.label}</div>
            <div className="seg-visitors">{count.toLocaleString('en-US')}</div>

            <div className="seg-pct-row">
              <span className="seg-sub">visitors</span>
              <span className="seg-pct">{pct}%</span>
            </div>

            <div className="seg-metrics">
              <div className="sm-item">
                <div className="sm-label">Revenue</div>
                <div className="sm-value hi">{fmtEurK(f.revenue ?? 0)}</div>
                <div className="sm-sub">{f.orders ?? 0} orders</div>
              </div>
              <div className="sm-item">
                <div className="sm-label">Cart</div>
                <div className="sm-value hi">{fmtEurK(f.cartValue ?? 0)}</div>
                <div className="sm-sub">{f.cartCount ?? 0} in cart</div>
              </div>
              <div className="sm-item">
                <div className="sm-label">AOV</div>
                <div className="sm-value">{aov}</div>
                <div className="sm-sub">Ø {avgCart} items</div>
              </div>
            </div>

            <div className="seg-spark">
              {(hist.length > 0 ? hist : [0, 0, 0, 0]).map((v, i) => (
                <div
                  key={i}
                  className="spark-b"
                  style={{ height: Math.max(Math.round((v / maxH) * 100), 5) + '%' }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
