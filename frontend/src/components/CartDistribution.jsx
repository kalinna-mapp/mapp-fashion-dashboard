import { useContext } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'
import { SEGS, fmtEurK } from '../constants.js'

const SEG_COLOR = {
  none:     'var(--seg-none)',
  once:     'var(--seg-once)',
  loyal:    'var(--seg-loyal)',
  returner: 'var(--seg-returner)',
}

export default function CartDistribution() {
  const { segFinance, activeSegments } = useContext(DashboardContext)
  const active = SEGS.filter(s => activeSegments.has(s.id))

  const maxAvg = Math.max(
    ...active.map(s => {
      const f = segFinance[s.id] ?? {}
      return f.cartCount > 0 ? f.cartValue / f.cartCount : 0
    }),
    1
  )

  return (
    <div className="bcard">
      <div className="bcard-hdr">
        <div className="bcard-title">Avg Cart Value</div>
        <div className="bcard-sub">By customer segment</div>
      </div>
      <div className="cart-dist">
        {active.map(seg => {
          const f        = segFinance[seg.id] ?? {}
          const avg      = f.cartCount > 0 ? f.cartValue / f.cartCount : 0
          const pct      = Math.round((avg / maxAvg) * 100)
          const avgItems = f.cartCount > 0 ? (f.cartItems / f.cartCount).toFixed(1) : '—'

          return (
            <div key={seg.id} className="cd-row">
              <div className="cd-label">{seg.icon} {seg.label}</div>
              <div className="cd-bar-wrap">
                <div className="cd-bar" style={{ width: pct + '%', background: SEG_COLOR[seg.id] }} />
              </div>
              <div className="cd-val" style={{ color: SEG_COLOR[seg.id] }}>
                {avg > 0 ? fmtEurK(avg) : '—'}
              </div>
              <div className="cd-count">{avgItems} items</div>
            </div>
          )
        })}
        {active.length === 0 && (
          <div style={{ color:'var(--text-muted)', fontSize:12, padding:'8px 0' }}>No segments selected</div>
        )}
      </div>
    </div>
  )
}
