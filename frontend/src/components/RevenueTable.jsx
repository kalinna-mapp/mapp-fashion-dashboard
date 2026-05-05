import { useContext } from 'react'
import { DashboardContext } from '../context/dashboardContext.js'
import { SEGS, fmtEurK } from '../constants.js'

const IC_BG = {
  none:     'rgba(139,135,160,0.14)',
  once:     'var(--violet-pale)',
  loyal:    'var(--green-pale)',
  returner: 'var(--amber-pale)',
}

export default function RevenueTable() {
  const { segFinance, segmentCounts, activeSegments } = useContext(DashboardContext)

  const totalRev    = SEGS.reduce((s, sg) => s + (segFinance[sg.id]?.revenue   ?? 0), 0)
  const totalCart   = SEGS.reduce((s, sg) => s + (segFinance[sg.id]?.cartValue ?? 0), 0)
  const totalOrders = SEGS.reduce((s, sg) => s + (segFinance[sg.id]?.orders    ?? 0), 0)
  const totalVis    = Object.values(segmentCounts).reduce((s, v) => s + v, 0)
  const maxRev      = Math.max(totalRev, 1)

  const active = SEGS.filter(s => activeSegments.has(s.id))

  return (
    <div className="bcard">
      <div className="bcard-hdr">
        <div className="bcard-title">Revenue by Segment</div>
        <div className="bcard-sub">Live session totals</div>
      </div>
      <div className="seg-revenue-table">
        {/* Header */}
        <div className="srt-row header">
          <div />
          <div className="srt-header-lbl">Segment</div>
          <div className="srt-header-lbl">Revenue</div>
          <div className="srt-header-lbl">Cart</div>
          <div className="srt-header-lbl">Orders</div>
        </div>

        {/* All visitors row */}
        <div className="srt-row srt-all">
          <div className="srt-icon" style={{ background: 'rgba(45,42,94,0.1)' }}>🌐</div>
          <div>
            <div className="srt-name" style={{ color: 'var(--navy)' }}>All Visitors</div>
            <div className="srt-sub">{totalVis.toLocaleString()} online</div>
          </div>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--navy)' }}>{fmtEurK(totalRev)}</div>
            <div style={{ fontSize:'9.5px', opacity:0.65, fontWeight:600 }}>100%</div>
          </div>
          <div>
            <div style={{ fontSize:12.5, fontWeight:700, color:'var(--pink)' }}>{fmtEurK(totalCart)}</div>
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:600, color:'var(--text-mid)' }}>{totalOrders}</div>
          </div>
        </div>
        <div className="srt-bar-wrap">
          <div className="srt-bar" style={{ width:'100%', background:'linear-gradient(90deg,var(--violet),var(--pink))' }} />
        </div>
        <div className="srt-divider" />

        {/* Per-segment rows */}
        {active.map(seg => {
          const f      = segFinance[seg.id] ?? {}
          const barPct = Math.round(((f.revenue ?? 0) / maxRev) * 100)
          const revPct = totalRev > 0 ? Math.round(((f.revenue ?? 0) / totalRev) * 100) : 0

          return (
            <div key={seg.id}>
              <div className="srt-row">
                <div className="srt-icon" style={{ background: IC_BG[seg.id] }}>{seg.icon}</div>
                <div>
                  <div className="srt-name">{seg.label}</div>
                  <div className="srt-sub">{(segmentCounts[seg.id] ?? 0).toLocaleString()} online</div>
                </div>
                <div>
                  <div className="srt-revenue" style={{ color: seg.color }}>{fmtEurK(f.revenue ?? 0)}</div>
                  <div style={{ fontSize:'9.5px', opacity:0.65, fontWeight:600 }}>{revPct}%</div>
                </div>
                <div className="srt-cart">{fmtEurK(f.cartValue ?? 0)}</div>
                <div className="srt-orders">{f.orders ?? 0}</div>
              </div>
              <div className="srt-bar-wrap">
                <div className="srt-bar" style={{ width: barPct + '%', background: seg.color }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
