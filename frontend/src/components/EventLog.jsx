import { useContext } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'
import { SEG_MAP, fmtEur, fmtT } from '../constants.js'

const INT_LABEL = { view: 'Viewed', cart: 'Added to Cart', buy: 'Purchased' }

export default function EventLog() {
  const { recentEvents } = useContext(DashboardContext)

  return (
    <div className="bcard">
      <div className="bcard-hdr">
        <div className="bcard-title">Live Event Log</div>
        <div className="bcard-sub">Last 20 interactions</div>
      </div>
      <div className="ev-list">
        {recentEvents.slice(0, 10).map(ev => {
          const seg    = SEG_MAP[ev.segment] ?? SEG_MAP['once']
          const intCls = ev.interaction ?? 'view'
          const price  = ev.adjusted_price ?? ev.product?.price ?? 0
          const priceStr = intCls === 'view'
            ? '€' + (ev.product?.price ?? 0).toFixed(2)
            : fmtEur(price)

          return (
            <div key={ev._id} className="ev-row">
              <span className="ev-time">{fmtT(new Date(ev.timestamp ?? ev.ts ?? Date.now()))}</span>
              <span className="ev-em">{ev.product?.emoji ?? '🛍'}</span>
              <span className="ev-name">{ev.product?.name ?? '—'}</span>
              <span className={`ev-seg ${seg.id}`}>{seg.icon} {seg.label}</span>
              <span className={`ev-type ${intCls}`}>{INT_LABEL[intCls] ?? intCls}</span>
              <span className={`ev-price ${intCls}`}>{priceStr}</span>
            </div>
          )
        })}
        {recentEvents.length === 0 && (
          <div style={{ padding:'16px 18px', color:'var(--text-muted)', fontSize:12 }}>
            Waiting for events…
          </div>
        )}
      </div>
    </div>
  )
}
